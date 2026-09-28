// Types mirror the real Postgres schema so swapping mockData.ts for live
// Supabase queries later requires no shape changes downstream.

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  scent_notes: string[];
  ingredients: string;
  burn_time_hours: number;
  weight_grams: number;
  price_inr: number;
  compare_at_price_inr: number | null;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  image_paths: string[];
  created_at: string;
  // Only meaningful when the product has no variants — a variant carries its
  // own sku instead. See ProductVariant.sku.
  sku?: string;
  // Blank means "use Settings.default_care_instructions" — most candles ship
  // with the same care copy, this is only for the ones that don't.
  care_instructions?: string;
  hsn_code?: string;
  // null/undefined means "use the site-wide Settings.low_stock_threshold".
  low_stock_threshold?: number | null;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price_inr: number;
  stock_quantity: number;
  sku: string;
  // Lets an admin retire one size/variant without deleting its order history.
  is_active: boolean;
}

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type RefundStatus =
  | "none"
  | "initiated"
  | "partial"
  | "completed"
  | "failed";

export interface ShippingAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: ShippingAddress;
  // undefined/null means "same as shipping_address".
  billing_address?: ShippingAddress;
  subtotal_inr: number;
  discount_inr: number;
  taxable_amount_inr: number;
  tax_rate_percent: number;
  tax_amount_inr: number;
  shipping_fee_inr: number;
  // Conceptually taxable_amount_inr + tax_amount_inr + shipping_fee_inr.
  total_inr: number;
  payment_status: PaymentStatus;
  payment_gateway_order_id: string;
  payment_gateway_payment_id: string | null;
  // Only ever written once a real invoice has been cut, i.e. once paid.
  gst_invoice_number?: string;
  // Present only for B2B buyers who supplied a GSTIN at checkout.
  buyer_gstin?: string;
  // Only ever written by the refund-order Edge Function + Razorpay webhook
  // in production — see the comment on updateOrderStatus in store.tsx.
  refund_status: RefundStatus;
  refund_amount_inr?: number;
  refund_reason?: string;
  refunded_at?: string;
  order_status: OrderStatus;
  courier_name: string;
  tracking_number: string;
  notes: string;
  is_gift: boolean;
  gift_message?: string;
  // The shipping label uses this name; the invoice still uses customer_name,
  // since that's who actually paid.
  recipient_name?: string;
  gift_wrap_requested: boolean;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  variant_name: string;
  unit_price_inr: number;
  quantity: number;
  line_total_inr: number;
  hsn_code?: string;
}

export type SiteSettingKey =
  | "whatsapp_number"
  | "shipping_fee_inr"
  | "banner_text"
  | "instagram_url"
  | "tax_rate_percent"
  | "default_care_instructions"
  | "low_stock_threshold";

export interface SiteSetting {
  key: SiteSettingKey;
  value: string | number;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string; // e.g. "product.price_updated"
  entity_type: "product" | "order" | "site_settings" | string;
  entity_id: string;
  old_value?: unknown;
  new_value?: unknown;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  order_id?: string;
  customer_name: string;
  rating: number; // 1-5
  review_text?: string;
  image_path?: string;
  is_verified_purchase: boolean;
  // The moderation gate: false until an admin approves it, only then does it
  // appear anywhere on the storefront.
  is_published: boolean;
  created_at: string;
}

export interface Subscriber {
  id: string;
  email: string;
  source: string; // "footer" | "checkout" | "post_purchase"
  consented: boolean;
  created_at: string;
}
