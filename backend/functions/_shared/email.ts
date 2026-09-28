// Transactional email via Resend's free tier (Build Spec §Email notifications).
// Every template lives here so the wording is written once, in the Brand
// Bible's voice (warm, plain, no exclamation marks), not re-derived per
// call site. Triggered directly from the Edge Function that owns each state
// change — never a separate cron job re-deriving "what happened."
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_ADDRESS = Deno.env.get("NOTIFICATIONS_FROM_EMAIL") ?? "Bougsk <orders@bougskcandles.example>";

export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  if (!RESEND_API_KEY) {
    // Not configured yet — log and move on rather than failing the request
    // that triggered this (an order confirming successfully must never
    // depend on email delivery succeeding).
    console.error("sendEmail: RESEND_API_KEY not set, skipping send:", subject, "->", to);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to, subject, text }),
    });
    if (!res.ok) {
      console.error("sendEmail: Resend API error", res.status, await res.text());
    }
  } catch (err) {
    console.error("sendEmail: failed to reach Resend", err);
  }
}

interface OrderForEmail {
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_inr: number;
  gst_invoice_number?: string;
  courier_name?: string;
  tracking_number?: string;
}

function inr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export async function sendOrderConfirmedEmail(order: OrderForEmail): Promise<void> {
  await sendEmail(
    order.customer_email,
    `Your Bougsk order ${order.order_number} is confirmed`,
    `Hi ${order.customer_name},\n\nGot it — order ${order.order_number} for ${inr(order.total_inr)} is confirmed. We'll write again once it's packed and on its way.\n\n— Bougsk`,
  );
}

export async function sendPaymentConfirmedEmail(order: OrderForEmail): Promise<void> {
  const invoiceLine = order.gst_invoice_number
    ? `Your GST invoice number is ${order.gst_invoice_number}.`
    : "";
  await sendEmail(
    order.customer_email,
    `Payment received for order ${order.order_number}`,
    `Hi ${order.customer_name},\n\nPayment of ${inr(order.total_inr)} for order ${order.order_number} came through. ${invoiceLine}\n\n— Bougsk`,
  );
}

export async function sendOrderPackedEmail(order: OrderForEmail): Promise<void> {
  await sendEmail(
    order.customer_email,
    `Your Bougsk order ${order.order_number} has been packed`,
    `Hi ${order.customer_name},\n\n${order.order_number} has been packed by hand and is ready to go. We'll send the tracking details once it leaves us.\n\n— Bougsk`,
  );
}

export async function sendOrderShippedEmail(order: OrderForEmail): Promise<void> {
  await sendEmail(
    order.customer_email,
    `Your Bougsk order ${order.order_number} is on its way`,
    `Hi ${order.customer_name},\n\n${order.order_number} shipped today with ${order.courier_name || "our courier"}. Tracking number: ${order.tracking_number || "to follow"}.\n\n— Bougsk`,
  );
}

export async function sendOutForDeliveryEmail(order: OrderForEmail): Promise<void> {
  await sendEmail(
    order.customer_email,
    `Your Bougsk order ${order.order_number} is out for delivery`,
    `Hi ${order.customer_name},\n\n${order.order_number} is out for delivery today with ${order.courier_name || "our courier"} (${order.tracking_number || "tracking to follow"}).\n\n— Bougsk`,
  );
}

export async function sendOrderDeliveredEmail(order: OrderForEmail): Promise<void> {
  await sendEmail(
    order.customer_email,
    `Your Bougsk order ${order.order_number} has arrived`,
    `Hi ${order.customer_name},\n\n${order.order_number} has been delivered. We hope it's a candle worth keeping lit. If you share an unboxing photo and tag us, we may feature it.\n\n— Bougsk`,
  );
}

export async function sendRefundConfirmedEmail(
  order: OrderForEmail & { refund_amount_inr?: number },
): Promise<void> {
  await sendEmail(
    order.customer_email,
    `Refund confirmed for order ${order.order_number}`,
    `Hi ${order.customer_name},\n\nYour refund of ${inr(order.refund_amount_inr ?? order.total_inr)} for order ${order.order_number} has been processed. It should reach your original payment method within a few business days.\n\n— Bougsk`,
  );
}

// Admin-facing notifications — a single owner inbox, per site_settings' admin_email.
export async function sendAdminNewOrderEmail(adminEmail: string, order: OrderForEmail): Promise<void> {
  await sendEmail(
    adminEmail,
    `New order ${order.order_number} — ${inr(order.total_inr)}`,
    `New order from ${order.customer_name}: ${order.order_number}, ${inr(order.total_inr)}.`,
  );
}

export async function sendAdminLowStockEmail(
  adminEmail: string,
  productName: string,
  stockQuantity: number,
): Promise<void> {
  await sendEmail(
    adminEmail,
    `Low stock: ${productName}`,
    `${productName} just dropped to ${stockQuantity} in stock.`,
  );
}
