// verify-payment: called by the browser right after Razorpay Checkout
// reports success. Recomputes the payment signature server-side and, only
// if it matches, marks the order paid. Idempotent — safe to call more than
// once for the same order.

import { createClient } from "npm:@supabase/supabase-js@2";
import { hmacSha256Hex, timingSafeEqual } from "../_shared/crypto.ts";
import { sendPaymentConfirmedEmail } from "../_shared/email.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;
const ALLOWED_ORIGIN = Deno.env.get("STOREFRONT_ORIGIN") ?? "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface VerifyPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let payload: VerifyPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return jsonResponse({ error: "Missing Razorpay fields" }, 400);
  }

  const expectedSignature = await hmacSha256Hex(
    RAZORPAY_KEY_SECRET,
    `${razorpay_order_id}|${razorpay_payment_id}`,
  );

  if (!timingSafeEqual(expectedSignature, razorpay_signature)) {
    return jsonResponse({ error: "Signature mismatch" }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: order, error: findError } = await supabase
    .from("orders")
    .select("id, payment_status, gst_invoice_number, order_number, customer_name, customer_email, total_inr")
    .eq("payment_gateway_order_id", razorpay_order_id)
    .maybeSingle();

  if (findError) {
    return jsonResponse({ error: "Failed to look up order", detail: findError.message }, 500);
  }
  if (!order) {
    return jsonResponse({ error: "Order not found for this Razorpay order id" }, 404);
  }

  // Idempotent: another call path (the webhook) may have already confirmed
  // this order. Don't re-write, just report success — in particular, don't
  // generate a second GST invoice number for an already-paid order.
  if (order.payment_status === "paid") {
    return jsonResponse({ status: "already_confirmed", gst_invoice_number: order.gst_invoice_number });
  }

  // GST invoice number is generated exactly once, on the transition to
  // paid, from a Postgres sequence — never derived from a count/max in
  // application code (see gst_invoice_seq + generate_gst_invoice_number(),
  // migration 0004).
  const { data: gstInvoiceNumber, error: invoiceSeqError } = await supabase.rpc("generate_gst_invoice_number");
  if (invoiceSeqError) {
    return jsonResponse({ error: "Failed to generate GST invoice number", detail: invoiceSeqError.message }, 500);
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      order_status: "confirmed",
      payment_gateway_payment_id: razorpay_payment_id,
      gst_invoice_number: gstInvoiceNumber,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (updateError) {
    return jsonResponse({ error: "Failed to update order", detail: updateError.message }, 500);
  }

  sendPaymentConfirmedEmail({
    order_number: order.order_number,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    total_inr: order.total_inr,
    gst_invoice_number: gstInvoiceNumber,
  }).catch((err) => console.error("verify-payment: payment-confirmed email failed", err));

  return jsonResponse({ status: "confirmed", gst_invoice_number: gstInvoiceNumber });
});
