"use client";

import { useState } from "react";
import type { Order } from "@/lib/types";
import { trackOrderAction } from "@/lib/serverOrders";
import { Button } from "@/components/Button";
import { Field, Input } from "@/components/FormField";

const STATUS_LABEL: Record<Order["order_status"], string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<Order | null | undefined>(undefined);

  // Generic on purpose either way (Build Spec §Order tracking security): never reveal
  // whether the order number or the phone was the mismatch, and never confirm an
  // order number exists before both factors match.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult((await trackOrderAction(orderNumber, phone)) ?? null);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <h1 className="font-display mb-2 text-3xl text-ink">Track your order</h1>
      <p className="mb-8 text-sm text-ink/70">
        Enter your order number and the phone number you checked out with.
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Order number" htmlFor="order-number">
          <Input
            id="order-number"
            placeholder="BOUGSK-1042"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
          />
        </Field>
        <Field label="Phone number" htmlFor="order-phone">
          <Input
            id="order-phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
        <Button type="submit">Track order</Button>
      </form>

      {result === null && (
        <p className="mt-6 text-sm text-error">
          We couldn&apos;t find a matching order. Double-check the number and phone, or
          ask us on WhatsApp.
        </p>
      )}

      {result && (
        <div className="mt-8 rounded-md bg-sand p-6">
          <p className="font-display text-xl text-ink">{result.order_number}</p>
          <p className="mt-1 text-sm text-ink/70">
            Status: <span className="text-ink">{STATUS_LABEL[result.order_status]}</span>
          </p>
          {result.courier_name && (
            <p className="mt-1 text-sm text-ink/70">
              Courier: <span className="text-ink">{result.courier_name}</span>
            </p>
          )}
          {result.tracking_number && (
            <p className="mt-1 text-sm text-ink/70">
              Tracking number: <span className="text-ink">{result.tracking_number}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
