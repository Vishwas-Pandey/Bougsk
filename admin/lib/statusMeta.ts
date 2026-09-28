import type { OrderStatus, PaymentStatus, RefundStatus } from "./types";

export type BadgeTone = "sage" | "gold" | "error" | "wine" | "neutral";

export const paymentStatusMeta: Record<
  PaymentStatus,
  { label: string; tone: BadgeTone }
> = {
  paid: { label: "Paid", tone: "sage" },
  pending: { label: "Pending", tone: "gold" },
  failed: { label: "Failed", tone: "error" },
  refunded: { label: "Refunded", tone: "wine" },
};

export const refundStatusMeta: Record<
  RefundStatus,
  { label: string; tone: BadgeTone }
> = {
  none: { label: "No refund", tone: "neutral" },
  initiated: { label: "Refund initiated", tone: "gold" },
  partial: { label: "Partially refunded", tone: "wine" },
  completed: { label: "Refunded", tone: "sage" },
  failed: { label: "Refund failed", tone: "error" },
};

export const orderStatusMeta: Record<
  OrderStatus,
  { label: string; tone: BadgeTone }
> = {
  placed: { label: "Placed", tone: "gold" },
  confirmed: { label: "Confirmed", tone: "gold" },
  packed: { label: "Packed", tone: "wine" },
  shipped: { label: "Shipped", tone: "wine" },
  out_for_delivery: { label: "Out for delivery", tone: "wine" },
  delivered: { label: "Delivered", tone: "sage" },
  cancelled: { label: "Cancelled", tone: "error" },
};

export const orderStatusSequence: OrderStatus[] = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
];

// Orders in these statuses still need the seller to do something (or at
// least keep an eye on them); everything else has reached a final state.
export const openOrderStatuses: OrderStatus[] = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
];
export const closedOrderStatuses: OrderStatus[] = ["delivered", "cancelled"];
