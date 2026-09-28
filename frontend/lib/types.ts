export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price_inr: number;
  stock_quantity: number;
  sku: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  scent_notes: string[];
  ingredients: string;
  care_instructions?: string;
  hsn_code?: string;
  sku?: string;
  burn_time_hours: number;
  weight_grams: number;
  price_inr: number;
  compare_at_price_inr?: number;
  stock_quantity: number;
  low_stock_threshold?: number | null;
  is_active: boolean;
  is_featured: boolean;
  image_paths: string[];
  variants?: ProductVariant[];
  created_at: string;
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
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
export type RefundStatus = "none" | "initiated" | "partial" | "completed" | "failed";

export interface OrderItem {
  product_id: string;
  product_name: string;
  variant_name?: string;
  hsn_code?: string;
  unit_price_inr: number;
  quantity: number;
  line_total_inr: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: ShippingAddress;
  billing_address?: ShippingAddress;
  subtotal_inr: number;
  discount_inr: number;
  taxable_amount_inr: number;
  tax_rate_percent: number;
  tax_amount_inr: number;
  shipping_fee_inr: number;
  total_inr: number;
  gst_invoice_number?: string;
  buyer_gstin?: string;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  refund_status: RefundStatus;
  courier_name?: string;
  tracking_number?: string;
  is_gift: boolean;
  gift_message?: string;
  recipient_name?: string;
  gift_wrap_requested: boolean;
  items: OrderItem[];
  created_at: string;
}

export interface CartLine {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}
