"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { downloadCsv, ordersToCsv } from "@/lib/exportOrders";
import { formatINR } from "@/lib/formatCurrency";
import { formatDate } from "@/lib/formatDate";
import {
  closedOrderStatuses,
  openOrderStatuses,
  orderStatusMeta,
  paymentStatusMeta,
} from "@/lib/statusMeta";
import { useStore } from "@/lib/store";
import type { Order, OrderStatus } from "@/lib/types";

type Tab = "queue" | "completed";

const queueFilters: { label: string; value: OrderStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Placed", value: "placed" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Packed", value: "packed" },
  { label: "Shipped", value: "shipped" },
  { label: "Out for delivery", value: "out_for_delivery" },
];

const completedFilters: { label: string; value: OrderStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

// Local date components, not toISOString() (which converts to UTC first —
// near midnight that can silently roll back to the previous calendar day
// depending on the browser's timezone, which is wrong for a plain "which
// day did I pick" date input default).
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function OrdersPage() {
  const router = useRouter();
  const { orders, orderItems } = useStore();
  const [tab, setTab] = useState<Tab>("queue");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  const [exportOpen, setExportOpen] = useState(false);
  const firstOfMonth = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    return isoDate(d);
  }, []);
  const [exportFrom, setExportFrom] = useState(firstOfMonth);
  const [exportTo, setExportTo] = useState(isoDate(new Date()));

  const tabStatuses = tab === "queue" ? openOrderStatuses : closedOrderStatuses;
  const filters = tab === "queue" ? queueFilters : completedFilters;

  const inTab = useMemo(
    () => orders.filter((o) => tabStatuses.includes(o.order_status)),
    [orders, tabStatuses]
  );
  const queueCount = useMemo(
    () => orders.filter((o) => openOrderStatuses.includes(o.order_status)).length,
    [orders]
  );

  const filtered = useMemo(
    () =>
      statusFilter === "all" ? inTab : inTab.filter((o) => o.order_status === statusFilter),
    [inTab, statusFilter]
  );

  function switchTab(next: Tab) {
    setTab(next);
    setStatusFilter("all");
  }

  function handleExport() {
    // End-of-day on the "to" date, so that date's own orders are included.
    const fromMs = exportFrom ? new Date(exportFrom).getTime() : -Infinity;
    const toMs = exportTo ? new Date(exportTo).getTime() + 24 * 60 * 60 * 1000 : Infinity;
    const inRange = orders.filter((o) => {
      const t = new Date(o.created_at).getTime();
      return t >= fromMs && t < toMs;
    });
    const csv = ordersToCsv(inRange, orderItems);
    const suffix = exportFrom || exportTo ? `_${exportFrom || "start"}_to_${exportTo || "now"}` : "_all";
    downloadCsv(`bougsk-orders${suffix}.csv`, csv);
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-8">
        <h1 className="font-display text-h1 text-ink">Orders</h1>
        <Button variant="secondary" onClick={() => setExportOpen((v) => !v)}>
          {exportOpen ? "Close export" : "Export CSV"}
        </Button>
      </div>

      {exportOpen && (
        <div className="rounded-card border border-sand bg-white p-5 mb-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-label-upper uppercase tracking-[0.08em] text-ink/50 mb-1.5">
              From
            </label>
            <input
              type="date"
              value={exportFrom}
              onChange={(e) => setExportFrom(e.target.value)}
              className="rounded-md border border-sand bg-paper px-3 py-2 text-body text-ink"
            />
          </div>
          <div>
            <label className="block text-label-upper uppercase tracking-[0.08em] text-ink/50 mb-1.5">
              To
            </label>
            <input
              type="date"
              value={exportTo}
              onChange={(e) => setExportTo(e.target.value)}
              className="rounded-md border border-sand bg-paper px-3 py-2 text-body text-ink"
            />
          </div>
          <Button onClick={handleExport}>Download CSV</Button>
          <p className="text-body text-ink/50 basis-full">
            Defaults to this month. Clear both dates and export for everything — keep a copy of
            this outside the store regularly; it&apos;s the only backup of order history if
            anything ever goes wrong with the database itself.
          </p>
        </div>
      )}

      {/* Queue vs. completed: once an order is delivered or cancelled it's
          done — moving it out of the default view keeps the working list to
          only what still needs your attention. */}
      <div className="flex gap-2 mb-6 border-b border-sand">
        {(
          [
            { key: "queue" as const, label: `Queue (${queueCount})` },
            { key: "completed" as const, label: "Completed" },
          ]
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => switchTab(t.key)}
            className={`px-4 py-2.5 text-body border-b-2 -mb-px transition-colors duration-300 ease-out ${
              tab === t.key
                ? "border-wine text-ink font-medium"
                : "border-transparent text-ink/50 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-body transition-colors duration-300 ease-out ${
              statusFilter === f.value
                ? "bg-ink text-paper"
                : "bg-sand text-ink/70 hover:bg-sand/70"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <DataTable<Order>
        rows={filtered}
        rowKey={(o) => o.id}
        onRowClick={(o) => router.push(`/orders/${o.id}`)}
        emptyMessage={
          tab === "queue" ? "Nothing waiting on you right now." : "No completed orders yet."
        }
        columns={[
          { header: "Order", accessor: (o) => o.order_number },
          { header: "Customer", accessor: (o) => o.customer_name },
          { header: "Total", accessor: (o) => formatINR(o.total_inr) },
          {
            header: "Payment",
            accessor: (o) => (
              <Badge tone={paymentStatusMeta[o.payment_status].tone}>
                {paymentStatusMeta[o.payment_status].label}
              </Badge>
            ),
          },
          {
            header: "Status",
            accessor: (o) => (
              <Badge tone={orderStatusMeta[o.order_status].tone}>
                {orderStatusMeta[o.order_status].label}
              </Badge>
            ),
          },
          {
            header: "Placed",
            accessor: (o) => formatDate(o.created_at),
          },
        ]}
      />
    </div>
  );
}
