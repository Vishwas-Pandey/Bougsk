import type { Order, OrderItem } from "./types";

// Build Spec §Backup & recovery: "a simple scheduled export (weekly is enough
// at launch scale) of orders/order_items/products kept outside Supabase
// entirely — this is the cheap insurance policy against the 'project
// deleted' case." This is that export, run on demand from the admin panel
// rather than on a schedule (no server to run a cron job on client-side
// code) — the recovery procedure notes to run it regularly.

function csvCell(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  // Quote any cell that contains a comma, quote, or newline; double up
  // internal quotes per the CSV spec (RFC 4180).
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function formatAddress(address: Order["shipping_address"] | undefined): string {
  if (!address) return "";
  return [address.line1, address.line2, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(", ");
}

const HEADERS = [
  "Order Number",
  "Placed At",
  "Customer Name",
  "Email",
  "Phone",
  "Shipping Address",
  "Items",
  "Subtotal (INR)",
  "Discount (INR)",
  "Tax Rate (%)",
  "Tax (INR)",
  "Shipping (INR)",
  "Total (INR)",
  "Payment Status",
  "Order Status",
  "Refund Status",
  "GST Invoice Number",
  "Buyer GSTIN",
  "Courier",
  "Tracking Number",
  "Is Gift",
];

export function ordersToCsv(orders: Order[], orderItems: OrderItem[]): string {
  const rows = orders.map((o) => {
    const items = orderItems
      .filter((i) => i.order_id === o.id)
      .map((i) => `${i.product_name}${i.variant_name ? ` (${i.variant_name})` : ""} x${i.quantity}`)
      .join("; ");

    return [
      o.order_number,
      o.created_at,
      o.customer_name,
      o.customer_email,
      o.customer_phone,
      formatAddress(o.shipping_address),
      items,
      o.subtotal_inr,
      o.discount_inr,
      o.tax_rate_percent,
      o.tax_amount_inr,
      o.shipping_fee_inr,
      o.total_inr,
      o.payment_status,
      o.order_status,
      o.refund_status,
      o.gst_invoice_number ?? "",
      o.buyer_gstin ?? "",
      o.courier_name ?? "",
      o.tracking_number ?? "",
      o.is_gift ? "yes" : "no",
    ]
      .map(csvCell)
      .join(",");
  });

  return [HEADERS.map(csvCell).join(","), ...rows].join("\r\n");
}

export function downloadCsv(filename: string, csv: string): void {
  // Leading BOM so Excel (still the most common opener for this file)
  // detects UTF-8 and doesn't mangle the ₹ symbol or non-ASCII names.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
