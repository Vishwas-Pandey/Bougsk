// create-order: validates a cart against the live catalogue, computes the
// real total server-side (subtotal, GST/tax, shipping), opens a Razorpay
// order for that total, and atomically decrements stock + writes the
// pending `orders` + `order_items` rows. This is the only place customer
// orders are ever inserted (service role key bypasses RLS).
//
// v1.2 changes from the original v1.0 version:
//   - order numbers now come from a Postgres sequence (order_number_seq)
//     instead of `count(orders)+1`, which raced under concurrent orders.
//   - stock decrement is now a single conditional UPDATE per line item,
//     executed inside the same DB transaction as the order/order_items
//     insert (see create_order_tx in migration 0004) — no more
//     read-then-write race on stock_quantity.
//   - GST/tax calculation, gifting fields, billing address, HSN snapshot.
//   - CORS is locked to STOREFRONT_ORIGIN with no "*" fallback.
//   - requires a signed-in customer (migration 0010) — browsing and the
//     cart stay anonymous, but placing an order does not.

import { createClient } from "npm:@supabase/supabase-js@2";
import Razorpay from "npm:razorpay@2";
import { isValidPhone, isValidPincode } from "../_shared/validation.ts";
import { sendOrderConfirmedEmail, sendAdminNewOrderEmail } from "../_shared/email.ts";

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")!;
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

