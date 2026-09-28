import type {
  AdminAuditLog,
  Category,
  Order,
  OrderItem,
  Product,
  ProductVariant,
  Review,
  SiteSetting,
  Subscriber,
} from "./types";

// Below this many units on hand, /dashboard and /products flag a product as
// low stock, unless a product or Settings.low_stock_threshold overrides it.
// Kept as one constant so every read that needs a last-resort default agrees.
export const LOW_STOCK_THRESHOLD = 10;

// product.low_stock_threshold (null/undefined) falls back to the site-wide
// setting, which itself falls back to LOW_STOCK_THRESHOLD if ever unset.
export function lowStockThreshold(
  product: Product,
  siteDefault: number
): number {
  return product.low_stock_threshold ?? siteDefault;
}

// product.care_instructions (blank) falls back to the site-wide default.
export function effectiveCareInstructions(
  product: Product,
  siteDefault: string
): string {
  return product.care_instructions?.trim() ? product.care_instructions : siteDefault;
}

export const DEFAULT_CARE_INSTRUCTIONS = [
  "Let it burn long enough for an even melt pool on the first light.",
  "Trim the wick to 5mm before every light.",
  "Don't leave a burning candle unattended; keep away from children, pets, and flammable objects.",
  "The jar gets hot — discontinue use once about 1cm of wax is left.",
  "Store cool, out of direct sunlight.",
].join("\n");

