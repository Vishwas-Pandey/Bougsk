"use server";

import type { CartLine, Order, ShippingAddress } from "./types";
import { products, siteSettings } from "./mockData";
import {
  readSharedStore,
  writeSharedStore,
  type SharedOrderRecord,
  type SharedOrderItemRecord,
} from "./sharedOrdersFile";
import { logOrderConfirmed } from "./localNotifications";

// Mirrors the real create-order Edge Function's shape (re-price server-side,
// never trust the browser), but against the shared local JSON file instead
// of Supabase — see backend/functions/create-order/index.ts for the real
// version this stands in for. This file is the one place the storefront
// writes an order, and the admin app reads the exact same file.

function nextOrderNumber(existing: SharedOrderRecord[]): string {
  const max = existing.reduce((m, o) => {
    const n = Number(o.order_number.replace(/^BOUGSK-/, ""));
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 1037); // matches the admin seed data's numbering (BOUGSK-1038..1042)
  return `BOUGSK-${max + 1}`;
}

function toFrontendOrder(order: SharedOrderRecord, items: SharedOrderItemRecord[]): Order {
  return {
    ...order,
    items: items
      .filter((i) => i.order_id === order.id)
      .map((i) => ({
        product_id: i.product_id,
        product_name: i.product_name,
        variant_name: i.variant_name || undefined,
        hsn_code: i.hsn_code,
        unit_price_inr: i.unit_price_inr,
        quantity: i.quantity,
        line_total_inr: i.line_total_inr,
      })),
  };
}

export interface PlaceOrderInput {
  lines: CartLine[];
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  isGift: boolean;
  giftMessage?: string;
  recipientName?: string;
  giftWrapRequested: boolean;
  buyerGstin?: string;
}

export async function createOrderAction(input: PlaceOrderInput): Promise<Order> {
  // Re-price every line from the server's own product catalogue — the same
  // "never trust the browser for price" invariant as the real backend,
  // just against mockData.ts instead of Postgres.
  const orderLines = input.lines.map((line) => {
    const product = products.find((p) => p.id === line.product.id);
    const variant = line.variant
      ? product?.variants?.find((v) => v.id === line.variant!.id)
      : undefined;
    const unitPrice = variant?.price_inr ?? product?.price_inr ?? line.product.price_inr;
    return {
      product_id: line.product.id,
      product_name: product?.name ?? line.product.name,
      variant_name: variant?.name ?? "",
      unit_price_inr: unitPrice,
      quantity: line.quantity,
      line_total_inr: unitPrice * line.quantity,
      hsn_code: product?.hsn_code,
    };
  });

  const subtotalInr = orderLines.reduce((sum, l) => sum + l.line_total_inr, 0);
  const discountInr = 0;
  const taxableAmountInr = subtotalInr - discountInr;
  const taxRatePercent = siteSettings.tax_rate_percent;
  const taxAmountInr = Math.round((taxableAmountInr * taxRatePercent) / 100);
  const shippingFeeInr =
    subtotalInr >= siteSettings.free_shipping_threshold_inr ? 0 : siteSettings.shipping_fee_inr;
  const totalInr = taxableAmountInr + taxAmountInr + shippingFeeInr;

  const store = await readSharedStore();
  const orderNumber = nextOrderNumber(store.orders);
  const numericSuffix = orderNumber.replace(/^BOUGSK-/, "");
  const orderId = crypto.randomUUID();

  const order: SharedOrderRecord = {
    id: orderId,
    order_number: orderNumber,
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    shipping_address: input.shippingAddress,
    billing_address: input.billingAddress,
    subtotal_inr: subtotalInr,
    discount_inr: discountInr,
    taxable_amount_inr: taxableAmountInr,
    tax_rate_percent: taxRatePercent,
    tax_amount_inr: taxAmountInr,
    shipping_fee_inr: shippingFeeInr,
    total_inr: totalInr,
    // Mock mode marks it paid immediately since no payment gateway is wired
    // up yet — a real order starts 'pending' until verify-payment confirms
    // Razorpay's signature.
    payment_status: "paid",
    payment_gateway_order_id: `pg_order_mock_${orderId.slice(0, 8)}`,
    payment_gateway_payment_id: `pg_pay_mock_${orderId.slice(0, 8)}`,
    gst_invoice_number: `BOUGSK-INV-${numericSuffix}`,
    buyer_gstin: input.buyerGstin || undefined,
    refund_status: "none",
    order_status: "confirmed",
    courier_name: "",
    tracking_number: "",
    notes: "",
    is_gift: input.isGift,
    gift_message: input.isGift ? input.giftMessage : undefined,
    recipient_name: input.isGift ? input.recipientName : undefined,
    gift_wrap_requested: input.giftWrapRequested,
    created_at: new Date().toISOString(),
  };

  const items: SharedOrderItemRecord[] = orderLines.map((line, i) => ({
    id: `${orderId}-item-${i}`,
    order_id: orderId,
    ...line,
  }));

  await writeSharedStore({
    orders: [...store.orders, order],
    order_items: [...store.order_items, ...items],
  });

  await logOrderConfirmed({
    order_number: order.order_number,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    total_inr: order.total_inr,
    gst_invoice_number: order.gst_invoice_number,
  });

  return toFrontendOrder(order, items);
}

export async function getOrderByNumberAction(orderNumber: string): Promise<Order | null> {
  const store = await readSharedStore();
  const order = store.orders.find((o) => o.order_number === orderNumber);
  if (!order) return null;
  return toFrontendOrder(order, store.order_items);
}

export async function trackOrderAction(
  orderNumber: string,
  phone: string
): Promise<Order | null> {
  const store = await readSharedStore();
  const order = store.orders.find(
    (o) => o.order_number.toLowerCase() === orderNumber.toLowerCase().trim()
  );
  if (!order) return null;
  const digitsOnly = (v: string) => v.replace(/\D/g, "");
  if (!digitsOnly(order.customer_phone).endsWith(digitsOnly(phone))) return null;
  return toFrontendOrder(order, store.order_items);
}
