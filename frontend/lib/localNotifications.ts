import { promises as fs } from "fs";
import path from "path";

// Local stand-in for the real Resend-based emails (see
// backend/functions/_shared/email.ts) — since no Resend account is
// connected yet, this just logs what *would* have been sent to a shared
// file the admin app can display. Swap this for a real fetch("/functions/v1/...")
// call once a Supabase project exists; the call sites don't need to change.
const FILE_PATH = path.join(process.cwd(), "..", "backend", "local-data", "notifications.json");

export interface NotificationRecord {
  id: string;
  to: string;
  subject: string;
  body: string;
  sent_at: string;
}

async function readAll(): Promise<NotificationRecord[]> {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf-8");
    return JSON.parse(raw) as NotificationRecord[];
  } catch {
    return [];
  }
}

export async function logNotification(to: string, subject: string, body: string): Promise<void> {
  const all = await readAll();
  all.push({ id: crypto.randomUUID(), to, subject, body, sent_at: new Date().toISOString() });
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(all, null, 2), "utf-8");
}

function inr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export async function logOrderConfirmed(order: {
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_inr: number;
  gst_invoice_number?: string;
}): Promise<void> {
  await logNotification(
    order.customer_email,
    `Your Bougsk order ${order.order_number} is confirmed`,
    `Hi ${order.customer_name},\n\nGot it — order ${order.order_number} for ${inr(order.total_inr)} is confirmed. We'll write again once it's packed and on its way.\n\n— Bougsk`
  );
  // Mock mode marks payment as paid immediately (see serverOrders.ts), so
  // the payment-confirmation email fires right alongside — in production
  // these are two separate emails from two separate real events
  // (create-order, then verify-payment).
  await logNotification(
    order.customer_email,
    `Payment received for order ${order.order_number}`,
    `Hi ${order.customer_name},\n\nPayment of ${inr(order.total_inr)} for order ${order.order_number} came through.${
      order.gst_invoice_number ? ` Your GST invoice number is ${order.gst_invoice_number}.` : ""
    }\n\n— Bougsk`
  );
}
