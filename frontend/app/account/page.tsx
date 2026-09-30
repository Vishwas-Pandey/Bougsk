"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/Button";
import { formatCurrency } from "@/lib/formatCurrency";

const ORDER_STATUS_LABELS: Record<string, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

interface OrderSummary {
  order_number: string;
  created_at: string;
  order_status: string;
  payment_status: string;
  total_inr: number;
}

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/account");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || !supabase) return;
    supabase
      .from("orders")
      .select("order_number, created_at, order_status, payment_status, total_inr")
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders(data ?? []));
  }, [user]);

  if (loading || !user) {
    return <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6" />;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display mb-1 text-3xl text-ink">Your account</h1>
      <p className="mb-8 text-sm text-ink/60">{user.email}</p>

      <section>
        <h2 className="font-display mb-4 text-xl text-ink">Orders</h2>
        {orders === null ? (
          <p className="text-sm text-ink/50">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-ink/60">
            No orders yet.{" "}
            <Link href="/shop" className="text-wine hover:underline">
              Start shopping
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.order_number}
                className="flex items-center justify-between rounded-md bg-sand p-4 text-sm"
              >
                <div>
                  <p className="font-medium text-ink">{order.order_number}</p>
                  <p className="text-ink/60">
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: "Asia/Kolkata",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-ink">{formatCurrency(order.total_inr)}</p>
                  <p className="text-ink/60">
                    {ORDER_STATUS_LABELS[order.order_status] ?? order.order_status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Button
        variant="secondary"
        className="mt-10"
        onClick={async () => {
          await signOut();
          router.push("/");
        }}
      >
        Sign out
      </Button>
    </div>
  );
}
