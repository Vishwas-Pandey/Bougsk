"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartLine, Product, ProductVariant } from "./types";
import { products as allProducts } from "./mockData";

interface StoredLine {
  productId: string;
  variantId?: string;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  itemCount: number;
  subtotalInr: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "bougsk_cart_v1";

function readStoredLines(): StoredLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredLine[]) : [];
  } catch {
    return [];
  }
}

function hydrateLines(stored: StoredLine[]): CartLine[] {
  const lines: CartLine[] = [];
  for (const line of stored) {
    const product = allProducts.find((p) => p.id === line.productId);
    if (!product) continue;
    const variant = line.variantId
      ? product.variants?.find((v) => v.id === line.variantId)
      : undefined;
    lines.push({ product, variant, quantity: line.quantity });
  }
  return lines;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [{ lines, hydrated }, setCartState] = useState<{ lines: CartLine[]; hydrated: boolean }>({
    lines: [],
    hydrated: false,
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Cart starts empty during SSR/first paint (localStorage isn't available
  // server-side) and this effect hydrates it from storage right after mount —
  // the standard pattern for a client-only value that must match the SSR
  // markup on first paint, not something reachable via a lazy useState
  // initializer without causing a hydration mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCartState({ lines: hydrateLines(readStoredLines()), hydrated: true });
  }, []);

  const setLines = (updater: CartLine[] | ((prev: CartLine[]) => CartLine[])) => {
    setCartState((prev) => ({
      ...prev,
      lines: typeof updater === "function" ? updater(prev.lines) : updater,
    }));
  };

  useEffect(() => {
    if (!hydrated) return;
    const toStore: StoredLine[] = lines.map((l) => ({
      productId: l.product.id,
      variantId: l.variant?.id,
      quantity: l.quantity,
    }));
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // Private browsing / storage disabled — cart just won't persist across reloads.
    }
  }, [lines, hydrated]);

  const addItem: CartContextValue["addItem"] = (product, variant, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find(
        (l) => l.product.id === product.id && l.variant?.id === variant?.id
      );
      if (existing) {
        return prev.map((l) =>
          l === existing ? { ...l, quantity: l.quantity + quantity } : l
        );
      }
      return [...prev, { product, variant, quantity }];
    });
    // Confirmation is a quiet toast (Brand Bible Components tab), not an
    // auto-opened drawer — the cart icon still opens it on request.
  };

  const updateQuantity: CartContextValue["updateQuantity"] = (
    productId,
    variantId,
    quantity
  ) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => !(l.product.id === productId && l.variant?.id === variantId))
        : prev.map((l) =>
            l.product.id === productId && l.variant?.id === variantId
              ? { ...l, quantity }
              : l
          )
    );
  };

  const removeItem: CartContextValue["removeItem"] = (productId, variantId) => {
    setLines((prev) =>
      prev.filter((l) => !(l.product.id === productId && l.variant?.id === variantId))
    );
  };

  const clearCart = () => setLines([]);

  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);
  const subtotalInr = useMemo(
    () =>
      lines.reduce(
        (sum, l) => sum + (l.variant?.price_inr ?? l.product.price_inr) * l.quantity,
        0
      ),
    [lines]
  );

  return (
    <CartContext.Provider
      value={{
        lines,
        itemCount,
        subtotalInr,
        isDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
