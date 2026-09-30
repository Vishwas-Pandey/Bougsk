// The real checkout path — used once a Supabase project is actually
// connected (see lib/supabaseClient.ts). Calls the deployed create-order /
// verify-payment Edge Functions directly from the browser with the public
// anon key, exactly like any other Supabase client. The cart itself still
// carries the mock catalog's ids until the storefront's browse pages are
// wired to real reads too, so every cart line is re-resolved to its real
// product/variant row (by slug/name) right before checkout — create-order
// re-prices from those real rows regardless, so this is only about finding
// the right row, never about trusting a price from here.

import type { CartLine, ShippingAddress } from "./types";
import { supabase } from "./supabaseClient";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export interface RealCheckoutInput {
  lines: CartLine[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  isGift: boolean;
  giftMessage: string;
  recipientName: string;
  giftWrapRequested: boolean;
  buyerGstin: string;
}

export interface CreateOrderResult {
  razorpay_order_id: string;
  razorpay_key_id: string;
  order_number: string;
  total_inr: number;
}

async function resolveRealItems(lines: CartLine[]) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const slugs = [...new Set(lines.map((l) => l.product.slug))];
  const { data: realProducts, error: productsError } = await supabase
    .from("products")
    .select("id, slug")
    .in("slug", slugs);
  if (productsError) throw new Error(`Could not look up products: ${productsError.message}`);

  const productIdBySlug = new Map((realProducts ?? []).map((p) => [p.slug, p.id as string]));
  const missing = slugs.filter((s) => !productIdBySlug.has(s));
  if (missing.length > 0) {
    throw new Error(`These items are no longer available: ${missing.join(", ")}`);
  }

  const realProductIds = [...productIdBySlug.values()];
  const { data: realVariants, error: variantsError } = await supabase
    .from("product_variants")
    .select("id, name, product_id")
    .in("product_id", realProductIds);
  if (variantsError) throw new Error(`Could not look up product variants: ${variantsError.message}`);

  return lines.map((line) => {
    const realProductId = productIdBySlug.get(line.product.slug)!;
    let realVariantId: string | undefined;
    if (line.variant) {
      const match = (realVariants ?? []).find(
        (v) => v.product_id === realProductId && v.name === line.variant!.name,
      );
      if (!match) {
        throw new Error(`"${line.product.name} — ${line.variant.name}" is no longer available.`);
      }
      realVariantId = match.id;
    }
    return {
      product_id: realProductId,
      variant_id: realVariantId,
      quantity: line.quantity,
    };
  });
}

export async function createRealOrder(input: RealCheckoutInput): Promise<CreateOrderResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Supabase is not configured.");

  const items = await resolveRealItems(input.lines);

  const res = await fetch(`${SUPABASE_URL}/functions/v1/create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      items,
      shipping_address: input.shippingAddress,
      billing_address: input.billingAddress,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      buyer_gstin: input.buyerGstin || undefined,
      is_gift: input.isGift,
      gift_message: input.giftMessage || undefined,
      recipient_name: input.recipientName || undefined,
      gift_wrap_requested: input.giftWrapRequested,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Could not create the order.");
  }
  return data as CreateOrderResult;
}

export async function verifyRealPayment(response: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ gst_invoice_number?: string }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Supabase is not configured.");

  const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(response),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Payment verification failed.");
  }
  return data as { gst_invoice_number?: string };
}
