"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { fetchSharedOrders, persistOrder } from "./serverOrders";
import {
  logOrderPacked,
  logOrderShipped,
  logOutForDelivery,
  logOrderDelivered,
  logRefundConfirmed,
} from "./localNotifications";
import {
  auditLogs as seedAuditLogs,
  categories as seedCategories,
  orderItems as seedOrderItems,
  orders as seedOrders,
  productVariants as seedProductVariants,
  products as seedProducts,
  reviews as seedReviews,
  siteSettings as seedSiteSettings,
  subscribers as seedSubscribers,
} from "./mockData";
import { slugify } from "./slugify";
import type {
  AdminAuditLog,
  Category,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  ProductVariant,
  Review,
  SiteSetting,
  SiteSettingKey,
  Subscriber,
} from "./types";

type NewProductInput = Omit<Product, "id" | "slug" | "created_at">;
type NewCategoryInput = Omit<Category, "id" | "slug">;
type NewVariantInput = Omit<ProductVariant, "id">;

interface StoreValue {
  categories: Category[];
  products: Product[];
  productVariants: ProductVariant[];
  orders: Order[];
  orderItems: OrderItem[];
  settings: SiteSetting[];
  auditLogs: AdminAuditLog[];
  reviews: Review[];
  subscribers: Subscriber[];

  addCategory: (input: NewCategoryInput) => Category;
  updateCategory: (id: string, patch: Partial<NewCategoryInput>) => void;

  addProduct: (input: NewProductInput) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addProductVariant: (input: NewVariantInput) => ProductVariant;
  updateProductVariant: (id: string, patch: Partial<ProductVariant>) => void;
  deleteProductVariant: (id: string) => void;

  // No updatePaymentStatus: in production payment_status is only ever
  // written by the verify-payment Edge Function, never by an admin.
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updateOrderShipping: (
    id: string,
    courier_name: string,
    tracking_number: string
  ) => void;
  cancelOrder: (id: string) => void;
  // No updateRefundStatus either, for the same reason payment_status has no
  // setter: in production refund_status is only ever written by the
  // refund-order Edge Function once Razorpay's webhook confirms it. This is
  // the mock stand-in for that call — it flips refund_status to "initiated"
  // and releases the order's stock back onto the mock products/variants.
  refundOrder: (id: string, amount?: number, reason?: string) => void;

  updateSetting: (key: SiteSettingKey, value: string | number) => void;
  getSetting: (key: SiteSettingKey) => string | number | undefined;

  setReviewPublished: (id: string, is_published: boolean) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

let idCounter = 100;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(seedCategories);
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [productVariants, setProductVariants] =
    useState<ProductVariant[]>(seedProductVariants);
  const [orders, setOrders] = useState<Order[]>(seedOrders);
  const [orderItems, setOrderItems] = useState<OrderItem[]>(seedOrderItems);

  // The seed arrays above render immediately so the dashboard/orders list
  // never flashes empty; this then swaps in whatever's actually in the
  // shared file (backend/local-data/orders.json, pre-seeded with the same
  // demo orders) — real orders placed on the storefront, plus any admin
  // edits from a previous session, all live there.
  useEffect(() => {
    fetchSharedOrders().then((shared) => {
      if (shared.orders.length === 0) return;
      setOrders(shared.orders);
      setOrderItems(shared.order_items);
    });
  }, []);
  const [settings, setSettings] = useState<SiteSetting[]>(seedSiteSettings);
  const [auditLogs] = useState<AdminAuditLog[]>(seedAuditLogs);
  const [reviews, setReviews] = useState<Review[]>(seedReviews);
  const [subscribers] = useState<Subscriber[]>(seedSubscribers);

  const addCategory = useCallback((input: NewCategoryInput) => {
    const category: Category = {
      ...input,
      id: nextId("cat"),
      slug: slugify(input.name),
    };
    setCategories((prev) => [...prev, category]);
    return category;
  }, []);

  const updateCategory = useCallback(
    (id: string, patch: Partial<NewCategoryInput>) => {
      setCategories((prev) =>
        prev.map((category) =>
          category.id === id
            ? {
                ...category,
                ...patch,
                slug: patch.name ? slugify(patch.name) : category.slug,
              }
            : category
        )
      );
    },
    []
  );

  const addProduct = useCallback((input: NewProductInput) => {
    const product: Product = {
      ...input,
      id: nextId("prod"),
      slug: slugify(input.name),
      created_at: new Date().toISOString(),
    };
    setProducts((prev) => [product, ...prev]);
    return product;
  }, []);

