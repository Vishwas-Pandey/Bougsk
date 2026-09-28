// refund-order: admin-only Edge Function that initiates a Razorpay refund
// for an order and, for a pre-shipment cancellation, releases its stock
// and marks it cancelled. This is one of exactly two code paths allowed
// to write payment_status/refund_status (the other is the webhook's
// async confirmation) — the admin panel itself has no direct column edit
// for either field.
//
// Authorization model: the caller must present a valid Supabase Auth JWT
// (in the Authorization header) for a user who is in the `admins` table.
// We check that with the same is_admin() helper the RLS policies use,
// via a client scoped to the caller's own JWT — then do the actual writes
// with the service role, same as every other Edge Function here.
//
// Cancellation-after-shipping is NOT this function's job: once an order
// has shipped, "refund" means a physical return, and the admin records
// the outcome manually once the item is actually back — see the guard
// below.

import { createClient } from "npm:@supabase/supabase-js@2";
import { resolveRefundAmount } from "../_shared/refund.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")!;
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

// Admin panel origin — may differ from the public storefront's, so it's
// its own env var. Same "no wildcard fallback" policy as create-order.
const ALLOWED_ORIGIN = Deno.env.get("ADMIN_ORIGIN");
if (!ALLOWED_ORIGIN) {
  console.error("refund-order: ADMIN_ORIGIN is not set — refusing to advertise any CORS origin");
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

interface RefundPayload {
  order_id: string;
  amount_inr?: number; // omitted = full remaining order total (partial refund if less)
  reason: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Missing Authorization header" }, 401);
  }

  // Scoped to the caller's own JWT — RLS applies, so this can only ever
  // see/do what that specific user is allowed to.
  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData?.user) {
    return jsonResponse({ error: "Invalid or expired session" }, 401);
  }

  const { data: isAdmin, error: isAdminError } = await callerClient.rpc("is_admin");
  if (isAdminError || !isAdmin) {
    return jsonResponse({ error: "Admin access required" }, 403);
  }

  let payload: RefundPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { order_id, amount_inr, reason } = payload;
  if (!order_id || !reason) {
    return jsonResponse({ error: "order_id and reason are required" }, 400);
  }
  if (amount_inr !== undefined && typeof amount_inr !== "number") {
    return jsonResponse({ error: "amount_inr must be a positive number" }, 400);
  }

  // From here on, use the service role — same as every other write path
  // in this backend, so RLS is bypassed deliberately and centrally, not
  // per-caller.
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, order_number, order_status, payment_status, refund_status, total_inr, payment_gateway_payment_id",
    )
    .eq("id", order_id)
    .maybeSingle();

  if (orderError) {
    return jsonResponse({ error: "Failed to load order", detail: orderError.message }, 500);
  }
  if (!order) {
    return jsonResponse({ error: "Order not found" }, 404);
  }
  if (order.payment_status !== "paid") {
    return jsonResponse({ error: "Only a paid order can be refunded" }, 400);
  }
  if (order.refund_status === "initiated" || order.refund_status === "completed") {
    return jsonResponse({ error: `Refund already ${order.refund_status} for this order` }, 409);
  }
  if (!order.payment_gateway_payment_id) {
    return jsonResponse({ error: "Order has no captured payment to refund" }, 400);
  }

  // Cancellation-after-shipping is a return, not this automatic path —
  // the admin records the outcome manually once the item is physically
  // back. Refuse to auto-cancel or release stock for a shipped-or-later
  // order; a manual DB update (or a future dedicated "process return"
  // function) handles that case instead.
  if (
    order.order_status === "shipped" ||
    order.order_status === "out_for_delivery" ||
    order.order_status === "delivered"
  ) {
    return jsonResponse(
      {
        error:
          `Order ${order.order_number} has already ${order.order_status}. ` +
          "This function only auto-cancels and releases stock for a pre-shipment refund — " +
          "handle a post-shipment return manually once the item is back.",
      },
      409,
    );
  }

  const resolved = resolveRefundAmount(Number(order.total_inr), amount_inr);
  if ("error" in resolved) {
    return jsonResponse({ error: resolved.error }, 400);
  }
  const refundAmount = resolved.amountInr;

  // Call Razorpay's refund API for the given amount against the
  // order's captured payment.
  let razorpayRefund: { id: string };
  try {
    const basicAuth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const res = await fetch(
      `https://api.razorpay.com/v1/payments/${order.payment_gateway_payment_id}/refund`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(refundAmount * 100), // paise
          notes: { reason, order_number: order.order_number },
        }),
      },
    );
    const body = await res.json();
    if (!res.ok) {
      return jsonResponse({ error: "Razorpay refund request failed", detail: body }, 502);
    }
    razorpayRefund = body;
  } catch (err) {
    return jsonResponse({ error: "Failed to call Razorpay refund API", detail: `${err}` }, 502);
  }

  // Record the refund as initiated immediately — the webhook confirms
  // completed/failed asynchronously (see razorpay-webhook's
  // handleRefundEvent). Release stock and cancel the order now: it's a
  // pre-shipment cancellation, so the goods haven't gone anywhere.
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      refund_status: "initiated",
      razorpay_refund_id: razorpayRefund.id,
      refund_amount_inr: refundAmount,
      refund_reason: reason,
      order_status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (updateError) {
    return jsonResponse(
      {
        error: "Refund was created at Razorpay but the order could not be updated — reconcile manually",
        razorpay_refund_id: razorpayRefund.id,
        detail: updateError.message,
      },
      500,
    );
  }

  const { error: stockError } = await supabase.rpc("release_stock_for_order", { p_order_id: order.id });
  if (stockError) {
    console.error(`refund-order: failed to release stock for ${order.order_number}`, stockError.message);
    // The refund + cancellation already succeeded; a stock-release
    // failure is logged for manual follow-up rather than failing the
    // whole request (the customer's money is already on its way back).
  }

  // Best-effort audit trail — never blocks the response.
  const { error: auditError } = await supabase.from("admin_audit_logs").insert({
    admin_id: userData.user.id,
    action: "order.refund_initiated",
    entity_type: "order",
    entity_id: order.id,
    old_value: { refund_status: order.refund_status, order_status: order.order_status },
    new_value: { refund_status: "initiated", order_status: "cancelled", refund_amount_inr: refundAmount },
  });
  if (auditError) {
    console.error("refund-order: failed to write audit log", auditError.message);
  }

  return jsonResponse({
    status: "initiated",
    razorpay_refund_id: razorpayRefund.id,
    refund_amount_inr: refundAmount,
  });
});
