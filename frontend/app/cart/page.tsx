"use client";

import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/formatCurrency";
import { ProductImage } from "@/components/ProductImage";
import { ButtonLink } from "@/components/Button";
import { siteSettings } from "@/lib/mockData";

export default function CartPage() {
  const { lines, subtotalInr, updateQuantity, removeItem } = useCart();

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <p className="font-display text-2xl text-ink">Nothing lit yet.</p>
        <p className="mt-2 text-sm text-ink/70">Your cart is waiting for its first candle.</p>
        <ButtonLink href="/shop" className="mt-8 inline-flex">
          Shop the collection
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-display mb-8 text-4xl text-ink">Your cart</h1>

      <ul className="divide-y divide-sand">
        {lines.map((line) => (
          <li key={`${line.product.id}-${line.variant?.id ?? "base"}`} className="flex gap-5 py-6">
            <ProductImage name={line.product.name} className="h-24 w-24 shrink-0" radius="rounded-md" />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-lg text-ink">{line.product.name}</p>
                  {line.variant && <p className="text-xs text-ink/60">{line.variant.name}</p>}
                </div>
                <p className="text-sm text-ink">
                  {formatCurrency(
                    (line.variant?.price_inr ?? line.product.price_inr) * line.quantity
                  )}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex items-center rounded-full border border-sand">
                  <button
                    className="flex h-11 w-11 items-center justify-center text-sm"
                    onClick={() =>
                      updateQuantity(line.product.id, line.variant?.id, line.quantity - 1)
                    }
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm">{line.quantity}</span>
                  <button
                    className="flex h-11 w-11 items-center justify-center text-sm"
                    onClick={() =>
                      updateQuantity(line.product.id, line.variant?.id, line.quantity + 1)
                    }
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <button
                  className="text-xs text-ink/50 hover:text-error"
                  onClick={() => removeItem(line.product.id, line.variant?.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col items-end gap-2 border-t border-sand pt-6">
        <div className="flex w-full max-w-xs justify-between text-sm text-ink/70">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotalInr)}</span>
        </div>
        <p className="w-full max-w-xs text-right text-xs text-ink/50">
          Shipping calculated at checkout — from {formatCurrency(siteSettings.shipping_fee_inr)}.
        </p>
        <ButtonLink href="/checkout" className="mt-3 w-full max-w-xs">
          Checkout
        </ButtonLink>
      </div>
    </div>
  );
}