  const updateProduct = useCallback((id: string, patch: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? {
              ...product,
              ...patch,
              slug: patch.name ? slugify(patch.name) : product.slug,
            }
          : product
      )
    );
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((product) => product.id !== id));
  }, []);

  const addProductVariant = useCallback((input: NewVariantInput) => {
    const variant: ProductVariant = { ...input, id: nextId("var") };
    setProductVariants((prev) => [...prev, variant]);
    return variant;
  }, []);

  const updateProductVariant = useCallback(
    (id: string, patch: Partial<ProductVariant>) => {
      setProductVariants((prev) =>
        prev.map((variant) =>
          variant.id === id ? { ...variant, ...patch } : variant
        )
      );
    },
    []
  );

  const deleteProductVariant = useCallback((id: string) => {
    setProductVariants((prev) => prev.filter((variant) => variant.id !== id));
  }, []);

  // Each of these computes the updated order first (never inside the
  // setState updater itself — React may invoke that updater more than once
  // per call, e.g. under Strict Mode, and side effects like "persist to
  // disk" or "send an email" must run exactly once per real change) then
  // updates local state and persists/notifies afterward.
  const updateOrderStatus = useCallback(
    (id: string, status: OrderStatus) => {
      const updated = orders.find((o) => o.id === id);
      if (!updated) return;
      const next = { ...updated, order_status: status };

      setOrders((prev) => prev.map((o) => (o.id === id ? next : o)));
      void persistOrder(next);

      // Real backend: this is the update-order-status Edge Function's job
      // (see backend/functions/update-order-status/index.ts) — it sends
      // the matching email itself. Locally, log the same content so it's
      // visible on /notifications without a Resend account.
      const notify =
        status === "packed"
          ? logOrderPacked
          : status === "shipped"
            ? logOrderShipped
            : status === "out_for_delivery"
              ? logOutForDelivery
              : status === "delivered"
                ? logOrderDelivered
                : null;
      if (notify) void notify(next);
    },
    [orders]
  );

  const updateOrderShipping = useCallback(
    (id: string, courier_name: string, tracking_number: string) => {
      const updated = orders.find((o) => o.id === id);
      if (!updated) return;
      const next = { ...updated, courier_name, tracking_number };

      setOrders((prev) => prev.map((o) => (o.id === id ? next : o)));
      void persistOrder(next);
    },
    [orders]
  );

  const cancelOrder = useCallback(
    (id: string) => {
      const updated = orders.find((o) => o.id === id);
      if (!updated) return;
      const next = { ...updated, order_status: "cancelled" as const };

      setOrders((prev) => prev.map((o) => (o.id === id ? next : o)));
      void persistOrder(next);
    },
    [orders]
  );

  const refundOrder = useCallback(
    (id: string, amount?: number, reason?: string) => {
      const order = orders.find((o) => o.id === id);
      if (!order) return;

      const remaining = order.total_inr - (order.refund_amount_inr ?? 0);
      const refundAmount = amount != null && amount > 0 ? amount : remaining;
      const isFull = refundAmount >= remaining;

      const next = {
        ...order,
        refund_status: "initiated" as const,
        refund_amount_inr: refundAmount,
        refund_reason: reason || order.refund_reason,
        refunded_at: new Date().toISOString(),
      };
      setOrders((prev) => prev.map((o) => (o.id === id ? next : o)));
      void persistOrder(next);
      // Production waits for Razorpay's webhook to confirm the refund
      // (refund_status: "completed") before emailing — there's no
      // webhook to simulate here, so the mock notifies right away.
      void logRefundConfirmed(next);

      // Simplification: this mock releases the full quantity of every line
      // item back onto stock regardless of whether the refund is full or
      // partial, since the UI doesn't (yet) let an admin pick individual
      // lines to refund. A real implementation would only release stock for
      // the specific units the refund-order Edge Function was told about.
      const items = orderItems.filter((i) => i.order_id === id);
      for (const item of items) {
        if (item.variant_name) {
          const variant = productVariants.find(
            (v) => v.product_id === item.product_id && v.name === item.variant_name
          );
          if (variant) {
            setProductVariants((prev) =>
              prev.map((v) =>
                v.id === variant.id
                  ? { ...v, stock_quantity: v.stock_quantity + item.quantity }
                  : v
              )
            );
            continue;
          }
        }
        setProducts((prev) =>
          prev.map((p) =>
            p.id === item.product_id
              ? { ...p, stock_quantity: p.stock_quantity + item.quantity }
              : p
          )
        );
      }

      void isFull; // reserved for when refund_status distinguishes "partial" vs "completed" server-side
    },
    [orders, orderItems, productVariants]
  );

  const updateSetting = useCallback(
    (key: SiteSettingKey, value: string | number) => {
      setSettings((prev) =>
        prev.map((setting) =>
          setting.key === key ? { ...setting, value } : setting
        )
      );
    },
    []
  );

  const getSetting = useCallback(
    (key: SiteSettingKey) => settings.find((s) => s.key === key)?.value,
    [settings]
  );

  const setReviewPublished = useCallback((id: string, is_published: boolean) => {
    setReviews((prev) =>
      prev.map((review) => (review.id === id ? { ...review, is_published } : review))
    );
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      categories,
      products,
      productVariants,
      orders,
      orderItems,
      settings,
      auditLogs,
      reviews,
      subscribers,
      addCategory,
      updateCategory,
      addProduct,
      updateProduct,
      deleteProduct,
      addProductVariant,
      updateProductVariant,
      deleteProductVariant,
      updateOrderStatus,
      updateOrderShipping,
      cancelOrder,
      refundOrder,
      updateSetting,
      getSetting,
      setReviewPublished,
    }),
    [
      categories,
      products,
      productVariants,
      orders,
      orderItems,
      settings,
      auditLogs,
      reviews,
      subscribers,
      addCategory,
      updateCategory,
      addProduct,
      updateProduct,
      deleteProduct,
      addProductVariant,
      updateProductVariant,
      deleteProductVariant,
      updateOrderStatus,
      updateOrderShipping,
      cancelOrder,
      refundOrder,
      updateSetting,
      getSetting,
      setReviewPublished,
    ]
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return ctx;
}
