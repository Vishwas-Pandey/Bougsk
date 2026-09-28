"use client";

import { useMemo } from "react";
import { StatCard } from "@/components/StatCard";
import { formatINR } from "@/lib/formatCurrency";
import { LOW_STOCK_THRESHOLD, lowStockThreshold } from "@/lib/mockData";
import { useStore } from "@/lib/store";

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function DashboardPage() {
  const { orders, products, getSetting } = useStore();

  const siteLowStockDefault =
    Number(getSetting("low_stock_threshold")) || LOW_STOCK_THRESHOLD;

  const stats = useMemo(() => {
    const todaysOrders = orders.filter((o) => isToday(o.created_at));
    // Revenue counts only paid orders — an unpaid or failed order hasn't
    // actually brought money in yet.
    const todaysRevenue = todaysOrders
      .filter((o) => o.payment_status === "paid")
      .reduce((sum, o) => sum + o.total_inr, 0);
    // "Awaiting packing" is anything placed or confirmed but not yet packed.
    const awaitingPacking = orders.filter(
      (o) => o.order_status === "placed" || o.order_status === "confirmed"
    ).length;
    const lowStock = products.filter(
      (p) => p.stock_quantity < lowStockThreshold(p, siteLowStockDefault)
    ).length;

    return {
      todaysOrderCount: todaysOrders.length,
      todaysRevenue,
      awaitingPacking,
      lowStock,
    };
  }, [orders, products, siteLowStockDefault]);

  return (
    <div>
      <h1 className="font-display text-h1 text-ink mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Today's orders" value={String(stats.todaysOrderCount)} />
        <StatCard
          label="Today's revenue"
          value={formatINR(stats.todaysRevenue)}
        />
        <StatCard
          label="Awaiting packing"
          value={String(stats.awaitingPacking)}
          hint="Placed or confirmed, not yet packed"
        />
        <StatCard
          label="Low stock"
          value={String(stats.lowStock)}
          hint={`Below ${siteLowStockDefault} units (site default; per-product overrides apply)`}
        />
      </div>
    </div>
  );
}
