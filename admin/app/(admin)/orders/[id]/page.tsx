"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Field, Input, Select } from "@/components/FormControls";
import { formatINR } from "@/lib/formatCurrency";
import { formatDateTime } from "@/lib/formatDate";
import { orderStatusMeta, paymentStatusMeta, refundStatusMeta } from "@/lib/statusMeta";
import { useStore } from "@/lib/store";
import type { OrderStatus, ShippingAddress } from "@/lib/types";

const statusOptions: OrderStatus[] = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

function addressesDiffer(a: ShippingAddress, b: ShippingAddress): boolean {
  return (
    a.line1 !== b.line1 ||
    a.line2 !== b.line2 ||
    a.city !== b.city ||
    a.state !== b.state ||
    a.pincode !== b.pincode
  );
}

function AddressBlock({ address }: { address: ShippingAddress }) {
  return (
    <p>
      {address.line1}
      {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state}{" "}
      {address.pincode}
    </p>
  );
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    orders,
    orderItems,
    updateOrderStatus,
    updateOrderShipping,
    cancelOrder,
    refundOrder,
  } = useStore();

  const order = orders.find((o) => o.id === params.id);
  const items = orderItems.filter((i) => i.order_id === params.id);

  const [courierName, setCourierName] = useState(order?.courier_name ?? "");
  const [trackingNumber, setTrackingNumber] = useState(
    order?.tracking_number ?? ""
  );
  const [shippingSaved, setShippingSaved] = useState(false);

  // `orders` loads asynchronously (seed data first, then the shared file's
  // real data replaces it — see StoreProvider), so the useState initial
  // values above can capture a stale/empty order on first render. Resync
  // whenever the actual persisted values change, so a previously-saved
  // courier/tracking number shows up instead of looking unsaved.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCourierName(order?.courier_name ?? "");
    setTrackingNumber(order?.tracking_number ?? "");
  }, [order?.id, order?.courier_name, order?.tracking_number]);

  const remainingRefund = order
    ? order.total_inr - (order.refund_amount_inr ?? 0)
    : 0;
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [showRefundForm, setShowRefundForm] = useState(false);

  if (!order) {
    return (
      <div>
        <h1 className="font-display text-h1 text-ink mb-4">Order not found</h1>
      </div>
    );
  }

  const hasBillingAddress =
    order.billing_address && addressesDiffer(order.billing_address, order.shipping_address);

  const canRefund =
    order.payment_status === "paid" &&
    (order.refund_status === "none" || order.refund_status === "failed");

  function handleRefund() {
    if (!order) return;
    const amount = refundAmount ? Number(refundAmount) : undefined;
    refundOrder(order.id, amount, refundReason.trim() || undefined);
    setRefundAmount("");
    setRefundReason("");
    setShowRefundForm(false);
  }

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <h1 className="font-display text-h1 text-ink">{order.order_number}</h1>
        <Badge tone={paymentStatusMeta[order.payment_status].tone}>
          {paymentStatusMeta[order.payment_status].label}
        </Badge>
        <Badge tone={orderStatusMeta[order.order_status].tone}>
          {orderStatusMeta[order.order_status].label}
        </Badge>
        {order.refund_status !== "none" && (
          <Badge tone={refundStatusMeta[order.refund_status].tone}>
            {refundStatusMeta[order.refund_status].label}
          </Badge>
        )}
      </div>

      <section className="bg-white border border-sand rounded-card p-6 mb-6">
        <h2 className="font-display text-h3-italic italic text-ink mb-4">
          Items
        </h2>
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-body text-ink"
            >
              <span>
                {item.product_name}
                {item.variant_name ? ` — ${item.variant_name}` : ""}{" "}
                <span className="text-ink/50">× {item.quantity}</span>
                {item.hsn_code && (
                  <span className="text-ink/40"> · HSN {item.hsn_code}</span>
                )}
              </span>
              <span>{formatINR(item.line_total_inr)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-sand mt-4 pt-4 flex flex-col gap-1.5 text-body">
          <div className="flex items-center justify-between text-ink/70">
            <span>Subtotal</span>
            <span>{formatINR(order.subtotal_inr)}</span>
          </div>
          {order.discount_inr > 0 && (
            <div className="flex items-center justify-between text-ink/70">
              <span>Discount</span>
              <span>−{formatINR(order.discount_inr)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-ink/70">
            <span>Taxable amount</span>
            <span>{formatINR(order.taxable_amount_inr)}</span>
          </div>
          <div className="flex items-center justify-between text-ink/70">
            <span>GST ({order.tax_rate_percent}%)</span>
            <span>{formatINR(order.tax_amount_inr)}</span>
          </div>
          <div className="flex items-center justify-between text-ink/70">
            <span>Shipping</span>
            <span>{formatINR(order.shipping_fee_inr)}</span>
          </div>
          <div className="flex items-center justify-between text-ink font-medium">
            <span>Total</span>
            <span>{formatINR(order.total_inr)}</span>
          </div>
        </div>
        {order.gst_invoice_number && (
          <p className="text-body text-ink/50 mt-3">
            Invoice: {order.gst_invoice_number}
          </p>
        )}
        {order.buyer_gstin && (
          <p className="text-body text-ink/50">Buyer GSTIN: {order.buyer_gstin}</p>
        )}
      </section>

      {order.is_gift && (
        <section className="bg-white border border-sand rounded-card p-6 mb-6">
          <h2 className="font-display text-h3-italic italic text-ink mb-4">
            Gift
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-body text-ink">
            <div>
              <p className="text-ink/50">Recipient</p>
              <p>{order.recipient_name || "—"}</p>
            </div>
            <div>
              <p className="text-ink/50">Gift wrap</p>
              <p>{order.gift_wrap_requested ? "Requested" : "Not requested"}</p>
            </div>
          </div>
          {order.gift_message && (
            <div className="mt-4">
              <p className="text-ink/50">Message</p>
              <p className="text-body text-ink">{order.gift_message}</p>
            </div>
          )}
          <p className="text-body text-ink/50 mt-4">
            The shipping label uses the recipient&apos;s name above; the invoice
            still goes to {order.customer_name}, since that&apos;s who paid.
          </p>
        </section>
      )}

      <section className="bg-white border border-sand rounded-card p-6 mb-6">
        <h2 className="font-display text-h3-italic italic text-ink mb-4">
          Customer & shipping
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-body text-ink">
          <div>
            <p className="text-ink/50">Name</p>
            <p>{order.customer_name}</p>
          </div>
          <div>
            <p className="text-ink/50">Email</p>
            <p>{order.customer_email}</p>
          </div>
          <div>
            <p className="text-ink/50">Phone</p>
            <p>{order.customer_phone}</p>
          </div>
          <div>
            <p className="text-ink/50">Shipping address</p>
            <AddressBlock address={order.shipping_address} />
          </div>
          {hasBillingAddress && (
            <div>
              <p className="text-ink/50">Billing address</p>
              <AddressBlock address={order.billing_address!} />
            </div>
          )}
        </div>
        {order.notes && (
          <p className="text-body text-ink/60 mt-4">Note: {order.notes}</p>
        )}
      </section>

      <section className="bg-white border border-sand rounded-card p-6 mb-6">
        <h2 className="font-display text-h3-italic italic text-ink mb-4">
          Payment & refund
        </h2>
        {/* Read-only by design: payment_status is only ever written by the
            verify-payment Edge Function once the gateway confirms funds, and
            refund_status only by the refund-order Edge Function once
            Razorpay's webhook confirms it — so an admin can never
            accidentally mark an order paid or refunded by hand. The button
            below only *triggers* that flow; it doesn't set the status directly. */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Badge tone={paymentStatusMeta[order.payment_status].tone}>
            {paymentStatusMeta[order.payment_status].label}
          </Badge>
          <Badge tone={refundStatusMeta[order.refund_status].tone}>
            {refundStatusMeta[order.refund_status].label}
          </Badge>
        </div>
        {order.refund_amount_inr != null && (
          <p className="text-body text-ink/60 mb-1">
            Refunded so far: {formatINR(order.refund_amount_inr)}
          </p>
        )}
        {order.refund_reason && (
          <p className="text-body text-ink/60 mb-1">Reason: {order.refund_reason}</p>
        )}
        {order.refunded_at && (
          <p className="text-body text-ink/60 mb-4">
            Last updated {formatDateTime(order.refunded_at)}
          </p>
        )}

        {canRefund && (
          <div className="mt-2">
            {showRefundForm ? (
              <div className="flex flex-col gap-3 max-w-sm">
                <Field
                  label="Refund amount (₹)"
                  hint={`Leave blank to refund the remaining ${formatINR(remainingRefund)}`}
                >
                  <Input
                    type="number"
                    min={0}
                    max={remainingRefund}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder={String(remainingRefund)}
                  />
                </Field>
                <Field label="Reason" hint="Optional, shown to no one but the team">
                  <Input
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Damaged in transit"
                  />
                </Field>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="destructive" onClick={handleRefund}>
                    Confirm refund
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowRefundForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowRefundForm(true)}
              >
                Refund
              </Button>
            )}
          </div>
        )}
      </section>

      <section className="bg-white border border-sand rounded-card p-6 mb-6">
        <h2 className="font-display text-h3-italic italic text-ink mb-4">
          Order status
        </h2>
        <Field label="Status">
          <Select
            value={order.order_status}
            onChange={(e) =>
              updateOrderStatus(order.id, e.target.value as OrderStatus)
            }
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {orderStatusMeta[s].label}
              </option>
            ))}
          </Select>
        </Field>
      </section>

      <section className="bg-white border border-sand rounded-card p-6 mb-6">
        <h2 className="font-display text-h3-italic italic text-ink mb-4">
          Shipping details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="Courier">
            <Input
              value={courierName}
              onChange={(e) => {
                setCourierName(e.target.value);
                setShippingSaved(false);
              }}
              placeholder="Delhivery"
            />
          </Field>
          <Field label="Tracking number">
            <Input
              value={trackingNumber}
              onChange={(e) => {
                setTrackingNumber(e.target.value);
                setShippingSaved(false);
              }}
              placeholder="DL4471002233"
            />
          </Field>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              updateOrderShipping(order.id, courierName, trackingNumber);
              setShippingSaved(true);
            }}
          >
            Save shipping details
          </Button>
          {shippingSaved && (
            <span className="text-body text-sage">Saved.</span>
          )}
        </div>
      </section>

      {order.order_status !== "cancelled" && (
        <div>
          <Button
            variant="destructive"
            onClick={() => {
              cancelOrder(order.id);
              router.push("/orders");
            }}
          >
            Cancel order
          </Button>
        </div>
      )}
    </div>
  );
}
