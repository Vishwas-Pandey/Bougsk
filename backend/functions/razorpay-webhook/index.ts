// razorpay-webhook: server-to-server confirmation from Razorpay. This is
// the belt-and-braces second path that confirms payment even if the
// customer closes the tab before verify-payment's client-side call
// completes. Always answers Razorpay with 2xx quickly — Razorpay retries
// aggressively on non-2xx, so business-logic edge cases are logged, not
// thrown.

import { createClient } from "npm:@supabase/supabase-js@2";
import { hmacSha256Hex, timingSafeEqual } from "../_shared/crypto.ts";
import { sendPaymentConfirmedEmail, sendRefundConfirmedEmail } from "../_shared/email.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RAZORPAY_WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET")!;

interface RazorpayWebhookBody {
  event: string;
  payload: {
    payment?: {
      entity?: {
        id: string;
        order_id: string;
        status: string;
      };
    };
    refund?: {
      entity?: {
        id: string; // rfnd_...
        payment_id: string;
        status: string;
      };
    };
  };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  // Signature must be verified against the RAW body — parse only after.
  const rawBody = await req.text();
  const signature = req.headers.get("X-Razorpay-Signature") ?? "";

  const expectedSignature = await hmacSha256Hex(RAZORPAY_WEBHOOK_SECRET, rawBody);

  if (!signature || !timingSafeEqual(expectedSignature, signature)) {
    console.error("razorpay-webhook: signature mismatch, rejecting");
    // Razorpay does not retry 4xx as aggressively as 5xx, and an invalid
    // signature is never something a retry will fix — 400 is correct here.
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  let body: RazorpayWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    console.error("razorpay-webhook: could not parse body as JSON");
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  // Always ack with 200 past this point — we've verified authenticity,
  // any remaining problem is a business-logic edge case to log, not fail.
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    if (body.event === "payment.captured") {
      await handlePaymentCaptured(supabase, body);
    } else if (body.event === "refund.processed" || body.event === "refund.failed") {
      // v1.2: refund-order (admin-initiated) sets refund_status =
      // 'initiated' immediately when it calls Razorpay's refund API. This
      // webhook is the async confirmation that flips it to its final
      // state once Razorpay has actually settled the refund. Reusing this
      // same function (rather than a separate refund-webhook) keeps the
      // signature-verification/idempotency plumbing in one place, since
      // both are just "Razorpay tells us something happened server-side".
      await handleRefundEvent(supabase, body);
    } else {
      return new Response(JSON.stringify({ received: true, ignored: body.event }), { status: 200 });
    }
  } catch (err) {
    console.error("razorpay-webhook: unexpected error", err);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});

async function handlePaymentCaptured(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  body: RazorpayWebhookBody,
) {
  const payment = body.payload?.payment?.entity;
  if (!payment?.order_id || !payment?.id) {
    console.error("razorpay-webhook: payment.captured event missing order_id/payment id");
    return;
  }

  const { data: order, error: findError } = await supabase
    .from("orders")
    .select("id, payment_status, order_number, customer_name, customer_email, total_inr")
    .eq("payment_gateway_order_id", payment.order_id)
    .maybeSingle();

  if (findError) {
    console.error("razorpay-webhook: failed to look up order", findError.message);
    return;
  }
  if (!order) {
    console.error(`razorpay-webhook: no order found for Razorpay order ${payment.order_id}`);
    return;
  }

  // Idempotent: verify-payment may have already confirmed this order.
  if (order.payment_status === "paid") {
    return;
  }

  // Same GST invoice generation as verify-payment, and for the same
  // reason: exactly once, only on the transition to paid.
  const { data: gstInvoiceNumber, error: invoiceSeqError } = await supabase.rpc("generate_gst_invoice_number");
  if (invoiceSeqError) {
    console.error("razorpay-webhook: failed to generate GST invoice number", invoiceSeqError.message);
    return;
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      order_status: "confirmed",
      payment_gateway_payment_id: payment.id,
      gst_invoice_number: gstInvoiceNumber,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (updateError) {
    console.error("razorpay-webhook: failed to update order", updateError.message);
    return;
  }

  sendPaymentConfirmedEmail({
    order_number: order.order_number,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    total_inr: order.total_inr,
    gst_invoice_number: gstInvoiceNumber,
  }).catch((err) => console.error("razorpay-webhook: payment-confirmed email failed", err));
}

async function handleRefundEvent(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  body: RazorpayWebhookBody,
) {
  const refund = body.payload?.refund?.entity;
  if (!refund?.id) {
    console.error(`razorpay-webhook: ${body.event} event missing refund id`);
    return;
  }

  const { data: order, error: findError } = await supabase
    .from("orders")
    .select("id, refund_status, refund_amount_inr, order_number, customer_name, customer_email, total_inr")
    .eq("razorpay_refund_id", refund.id)
    .maybeSingle();

  if (findError) {
    console.error("razorpay-webhook: failed to look up order by refund id", findError.message);
    return;
  }
  if (!order) {
    // Nothing to do — this refund wasn't initiated through refund-order
    // (or the id hasn't been recorded yet), so there's no row to update.
    console.error(`razorpay-webhook: no order found for Razorpay refund ${refund.id}`);
    return;
  }

  // Idempotent: don't flip a refund that's already reached a final state.
  if (order.refund_status === "completed" || order.refund_status === "failed") {
    return;
  }

  const nextStatus = body.event === "refund.processed" ? "completed" : "failed";

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      refund_status: nextStatus,
      refunded_at: nextStatus === "completed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (updateError) {
    console.error("razorpay-webhook: failed to update refund status", updateError.message);
    return;
  }

  if (nextStatus === "completed") {
    sendRefundConfirmedEmail({
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      total_inr: order.total_inr,
      refund_amount_inr: order.refund_amount_inr,
    }).catch((err) => console.error("razorpay-webhook: refund-confirmed email failed", err));
  }
}
