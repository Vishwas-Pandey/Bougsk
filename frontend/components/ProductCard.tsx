import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/formatCurrency";
import { isLowStock, isNewProduct } from "@/lib/mockData";
import { ProductImage } from "./ProductImage";
import { Badge } from "./Badge";

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock_quantity === 0;
  const lowStock = isLowStock(product);

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block rounded-md bg-sand p-3 shadow-sm transition-shadow duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-md"
    >
      <div className="relative">
        <ProductImage name={product.name} className="aspect-square w-full" />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {soldOut && <Badge tone="sold-out">Sold out</Badge>}
          {!soldOut && isNewProduct(product) && <Badge tone="new">New</Badge>}
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="font-display text-lg text-ink">{product.name}</h3>
        <p className="text-sm text-ink/70">{product.scent_notes.slice(0, 2).join(" · ")}</p>
        <p className="text-sm text-ink">
          {formatCurrency(product.price_inr)}
          {product.compare_at_price_inr && (
            <span className="ml-2 text-ink/40 line-through">
              {formatCurrency(product.compare_at_price_inr)}
            </span>
          )}
        </p>
        {lowStock && (
          <p className="text-xs text-error">Only {product.stock_quantity} left in this batch.</p>
        )}
      </div>
    </Link>
  );
}
