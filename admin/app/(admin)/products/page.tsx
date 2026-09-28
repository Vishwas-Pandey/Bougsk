"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { Input, Select } from "@/components/FormControls";
import { formatINR } from "@/lib/formatCurrency";
import { LOW_STOCK_THRESHOLD, lowStockThreshold } from "@/lib/mockData";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/types";

export default function ProductsPage() {
  const router = useRouter();
  const { products, categories, getSetting } = useStore();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const siteLowStockDefault =
    Number(getSetting("low_stock_threshold")) || LOW_STOCK_THRESHOLD;

  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name
        .toLowerCase()
        .includes(search.trim().toLowerCase());
      const matchesCategory = categoryId === "all" || p.category_id === categoryId;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryId]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="font-display text-h1 text-ink">Products</h1>
        <Button href="/products/new">New product</Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products"
          className="max-w-xs"
        />
        <Select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="max-w-xs"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <DataTable<Product>
        rows={filtered}
        rowKey={(p) => p.id}
        onRowClick={(p) => router.push(`/products/${p.id}/edit`)}
        emptyMessage="No products match your search."
        columns={[
          { header: "Name", accessor: (p) => p.name },
          {
            header: "Category",
            accessor: (p) => categoryName(p.category_id),
          },
          { header: "Price", accessor: (p) => formatINR(p.price_inr) },
          {
            header: "Stock",
            accessor: (p) => (
              <span
                className={
                  p.stock_quantity < lowStockThreshold(p, siteLowStockDefault)
                    ? "text-error"
                    : ""
                }
              >
                {p.stock_quantity}
              </span>
            ),
          },
          {
            header: "Status",
            accessor: (p) => (
              <Badge tone={p.is_active ? "sage" : "neutral"}>
                {p.is_active ? "Live" : "Draft"}
              </Badge>
            ),
          },
        ]}
      />
    </div>
  );
}
