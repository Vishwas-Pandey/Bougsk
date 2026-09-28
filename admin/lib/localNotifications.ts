"use server";

import { promises as fs } from "fs";
import path from "path";

// Local stand-in for the real Resend-based emails (see
// backend/functions/_shared/email.ts and update-order-status/index.ts) —
// logs what *would* have been sent to the same shared file the frontend
// writes to, so a single "Notifications" page can show the whole story.
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

export async function fetchNotifications(): Promise<NotificationRecord[]> {
  return readAll();
}

async function logNotification(to: string, subject: string, body: string): Promise<void> {
  const all = await readAll();
  all.push({ id: crypto.randomUUID(), to, subject, body, sent_at: new Date().toISOString() });
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(all, null, 2), "utf-8");
}

function inr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

interface OrderForNotify {
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_inr: number;
  courier_name?: string;
  tracking_number?: string;
  refund_amount_inr?: number;
}

export async function logOrderPacked(o: OrderForNotify): Promise<void> {
  await logNotification(
    o.customer_email,
    `Your Bougsk order ${o.order_number} has been packed`,
    `Hi ${o.customer_name},\n\n${o.order_number} has been packed by hand and is ready to go. We'll send the tracking details once it leaves us.\n\n— Bougsk`
  );
}

export async function logOrderShipped(o: OrderForNotify): Promise<void> {
  await logNotification(
    o.customer_email,
    `Your Bougsk order ${o.order_number} is on its way`,
    `Hi ${o.customer_name},\n\n${o.order_number} shipped today with ${o.courier_name || "our courier"}. Tracking number: ${o.tracking_number || "to follow"}.\n\n— Bougsk`
  );
}

export async function logOutForDelivery(o: OrderForNotify): Promise<void> {
  await logNotification(
    o.customer_email,
    `Your Bougsk order ${o.order_number} is out for delivery`,
    `Hi ${o.customer_name},\n\n${o.order_number} is out for delivery today with ${o.courier_name || "our courier"} (${o.tracking_number || "tracking to follow"}).\n\n— Bougsk`
  );
}

export async function logOrderDelivered(o: OrderForNotify): Promise<void> {
  await logNotification(
    o.customer_email,
    `Your Bougsk order ${o.order_number} has arrived`,
    `Hi ${o.customer_name},\n\n${o.order_number} has been delivered. We hope it's a candle worth keeping lit. If you share an unboxing photo and tag us, we may feature it.\n\n— Bougsk`
  );
}

export async function logRefundConfirmed(o: OrderForNotify): Promise<void> {
  await logNotification(
    o.customer_email,
    `Refund confirmed for order ${o.order_number}`,
    `Hi ${o.customer_name},\n\nYour refund of ${inr(o.refund_amount_inr ?? o.total_inr)} for order ${o.order_number} has been processed. It should reach your original payment method within a few business days.\n\n— Bougsk`
  );
}
