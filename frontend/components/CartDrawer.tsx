"use client";

import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/formatCurrency";
import { ProductImage } from "./ProductImage";
import { ButtonLink } from "./Button";
import { CartIcon } from "./icons";

export function CartDrawer() {
  const { lines, subtotalInr, isDrawerOpen, closeDrawer, updateQuantity, removeItem } =
    useCart();

  return (
    <>
      <div
        onClick={closeDrawer}
        aria-hidden="true"
        className={`fixed inset-0 z-50 bg-ink/30 transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isDrawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-paper shadow-lg transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-sand px-6 py-5">
          <h2 className="font-display flex items-center gap-2 text-xl text-ink">
            <CartIcon className="h-5 w-5 text-wine" />
            Your cart
          </h2>
          <button
            onClick={closeDrawer}
            aria-label="Close cart"
            className="text-ink/60 hover:text-wine"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {lines.length === 0 ? (
            <p className="mt-8 text-sm text-ink/70">
              Nothing lit yet — your cart is waiting.
            </p>
          ) : (
            <ul className="space-y-5">
              {lines.map((line) => (
                <li key={`${line.product.id}-${line.variant?.id ?? "base"}`} className="flex gap-4">
                  <ProductImage name={line.product.name} className="h-20 w-20 shrink-0" radius="rounded-md" />
                  <div className="flex-1">
                    <p className="font-display text-base text-ink">{line.product.name}</p>
                    {line.variant && (
                      <p className="text-xs text-ink/60">{line.variant.name}</p>
                    )}
                    <p className="mt-1 text-sm text-ink/80">
                      {formatCurrency(line.variant?.price_inr ?? line.product.price_inr)}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
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
                        <span className="w-6 text-center text-sm">{line.quantity}</span>
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
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-sand px-6 py-5">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-ink/70">Subtotal</span>
              <span className="font-medium text-ink">{formatCurrency(subtotalInr)}</span>
            </div>
            <ButtonLink href="/checkout" className="w-full" onClick={closeDrawer}>
              Checkout
            </ButtonLink>
          </div>
        )}
      </aside>
    </>
  );
}
