// Real-backend order reads/writes for the admin panel — used instead of
// the local JSON mock store (lib/serverOrders.ts) once a Supabase project
// is actually connected. Reads go straight through the admin's own
// authenticated Supabase client (RLS's "admins full access to orders"
// policy, migration 0002, covers this). Writes that touch order_status,
// courier/tracking, or anything payment/refund-related go through the
// matching admin-only Edge Function instead of a direct table write, so
// every change still gets its audit-log row and customer email exactly
// as the real backend is designed to produce them.

import { supabase } from "./supabaseAdminClient";
import type { Order, OrderItem, OrderStatus } from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function functionCall(name: string, body: Record<string, unknown>): Promise<void> {
  if (!supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Supabase is not configured.");
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error("Your session has expired. Please sign in again.");

  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `${name} failed (${res.status}).`);
  }
}

export async function fetchRealOrders(): Promise<{ orders: Order[]; orderItems: OrderItem[] }> {
  if (!supabase) return { orders: [], orderItems: [] };

  const [{ data: orders, error: ordersError }, { data: orderItems, error: itemsError }] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    supabase.from("order_items").select("*"),
  ]);

  if (ordersError) throw new Error(ordersError.message);
  if (itemsError) throw new Error(itemsError.message);

  return { orders: (orders ?? []) as Order[], orderItems: (orderItems ?? []) as OrderItem[] };
}

export async function callUpdateOrderStatus(
  orderId: string,
  orderStatus: OrderStatus,
  courierName?: string,
  trackingNumber?: string,
): Promise<void> {
  await functionCall("update-order-status", {
    order_id: orderId,
    order_status: orderStatus,
    ...(courierName !== undefined ? { courier_name: courierName } : {}),
    ...(trackingNumber !== undefined ? { tracking_number: trackingNumber } : {}),
  });
}

export async function callRefundOrder(orderId: string, amountInr?: number, reason?: string): Promise<void> {
  await functionCall("refund-order", {
    order_id: orderId,
    ...(amountInr !== undefined ? { amount_inr: amountInr } : {}),
    reason: reason || "Refunded by admin",
  });
}