// Anchored to a fixed date rather than `new Date()` — this module gets
// evaluated separately on the server and in the browser, at genuinely
// different moments (and, right at a day rollover, on different calendar
// days), so "days ago" computed from the live clock renders a different
// value on each side and triggers a React hydration mismatch. Fixed seed
// data needs a fixed anchor.
const SEED_ANCHOR = new Date("2026-09-27T00:00:00.000Z");
function daysAgo(days: number, hour = 10): string {
  const d = new Date(SEED_ANCHOR);
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const categories: Category[] = [
  {
    id: "cat-1",
    name: "Signature Candles",
    slug: "signature-candles",
    description: "Our year-round pours, the ones we always keep on the shelf.",
    sort_order: 1,
  },
  {
    id: "cat-2",
    name: "Seasonal Editions",
    slug: "seasonal-editions",
    description: "Small batches tied to a season, gone once they sell out.",
    sort_order: 2,
  },
  {
    id: "cat-3",
    name: "Gift Sets",
    slug: "gift-sets",
    description: "Candles paired and boxed for giving.",
    sort_order: 3,
  },
];

// HSN 3406 covers candles, tapers and the like under Indian GST.
const CANDLE_HSN_CODE = "3406";

export const products: Product[] = [
  {
    id: "prod-1",
    category_id: "cat-1",
    name: "Amber & Oud",
    slug: "amber-oud",
    description:
      "A warm, resinous pour built around aged amber and a whisper of smoked oud. Our most-reordered scent.",
    scent_notes: ["Amber", "Oud", "Sandalwood"],
    ingredients: "Coconut-soy wax blend, cotton wick, phthalate-free fragrance oil",
    burn_time_hours: 45,
    weight_grams: 220,
    price_inr: 1450,
    compare_at_price_inr: null,
    stock_quantity: 42,
    is_active: true,
    is_featured: true,
    image_paths: [],
    created_at: daysAgo(140),
    // Has variants (see var-1), so sku is left blank in favour of per-variant skus.
    hsn_code: CANDLE_HSN_CODE,
    low_stock_threshold: null,
  },
  {
    id: "prod-2",
    category_id: "cat-1",
    name: "Fig & Cedar",
    slug: "fig-cedar",
    description:
      "Green fig leaf softened by cedar shavings and a low hum of vetiver underneath.",
    scent_notes: ["Fig Leaf", "Cedar", "Vetiver"],
    ingredients: "Coconut-soy wax blend, cotton wick, phthalate-free fragrance oil",
    burn_time_hours: 40,
    weight_grams: 200,
    price_inr: 1350,
    compare_at_price_inr: null,
    stock_quantity: 8,
    is_active: true,
    is_featured: false,
    image_paths: [],
    created_at: daysAgo(120),
    sku: "FIG-CEDAR-200",
    hsn_code: CANDLE_HSN_CODE,
    low_stock_threshold: null,
  },
  {
    id: "prod-3",
    category_id: "cat-1",
    name: "Vetiver Smoke",
    slug: "vetiver-smoke",
    description:
      "Earthy vetiver root, a little smoked, a little green. Unisex and unhurried.",
    scent_notes: ["Vetiver", "Smoked Wood", "Black Pepper"],
    ingredients: "Coconut-soy wax blend, cotton wick, phthalate-free fragrance oil",
    burn_time_hours: 48,
    weight_grams: 220,
    price_inr: 1550,
    compare_at_price_inr: 1750,
    stock_quantity: 20,
    is_active: true,
    is_featured: false,
    image_paths: [],
    created_at: daysAgo(95),
    sku: "VET-SMOKE-220",
    hsn_code: CANDLE_HSN_CODE,
    low_stock_threshold: null,
  },
  {
    id: "prod-4",
    category_id: "cat-2",
    name: "Winter Spice",
    slug: "winter-spice",
    description:
      "Clove, orange peel and a stick of cinnamon simmered down to a single pour. Here for the season.",
    scent_notes: ["Clove", "Orange Peel", "Cinnamon"],
    ingredients: "Coconut-soy wax blend, cotton wick, phthalate-free fragrance oil",
    burn_time_hours: 42,
    weight_grams: 220,
    price_inr: 1650,
    compare_at_price_inr: 1850,
    stock_quantity: 5,
    is_active: true,
    is_featured: true,
    image_paths: [],
    created_at: daysAgo(30),
    sku: "WIN-SPICE-220",
    hsn_code: CANDLE_HSN_CODE,
    // Sells out fast every winter — admin wants an earlier warning than the
    // site-wide default gives every other product.
    low_stock_threshold: 8,
  },
  {
    id: "prod-5",
    category_id: "cat-2",
    name: "Monsoon Petrichor",
    slug: "monsoon-petrichor",
    description:
      "The smell of the first rain on warm earth, held in wax. A studio favourite that sold out fast.",
    scent_notes: ["Petrichor Accord", "Moss", "White Musk"],
    ingredients: "Coconut-soy wax blend, cotton wick, phthalate-free fragrance oil",
    burn_time_hours: 40,
    weight_grams: 200,
    price_inr: 1500,
    compare_at_price_inr: null,
    stock_quantity: 0,
    is_active: false,
    is_featured: false,
    image_paths: [],
    created_at: daysAgo(60),
    sku: "MON-PETRI-200",
    hsn_code: CANDLE_HSN_CODE,
    low_stock_threshold: null,
  },
  {
    id: "prod-6",
    category_id: "cat-3",
    name: "The Quiet Hours Gift Set",
    slug: "the-quiet-hours-gift-set",
    description:
      "Amber & Oud and Fig & Cedar, boxed with a box of matches and a card, ready to give.",
    scent_notes: ["Amber", "Oud", "Fig Leaf", "Cedar"],
    ingredients: "Coconut-soy wax blend, cotton wicks, phthalate-free fragrance oils",
    burn_time_hours: 85,
    weight_grams: 440,
    price_inr: 3200,
    compare_at_price_inr: 3600,
    stock_quantity: 15,
    is_active: true,
    is_featured: true,
    image_paths: [],
    created_at: daysAgo(20),
    // Has variants (see var-2), so sku is left blank in favour of per-variant skus.
    hsn_code: CANDLE_HSN_CODE,
    care_instructions:
      DEFAULT_CARE_INSTRUCTIONS +
      "\nThis set has two wicks across two jars — trim and check both before every light.",
    low_stock_threshold: null,
  },
];

export const productVariants: ProductVariant[] = [
  {
    id: "var-1",
    product_id: "prod-1",
    name: "Travel Tin, 90g",
    price_inr: 650,
    stock_quantity: 30,
    sku: "AMB-OUD-TIN-90",
    is_active: true,
  },
  {
    id: "var-2",
    product_id: "prod-6",
    name: "Add engraved matchbox",
    price_inr: 3450,
    stock_quantity: 10,
    sku: "GIFT-QH-ENGR",
    is_active: true,
  },
  {
    id: "var-3",
    product_id: "prod-3",
    name: "Travel Tin, 90g",
    price_inr: 750,
    stock_quantity: 0,
    sku: "VET-SMOKE-TIN-90",
    // Retired: this size didn't sell well and has been pulled without
    // deleting it, so past orders that reference it still resolve.
    is_active: false,
  },
];

export const orders: Order[] = [
  {
    id: "ord-1",
    order_number: "BOUGSK-1042",
    customer_name: "Ananya Rao",
    customer_email: "ananya.rao@example.com",
    customer_phone: "+91 98200 11223",
    shipping_address: {
      line1: "14 Palm Grove Road",
      line2: "Flat 3B",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560034",
    },
    subtotal_inr: 2800,
    discount_inr: 0,
    taxable_amount_inr: 2800,
    tax_rate_percent: 0,
    tax_amount_inr: 0,
    shipping_fee_inr: 0,
    total_inr: 2800,
    payment_status: "paid",
    payment_gateway_order_id: "pg_order_9f31a2",
    payment_gateway_payment_id: "pg_pay_77c410",
    gst_invoice_number: "BOUGSK-INV-1042",
    refund_status: "none",
    order_status: "confirmed",
    courier_name: "",
    tracking_number: "",
    notes: "",
    is_gift: false,
    gift_wrap_requested: false,
    created_at: daysAgo(0, 9),
  },
  {
    id: "ord-2",
    order_number: "BOUGSK-1041",
    customer_name: "Rohit Malhotra",
    customer_email: "rohit.m@example.com",
    customer_phone: "+91 90210 44556",
    shipping_address: {
      line1: "22 Lakeview Apartments",
      line2: "",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
    },
    // Billing on file is the customer's office, delivery is home — the two
    // differ, so the order detail page should surface both.
    billing_address: {
      line1: "4th Floor, Cerebrum IT Park",
      line2: "Kalyani Nagar",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411006",
    },
    subtotal_inr: 1450,
    discount_inr: 0,
    taxable_amount_inr: 1450,
    tax_rate_percent: 0,
    tax_amount_inr: 0,
    shipping_fee_inr: 79,
    total_inr: 1529,
    payment_status: "paid",
    payment_gateway_order_id: "pg_order_2b88c1",
    payment_gateway_payment_id: "pg_pay_10ad3e",
    gst_invoice_number: "BOUGSK-INV-1041",
    refund_status: "none",
    order_status: "placed",
    courier_name: "",
    tracking_number: "",
    notes: "Please leave with the security guard if out.",
    is_gift: true,
    gift_message: "Happy anniversary — hope this one becomes your new favourite.",
    recipient_name: "Simran Malhotra",
    gift_wrap_requested: true,
    created_at: daysAgo(0, 14),
  },
  {
    id: "ord-3",
    order_number: "BOUGSK-1040",
    customer_name: "Meera Iyer",
    customer_email: "meera.iyer@example.com",
    customer_phone: "+91 99000 12121",
    shipping_address: {
      line1: "7 Church Street",
      line2: "2nd Floor",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600002",
    },
    subtotal_inr: 3200,
    discount_inr: 0,
    taxable_amount_inr: 3200,
    tax_rate_percent: 0,
    tax_amount_inr: 0,
    shipping_fee_inr: 0,
    total_inr: 3200,
    payment_status: "paid",
    payment_gateway_order_id: "pg_order_55e902",
    payment_gateway_payment_id: "pg_pay_66f813",
    gst_invoice_number: "BOUGSK-INV-1040",
    // Bought under a company name for a client gifting run.
    buyer_gstin: "29ABCDE1234F1Z5",
    refund_status: "none",
    order_status: "packed",
    courier_name: "",
    tracking_number: "",
    notes: "",
    is_gift: false,
    gift_wrap_requested: false,
    created_at: daysAgo(1, 16),
  },
  {
    id: "ord-4",
    order_number: "BOUGSK-1039",
    customer_name: "Karan Shah",
    customer_email: "karan.shah@example.com",
    customer_phone: "+91 98765 22110",
    shipping_address: {
      line1: "101 Marine Drive",
      line2: "",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400020",
    },
    subtotal_inr: 1550,
    discount_inr: 0,
    taxable_amount_inr: 1550,
    tax_rate_percent: 0,
    tax_amount_inr: 0,
    shipping_fee_inr: 79,
    total_inr: 1629,
    payment_status: "paid",
    payment_gateway_order_id: "pg_order_3aa019",
    payment_gateway_payment_id: "pg_pay_9021bb",
    gst_invoice_number: "BOUGSK-INV-1039",
    refund_status: "initiated",
    refund_amount_inr: 800,
    refund_reason: "Wick arrived damaged; partial refund issued in lieu of replacement.",
    refunded_at: daysAgo(1, 12),
    order_status: "shipped",
    courier_name: "Delhivery",
    tracking_number: "DL4471002233",
    notes: "",
    is_gift: false,
    gift_wrap_requested: false,
    created_at: daysAgo(3, 11),
  },
  {
    id: "ord-5",
    order_number: "BOUGSK-1038",
    customer_name: "Priya Nair",
    customer_email: "priya.nair@example.com",
    customer_phone: "+91 96543 87654",
    shipping_address: {
      line1: "48 Hill View Colony",
      line2: "",
      city: "Kochi",
      state: "Kerala",
      pincode: "682001",
    },
    subtotal_inr: 1350,
    discount_inr: 0,
    taxable_amount_inr: 1350,
    tax_rate_percent: 0,
    tax_amount_inr: 0,
    shipping_fee_inr: 79,
    total_inr: 1429,
    payment_status: "failed",
    payment_gateway_order_id: "pg_order_10ffab",
    payment_gateway_payment_id: null,
    // Never paid, so no invoice was ever cut and there is nothing to refund.
    refund_status: "none",
    order_status: "cancelled",
    courier_name: "",
    tracking_number: "",
    notes: "Payment failed twice, customer asked to cancel.",
    is_gift: false,
    gift_wrap_requested: false,
    created_at: daysAgo(5, 18),
  },
];

export const orderItems: OrderItem[] = [
  {
    id: "item-1",
    order_id: "ord-1",
    product_id: "prod-3",
    product_name: "Vetiver Smoke",
    variant_name: "",
    unit_price_inr: 1550,
    quantity: 1,
    line_total_inr: 1550,
    hsn_code: CANDLE_HSN_CODE,
  },
  {
    id: "item-2",
    order_id: "ord-1",
    product_id: "prod-2",
    product_name: "Fig & Cedar",
    variant_name: "",
    unit_price_inr: 1250,
    quantity: 1,
    line_total_inr: 1250,
    hsn_code: CANDLE_HSN_CODE,
  },
  {
    id: "item-3",
    order_id: "ord-2",
    product_id: "prod-1",
    product_name: "Amber & Oud",
    variant_name: "",
    unit_price_inr: 1450,
    quantity: 1,
    line_total_inr: 1450,
    hsn_code: CANDLE_HSN_CODE,
  },
  {
    id: "item-4",
    order_id: "ord-3",
    product_id: "prod-6",
    product_name: "The Quiet Hours Gift Set",
    variant_name: "",
    unit_price_inr: 3200,
    quantity: 1,
    line_total_inr: 3200,
    hsn_code: CANDLE_HSN_CODE,
  },
  {
    id: "item-5",
    order_id: "ord-4",
    product_id: "prod-3",
    product_name: "Vetiver Smoke",
    variant_name: "",
    unit_price_inr: 1550,
    quantity: 1,
    line_total_inr: 1550,
    hsn_code: CANDLE_HSN_CODE,
  },
  {
    id: "item-6",
    order_id: "ord-5",
    product_id: "prod-2",
    product_name: "Fig & Cedar",
    variant_name: "",
    unit_price_inr: 1350,
    quantity: 1,
    line_total_inr: 1350,
    hsn_code: CANDLE_HSN_CODE,
  },
];

export const siteSettings: SiteSetting[] = [
  { key: "whatsapp_number", value: "+91 96250 18207" },
  { key: "shipping_fee_inr", value: 79 },
  {
    key: "banner_text",
    value: "Free shipping over ₹1,999. Handpoured in small batches.",
  },
  { key: "instagram_url", value: "https://instagram.com/bougsk.co" },
  // GST registration is complete. 5% is the current rate for candles
  // (HSN 3406) under the GST 2.0 reform effective 22 Sept 2025 — confirm
  // with an accountant whether hand-poured candles qualify for the lower
  // 2.5% "handicraft goods" rate instead.
  { key: "tax_rate_percent", value: 5 },
  { key: "default_care_instructions", value: DEFAULT_CARE_INSTRUCTIONS },
  { key: "low_stock_threshold", value: LOW_STOCK_THRESHOLD },
];

export const auditLogs: AdminAuditLog[] = [
  {
    id: "audit-1",
    admin_id: "admin-1",
    action: "product.price_updated",
    entity_type: "product",
    entity_id: "prod-3",
    old_value: { price_inr: 1450 },
    new_value: { price_inr: 1550 },
    created_at: daysAgo(18, 11),
  },
  {
    id: "audit-2",
    admin_id: "admin-1",
    action: "product.stock_adjusted",
    entity_type: "product",
    entity_id: "prod-2",
    old_value: { stock_quantity: 20 },
    new_value: { stock_quantity: 8 },
    created_at: daysAgo(9, 15),
  },
  {
    id: "audit-3",
    admin_id: "admin-1",
    action: "order.shipping_updated",
    entity_type: "order",
    entity_id: "ord-4",
    old_value: { order_status: "packed", courier_name: "", tracking_number: "" },
    new_value: {
      order_status: "shipped",
      courier_name: "Delhivery",
      tracking_number: "DL4471002233",
    },
    created_at: daysAgo(3, 11),
  },
  {
    id: "audit-4",
    admin_id: "admin-1",
    action: "site_settings.updated",
    entity_type: "site_settings",
    entity_id: "shipping_fee_inr",
    old_value: { shipping_fee_inr: 0 },
    new_value: { shipping_fee_inr: 79 },
    created_at: daysAgo(60, 10),
  },
  {
    id: "audit-5",
    admin_id: "admin-1",
    action: "product.unpublished",
    entity_type: "product",
    entity_id: "prod-5",
    old_value: { is_active: true },
    new_value: { is_active: false },
    created_at: daysAgo(40, 13),
  },
];

export const reviews: Review[] = [
  {
    id: "review-1",
    product_id: "prod-1",
    order_id: "ord-2",
    customer_name: "Rohit Malhotra",
    rating: 5,
    review_text:
      "Burns clean and the amber comes through without being heavy. Reordering the travel tin next.",
    is_verified_purchase: true,
    is_published: true,
    created_at: daysAgo(2, 10),
  },
  {
    id: "review-2",
    product_id: "prod-3",
    order_id: "ord-1",
    customer_name: "Ananya Rao",
    rating: 4,
    review_text:
      "Love the smoked vetiver, though the throw is a little subtle in a bigger room.",
    is_verified_purchase: true,
    is_published: true,
    created_at: daysAgo(1, 17),
  },
  {
    id: "review-3",
    product_id: "prod-6",
    customer_name: "Sana Kapoor",
    rating: 5,
    review_text:
      "Bought this as a housewarming gift and the packaging alone got compliments. Waiting on moderation to go live.",
    is_verified_purchase: false,
    is_published: false,
    created_at: daysAgo(4, 12),
  },
  {
    id: "review-4",
    product_id: "prod-2",
    customer_name: "Anonymous",
    rating: 2,
    review_text: "Nice jar but the scent faded faster than I expected.",
    is_verified_purchase: false,
    is_published: false,
    created_at: daysAgo(7, 20),
  },
];

export const subscribers: Subscriber[] = [
  {
    id: "sub-1",
    email: "newsletter.reader1@example.com",
    source: "footer",
    consented: true,
    created_at: daysAgo(25, 9),
  },
  {
    id: "sub-2",
    email: "newsletter.reader2@example.com",
    source: "checkout",
    consented: true,
    created_at: daysAgo(6, 14),
  },
  {
    id: "sub-3",
    email: "newsletter.reader3@example.com",
    source: "post_purchase",
    consented: false,
    created_at: daysAgo(1, 9),
  },
];
