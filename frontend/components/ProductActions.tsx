"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "./Button";
import { formatCurrency } from "@/lib/formatCurrency";
import { getLowStockThreshold, siteSettings } from "@/lib/mockData";
import { track } from "@/lib/analytics";

export function ProductActions({ product }: { product: Product }) {
  const hasVariants = !!product.variants?.length;
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { showToast } = useToast();

  const variant = product.variants?.find((v) => v.id === variantId);
  const price = variant?.price_inr ?? product.price_inr;
  const stock = variant?.stock_quantity ?? product.stock_quantity;
  const soldOut = stock === 0;
  const lowStock = stock > 0 && stock <= getLowStockThreshold(product);

  // Pricing communication (Brand Bible §2): prove the gift-budget claim with a
  // concrete number near the price, never assert "incredible value".
  const perHour = Math.round(price / product.burn_time_hours);

  const whatsappMessage = `Hi Bougsk, I'd like to ask about the ${product.name} candle.`;
  const whatsappHref = `https://wa.me/${siteSettings.whatsapp_number}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-2xl text-ink">{formatCurrency(price)}</p>
        <p className="mt-1 text-xs text-ink/50">
          Burns for roughly {product.burn_time_hours} hours — about {formatCurrency(perHour)}/hour of light.
        </p>
      </div>

      {lowStock && (
        <p className="text-xs text-error">Only {stock} left in this batch.</p>
      )}

      {hasVariants && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.08em] text-ink/60">Size</p>
          <div className="flex flex-wrap gap-2">
            {product.variants!.filter((v) => v.is_active).map((v) => (
              <button
                key={v.id}
                onClick={() => setVariantId(v.id)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors duration-300 ${
                  variantId === v.id
                    ? "border-wine bg-wine text-paper"
                    : "border-sand bg-transparent text-ink hover:border-wine"
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.08em] text-ink/60">Quantity</p>
        <div className="inline-flex items-center rounded-full border border-sand">
          <button
            className="flex h-11 w-11 items-center justify-center text-sm"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center text-sm">{quantity}</span>
          <button
            className="flex h-11 w-11 items-center justify-center text-sm"
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          className="flex-1"
          disabled={soldOut}
          onClick={() => {
            addItem(product, variant, quantity);
            showToast("success", `Added ${product.name} to your cart.`);
            track("add_to_cart", { product_id: product.id, variant_id: variant?.id, quantity });
          }}
        >
          {soldOut ? "Sold out" : "Add to cart"}
        </Button>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("whatsapp_button_clicked", { product_id: product.id })}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-wine px-6 py-3 text-sm font-medium text-wine transition-colors duration-300 hover:bg-wine hover:text-paper"
        >
          Ask on WhatsApp
        </a>
      </div>
    </div>
  );
}
