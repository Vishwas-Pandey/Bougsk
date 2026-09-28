import { promises as fs } from "fs";
import path from "path";
import type { OrderStatus, PaymentStatus, RefundStatus, ShippingAddress } from "./types";

// Local stand-in for the real Supabase `orders`/`order_items` tables — a
// single JSON file, shared with the admin app (../backend/local-data/orders.json),
// so an order placed on the storefront actually shows up in the admin panel
// without needing a real backend yet. Server-only: never imported by a
// "use client" file directly (see serverOrders.ts for the Server Actions
// that expose this to client components).
const FILE_PATH = path.join(process.cwd(), "..", "backend", "local-data", "orders.json");

// Normalized shape — matches the real Postgres schema (and the admin app's
// types) more closely than the frontend's own denormalized Order+items
// convenience type. Converting between the two happens in serverOrders.ts.
export interface SharedOrderRecord {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: ShippingAddress;
  billing_address?: ShippingAddress;
  subtotal_inr: number;
  discount_inr: number;
  taxable_amount_inr: number;
  tax_rate_percent: number;
  tax_amount_inr: number;
  shipping_fee_inr: number;
  total_inr: number;
  payment_status: PaymentStatus;
  payment_gateway_order_id: string;
  payment_gateway_payment_id: string | null;
  gst_invoice_number?: string;
  buyer_gstin?: string;
  refund_status: RefundStatus;
  refund_amount_inr?: number;
  refund_reason?: string;
  refunded_at?: string;
  order_status: OrderStatus;
  courier_name: string;
  tracking_number: string;
  notes: string;
  is_gift: boolean;
  gift_message?: string;
  recipient_name?: string;
  gift_wrap_requested: boolean;
  created_at: string;
}

export interface SharedOrderItemRecord {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  variant_name: string;
  unit_price_inr: number;
  quantity: number;
  line_total_inr: number;
  hsn_code?: string;
}

interface SharedStore {
  orders: SharedOrderRecord[];
  order_items: SharedOrderItemRecord[];
}

export async function readSharedStore(): Promise<SharedStore> {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf-8");
    return JSON.parse(raw) as SharedStore;
  } catch {
    return { orders: [], order_items: [] };
  }
}

export async function writeSharedStore(store: SharedStore): Promise<void> {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(store, null, 2), "utf-8");
}