// Callable by any signed-in customer, so it must not be scrapable by an
// arbitrary third-party site. No "*" fallback: if STOREFRONT_ORIGIN isn't
// configured, we fail safe by simply not sending the CORS header at all
// (browsers then refuse the cross-origin response) rather than silently
// allowing every origin.
const ALLOWED_ORIGIN = Deno.env.get("STOREFRONT_ORIGIN");
if (!ALLOWED_ORIGIN) {
  console.error("create-order: STOREFRONT_ORIGIN is not set — refusing to advertise any CORS origin");
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
if (ALLOWED_ORIGIN) corsHeaders["Access-Control-Allow-Origin"] = ALLOWED_ORIGIN;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface CartItem {
  product_id: string;
  variant_id?: string;
  quantity: number;
}

interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

interface CreateOrderPayload {
  items: CartItem[];
  shipping_address: Address;
  billing_address?: Address; // omitted/null = same as shipping_address
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  buyer_gstin?: string;
  is_gift?: boolean;
  gift_message?: string;
  recipient_name?: string;
  gift_wrap_requested?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // Placing an order requires a signed-in customer (browsing and cart
  // stay open to anyone) — see migration 0010. The publishable anon key
  // this function used to accept from any anonymous visitor is not a
  // user session, so authClient.auth.getUser() correctly rejects it here
  // too: this is the actual enforcement point, not just a frontend
  // redirect to /login.
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await authClient.auth.getUser(jwt);
  if (userError || !userData.user) {
    return jsonResponse({ error: "Sign in to place an order." }, 401);
  }
  const userId = userData.user.id;

  let payload: CreateOrderPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const {
    items,
    shipping_address,
    billing_address,
    customer_name,
    customer_email,
    customer_phone,
    buyer_gstin,
    is_gift,
    gift_message,
    recipient_name,
    gift_wrap_requested,
  } = payload;

  if (!Array.isArray(items) || items.length === 0) {
    return jsonResponse({ error: "Cart is empty" }, 400);
  }
  if (!shipping_address || !customer_name || !customer_email || !customer_phone) {
    return jsonResponse({ error: "Missing customer or shipping details" }, 400);
  }
  for (const item of items) {
    if (!item.product_id || !Number.isInteger(item.quantity) || item.quantity < 1) {
      return jsonResponse({ error: "Invalid item in cart" }, 400);
    }
  }

  // Reject malformed input at the boundary, not downstream.
  if (!isValidPhone(customer_phone)) {
    return jsonResponse({ error: "customer_phone must be a 10-digit Indian mobile number" }, 400);
  }
  if (!shipping_address.pincode || !isValidPincode(shipping_address.pincode)) {
    return jsonResponse({ error: "shipping_address.pincode must be 6 digits" }, 400);
  }
  if (billing_address && (!billing_address.pincode || !isValidPincode(billing_address.pincode))) {
    return jsonResponse({ error: "billing_address.pincode must be 6 digits" }, 400);
  }
  if (is_gift && !recipient_name) {
    return jsonResponse({ error: "recipient_name is required when is_gift is true" }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Each call opens a real Razorpay order and reserves stock (see
  // create_order_tx below), so an unrestricted customer could spam this
  // into a stock-pinning DoS or a wall of abandoned Razorpay orders —
  // rate-limit by the signed-in user, same check_rate_limit primitive
  // track-order already uses.
  const { data: rateAllowed, error: rateError } = await supabase.rpc("check_rate_limit", {
    p_key: `create-order:user:${userId}`,
    p_max_attempts: 20,
    p_window_minutes: 10,
  });
  if (rateError) {
    console.error("create-order: rate limit check failed", rateError.message);
    return jsonResponse({ error: "Something went wrong. Please try again." }, 500);
  }
  if (!rateAllowed) {
    return jsonResponse({ error: "Too many attempts. Please wait a few minutes and try again." }, 429);
  }

  // Build the order lines from the REAL, current database rows.
  // We never trust a price (or even a product name) the client sends —
  // the client only tells us WHAT and HOW MANY, never how much it costs.
  // This is the single security invariant the whole checkout flow rests on.
  const orderLines: Array<{
    product_id: string;
    variant_id: string | null;
    product_name: string;
    variant_name: string | null;
    unit_price_inr: number;
    quantity: number;
    line_total_inr: number;
    hsn_code: string | null;
  }> = [];

  for (const item of items) {
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, price_inr, stock_quantity, is_active, hsn_code")
      .eq("id", item.product_id)
      .maybeSingle();

    if (productError) {
      console.error("create-order: product lookup failed", productError.message);
      return jsonResponse({ error: "Failed to load product" }, 500);
    }
    if (!product) {
      return jsonResponse({ error: `Product ${item.product_id} not found` }, 400);
    }
    if (!product.is_active) {
      return jsonResponse({ error: `${product.name} is not currently available` }, 400);
    }

    let unitPrice = Number(product.price_inr);
    let variantName: string | null = null;
    let availableStock = product.stock_quantity;

    if (item.variant_id) {
      const { data: variant, error: variantError } = await supabase
        .from("product_variants")
        .select("id, name, price_inr, stock_quantity, product_id, is_active")
        .eq("id", item.variant_id)
        .maybeSingle();

      if (variantError) {
        console.error("create-order: variant lookup failed", variantError.message);
        return jsonResponse({ error: "Failed to load variant" }, 500);
      }
      if (!variant || variant.product_id !== product.id) {
        return jsonResponse({ error: `Variant ${item.variant_id} not found for ${product.name}` }, 400);
      }
      if (!variant.is_active) {
        return jsonResponse({ error: `${product.name} (${variant.name}) is no longer available` }, 400);
      }

      unitPrice = Number(variant.price_inr);
      variantName = variant.name;
      availableStock = variant.stock_quantity;
    }

    // A quick pre-check for a fast, specific error message. The real,
    // race-proof enforcement happens inside create_order_tx's conditional
    // UPDATE below — this check can go stale between here and there under
    // concurrent checkouts, and that's fine, because the transaction is
    // the actual source of truth.
    if (availableStock < item.quantity) {
      return jsonResponse(
        { error: `${product.name}${variantName ? ` (${variantName})` : ""} is out of stock` },
        400,
      );
    }

    const lineTotal = unitPrice * item.quantity;
    orderLines.push({
      product_id: product.id,
      variant_id: item.variant_id ?? null,
      product_name: product.name,
      variant_name: variantName,
      unit_price_inr: unitPrice,
      quantity: item.quantity,
      line_total_inr: lineTotal,
      hsn_code: product.hsn_code ?? null,
    });
  }

  const subtotal = orderLines.reduce((sum, line) => sum + line.line_total_inr, 0);

  // Shipping fee and GST rate are admin-configurable, read fresh for
  // every order and snapshotted onto the order row — a later change to
  // either setting must never retroactively affect a past order.
  const { data: settingsRows, error: settingsError } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["shipping_fee_inr", "tax_rate_percent"]);

  if (settingsError) {
    console.error("create-order: site settings lookup failed", settingsError.message);
    return jsonResponse({ error: "Failed to load site settings" }, 500);
  }

  const settingsMap = new Map((settingsRows ?? []).map((row) => [row.key, row.value]));
  const shippingFee = Number(settingsMap.get("shipping_fee_inr") ?? 0);
  const taxRatePercent = Number(settingsMap.get("tax_rate_percent") ?? 0);

  // Atomically: decrement stock per line item (conditionally, so it can
  // never go negative), compute subtotal/tax/total, and insert the order
  // + order_items — all inside one Postgres transaction (see
  // create_order_tx, migration 0004). If any line item doesn't have
  // enough stock, the whole call raises and nothing is written — no
  // partial order, no partial stock decrement.
  //
  // The Razorpay order is deliberately created AFTER this, using the
  // total THIS call returns, rather than a total recomputed independently
  // in JS beforehand. Tax math is money math: doing it in exactly one
  // place (Postgres `numeric`, not a second parallel copy in JS floats)
  // is what guarantees the amount we charge can never drift by a paisa
  // from the amount we persist and invoice against.
  const { data: txResult, error: txError } = await supabase.rpc("create_order_tx", {
    p_customer_name: customer_name,
    p_customer_email: customer_email,
    p_customer_phone: customer_phone,
    p_shipping_address: shipping_address,
    p_billing_address: billing_address ?? null,
    p_is_gift: Boolean(is_gift),
    p_gift_message: gift_message ?? null,
    p_recipient_name: recipient_name ?? null,
    p_gift_wrap_requested: Boolean(gift_wrap_requested),
    p_buyer_gstin: buyer_gstin ?? null,
    p_shipping_fee_inr: shippingFee,
    p_tax_rate_percent: taxRatePercent,
    p_razorpay_order_id: null, // attached below, once Razorpay has actually created an order
    p_items: orderLines,
    p_user_id: userId,
  });

  if (txError) {
    const match = /^OUT_OF_STOCK:(.*)$/.exec(txError.message ?? "");
    if (match) {
      return jsonResponse({ error: `${match[1]} is out of stock` }, 400);
    }
    console.error("create-order: create_order_tx failed", txError.message);
    return jsonResponse({ error: "Failed to create order" }, 500);
  }

  const result = txResult as {
    order_id: string;
    order_number: string;
    subtotal_inr: number;
    taxable_amount_inr: number;
    tax_amount_inr: number;
    total_inr: number;
  };

  const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

  let razorpayOrder;
  try {
    razorpayOrder = await razorpay.orders.create({
      amount: Math.round(result.total_inr * 100),
      currency: "INR",
      receipt: result.order_number,
      notes: { order_number: result.order_number },
    });
  } catch (err) {
    // The order + stock decrement already happened (see above). Without a
    // Razorpay order, this order can never be paid, so unwind it right
    // away instead of waiting on the 30-minute stale-order sweep — same
    // "best effort cleanup" spirit as the original v1.0 code.
    await supabase.rpc("release_stock_for_order", { p_order_id: result.order_id });
    await supabase
      .from("orders")
      .update({
        order_status: "cancelled",
        notes: "Cancelled automatically: failed to open a Razorpay order.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", result.order_id);
    console.error("create-order: Razorpay order creation failed", err);
    return jsonResponse({ error: "Failed to create Razorpay order" }, 502);
  }

  const { error: attachError } = await supabase
    .from("orders")
    .update({ payment_gateway_order_id: razorpayOrder.id, updated_at: new Date().toISOString() })
    .eq("id", result.order_id);

  if (attachError) {
    console.error("create-order: failed to link Razorpay order", attachError.message);
    return jsonResponse({ error: "Failed to link Razorpay order" }, 500);
  }

  // Fire-and-forget: an email delivery hiccup must never fail an order that
  // already succeeded. Payment confirmation is a separate email, sent by
  // verify-payment/razorpay-webhook once the customer actually pays.
  const emailOrder = {
    order_number: result.order_number,
    customer_name,
    customer_email,
    total_inr: result.total_inr,
  };
  sendOrderConfirmedEmail(emailOrder).catch((err) =>
    console.error("create-order: order-confirmed email failed", err),
  );
  if (ADMIN_EMAIL) {
    sendAdminNewOrderEmail(ADMIN_EMAIL, emailOrder).catch((err) =>
      console.error("create-order: admin new-order email failed", err),
    );
  }

  return jsonResponse({
    razorpay_order_id: razorpayOrder.id,
    razorpay_key_id: RAZORPAY_KEY_ID,
    order_number: result.order_number,
    subtotal_inr: result.subtotal_inr,
    tax_amount_inr: result.tax_amount_inr,
    total_inr: result.total_inr,
  });
});
