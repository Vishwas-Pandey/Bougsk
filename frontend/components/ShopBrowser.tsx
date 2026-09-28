"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProductCard } from "./ProductCard";
import { categories, getActiveProducts } from "@/lib/mockData";

type SortKey = "featured" | "price-asc" | "price-desc" | "newest";

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
];

export function ShopBrowser({ initialCategorySlug }: { initialCategorySlug?: string }) {
  const [categorySlug, setCategorySlug] = useState<string | undefined>(initialCategorySlug);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [sort, setSort] = useState<SortKey>("featured");

  const products = useMemo(() => {
    let list = getActiveProducts();

    if (categorySlug) {
      const category = categories.find((c) => c.slug === categorySlug);
      if (category) list = list.filter((p) => p.category_id === category.id);
    }

    list = list.filter((p) => p.price_inr <= maxPrice);

    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => a.price_inr - b.price_inr);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.price_inr - a.price_inr);
        break;
      case "featured":
        list = [...list].sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
        break;
      default:
        break;
    }

    return list;
  }, [categorySlug, maxPrice, sort]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display mb-8 text-4xl text-ink">Shop</h1>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setCategorySlug(undefined)}
          className={`rounded-full px-4 py-1.5 text-sm transition-colors duration-300 ${
            !categorySlug ? "bg-wine text-paper" : "bg-sand text-ink hover:bg-sand/70"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategorySlug(c.slug)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors duration-300 ${
              categorySlug === c.slug ? "bg-wine text-paper" : "bg-sand text-ink hover:bg-sand/70"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-y border-sand py-4 text-sm">
        <label className="flex items-center gap-3 text-ink/70">
          Up to ₹{maxPrice.toLocaleString("en-IN")}
          <input
            type="range"
            min={500}
            max={2000}
            step={50}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="accent-gold"
          />
        </label>
        <label className="flex items-center gap-2 text-ink/70">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-md border border-sand bg-paper px-2 py-1"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {products.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink/60">
          Nothing here at that price yet —{" "}
          <Link href="/contact" className="text-wine hover:underline">
            ask us on WhatsApp
          </Link>{" "}
          and we&apos;ll help you find something close.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
