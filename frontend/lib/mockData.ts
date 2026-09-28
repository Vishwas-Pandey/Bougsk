// Placeholder data standing in for Supabase reads until a real project is connected.
// Shape matches backend/migrations/*.sql exactly so swapping in
// lib/supabaseClient.ts queries later is a drop-in replacement.
import type { Category, Product } from "./types";

export const categories: Category[] = [
  {
    id: "cat-signature",
    name: "Signature",
    slug: "signature",
    description: "The scents we started with — still the ones we reach for first.",
    sort_order: 0,
  },
  {
    id: "cat-amber-wood",
    name: "Amber & Wood",
    slug: "amber-wood",
    description: "Warm, resinous, a little smoky. Old libraries and low light.",
    sort_order: 1,
  },
  {
    id: "cat-floral-green",
    name: "Floral & Green",
    slug: "floral-green",
    description: "Cut stems, wet leaves, a window left open in the morning.",
    sort_order: 2,
  },
  {
    id: "cat-seasonal",
    name: "Seasonal",
    slug: "seasonal",
    description: "Poured in small runs, gone when the season turns.",
    sort_order: 3,
  },
  // Occasion pages — same /shop/[category] route, no new architecture (Build Spec §SEO requirements).
  {
    id: "cat-diwali",
    name: "Diwali",
    slug: "diwali",
    description: "A candle gift for Diwali — small fires for the festival of lights.",
    sort_order: 4,
  },
  {
    id: "cat-wedding-favors",
    name: "Wedding Favors",
    slug: "wedding-favors",
    description: "Considered favors for a wedding, ordered in small batches for the date.",
    sort_order: 5,
  },
  {
    id: "cat-housewarming",
    name: "Housewarming",
    slug: "housewarming",
    description: "A candle gift for a housewarming — the first thing lit in a new room.",
    sort_order: 6,
  },
];

export const products: Product[] = [
  {
    id: "prod-amber-dusk",
    category_id: "cat-signature",
    name: "Amber Dusk",
    slug: "amber-dusk",
    description:
      "Amber and sandalwood, poured into blackened terracotta. The scent settles in slowly, like a room after the last guest leaves.",
    scent_notes: ["Amber", "Sandalwood", "Smoke"],
    ingredients: "Soy wax, cotton wick, phthalate-free fragrance oil, blackened terracotta vessel.",
    hsn_code: "3406",
    sku: undefined,
    burn_time_hours: 40,
    weight_grams: 220,
    price_inr: 1450,
    compare_at_price_inr: undefined,
    stock_quantity: 24,
    low_stock_threshold: null,
    is_active: true,
    is_featured: true,
    image_paths: [],
    created_at: "2026-01-14T00:00:00.000Z",
    variants: [
      { id: "var-ad-sm", product_id: "prod-amber-dusk", name: "Small / 120g", price_inr: 950, stock_quantity: 30, sku: "AD-SM", is_active: true },
      { id: "var-ad-lg", product_id: "prod-amber-dusk", name: "Large / 220g", price_inr: 1450, stock_quantity: 24, sku: "AD-LG", is_active: true },
    ],
  },
  {
    id: "prod-wine-ember",
    category_id: "cat-signature",
    name: "Wine Ember",
    slug: "wine-ember",
    description:
      "Fig, dark plum, and a thread of clove. Poured in deep wine glass, the kind of scent that arrives before it announces itself.",
    scent_notes: ["Fig", "Plum", "Clove"],
    ingredients: "Soy wax, cotton wick, phthalate-free fragrance oil, tinted glass vessel.",
    hsn_code: "3406",
    burn_time_hours: 38,
    weight_grams: 210,
    price_inr: 1550,
    stock_quantity: 0,
    low_stock_threshold: null,
    is_active: true,
    is_featured: true,
    image_paths: [],
    created_at: "2026-01-20T00:00:00.000Z",
  },
  {
    id: "prod-cedar-smoke",
    category_id: "cat-amber-wood",
    name: "Cedar & Smoke",
    slug: "cedar-smoke",
    description:
      "Cedarwood and a little smoke, like a fireplace in an old library. Grounding, unhurried, built for long evenings.",
    scent_notes: ["Cedarwood", "Smoke", "Vetiver"],
    ingredients: "Soy wax, cotton wick, phthalate-free fragrance oil, matte charcoal vessel.",
    hsn_code: "3406",
    burn_time_hours: 45,
    weight_grams: 230,
    price_inr: 1650,
    stock_quantity: 15,
    low_stock_threshold: null,
    is_active: true,
    is_featured: true,
    image_paths: [],
    created_at: "2026-02-02T00:00:00.000Z",
  },
  {
    id: "prod-sandalwood-study",
    category_id: "cat-amber-wood",
    name: "Sandalwood Study",
    slug: "sandalwood-study",
    description:
      "Sandalwood, a little leather, a little paper. Made for a desk lamp and a closed door.",
    scent_notes: ["Sandalwood", "Leather", "Paper"],
    ingredients: "Soy wax, cotton wick, phthalate-free fragrance oil, matte stone vessel.",
    hsn_code: "3406",
    burn_time_hours: 42,
    weight_grams: 220,
    price_inr: 1500,
    stock_quantity: 18,
    low_stock_threshold: null,
    is_active: true,
    is_featured: false,
    image_paths: [],
    created_at: "2026-02-10T00:00:00.000Z",
  },
  {
    id: "prod-linen-bloom",
    category_id: "cat-floral-green",
    name: "Linen Bloom",
    slug: "linen-bloom",
    description:
      "White tea and jasmine, folded into fresh linen. Light enough for a morning room.",
    scent_notes: ["White Tea", "Jasmine", "Linen"],
    ingredients: "Soy wax, cotton wick, phthalate-free fragrance oil, pale ceramic vessel.",
    hsn_code: "3406",
    burn_time_hours: 36,
    weight_grams: 200,
    price_inr: 1350,
    stock_quantity: 20,
    low_stock_threshold: null,
    is_active: true,
    is_featured: true,
    image_paths: [],
    created_at: "2026-09-20T00:00:00.000Z",
  },
  {
    id: "prod-fig-leaf",
    category_id: "cat-floral-green",
    name: "Fig Leaf & Moss",
    slug: "fig-leaf-moss",
    description:
      "Green fig leaf, damp moss, a little citrus at the edge. Cut stems in a glass by the window.",
    scent_notes: ["Fig Leaf", "Moss", "Citrus"],
    ingredients: "Soy wax, cotton wick, phthalate-free fragrance oil, pale ceramic vessel.",
    hsn_code: "3406",
    burn_time_hours: 36,
    weight_grams: 200,
    price_inr: 1350,
    stock_quantity: 3,
    low_stock_threshold: null,
    is_active: true,
    is_featured: false,
    image_paths: [],
    created_at: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "prod-winter-hearth",
    category_id: "cat-seasonal",
    name: "Winter Hearth",
    slug: "winter-hearth",
    description:
      "Clove, orange peel, and burnt sugar. Poured for the shortest days of the year, in small batches only.",
    scent_notes: ["Clove", "Orange", "Burnt Sugar"],
    ingredients: "Soy wax, cotton wick, phthalate-free fragrance oil, wine-glazed ceramic vessel.",
    care_instructions:
      "This blend runs a little warmer — trim the wick to 4mm, not 5mm, to keep the burn even.",
    hsn_code: "3406",
    burn_time_hours: 40,
    weight_grams: 220,
    price_inr: 1600,
    stock_quantity: 10,
    low_stock_threshold: 5,
    is_active: true,
    is_featured: false,
    image_paths: [],
    created_at: "2026-09-15T00:00:00.000Z",
  },
  {
    id: "prod-draft-unlit",
    category_id: "cat-seasonal",
    name: "Untitled Draft",
    slug: "untitled-draft",
    description: "Still being tested in the studio — not ready for the shop yet.",
    scent_notes: ["Bergamot", "Tobacco"],
    ingredients: "Soy wax, cotton wick, phthalate-free fragrance oil.",
    hsn_code: "3406",
    burn_time_hours: 40,
    weight_grams: 220,
    price_inr: 1500,
    stock_quantity: 0,
    low_stock_threshold: null,
    is_active: false,
    is_featured: false,
    image_paths: [],
    created_at: "2026-09-22T00:00:00.000Z",
  },
];

export const siteSettings = {
  whatsapp_number: "919625018207",
  shipping_fee_inr: 99,
  free_shipping_threshold_inr: 2000,
  banner_text: "",
  instagram_url: "https://instagram.com/bougsk",
  // GST registration is complete. 5% is the current rate for candles
  // (HSN 3406) under the GST 2.0 reform effective 22 Sept 2025 — confirm
  // with an accountant whether hand-poured candles qualify for the lower
  // 2.5% "handicraft goods" rate instead; this is the safe standard rate.
  tax_rate_percent: 5,
  low_stock_threshold: 3,
  default_care_instructions: [
    "Let it burn long enough for an even melt pool on the first light.",
    "Trim the wick to 5mm before every light.",
    "Don't leave a burning candle unattended; keep away from children, pets, and flammable objects.",
    "The jar gets hot — discontinue use once about 1cm of wax is left.",
    "Store cool, out of direct sunlight.",
  ],
  delivery_estimate_days: "4–6 business days",
};

export function getActiveProducts(): Product[] {
  return products.filter((p) => p.is_active);
}

export function getFeaturedProducts(): Product[] {
  return getActiveProducts().filter((p) => p.is_featured);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug && p.is_active);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getProductsByCategory(categoryId: string): Product[] {
  return getActiveProducts().filter((p) => p.category_id === categoryId);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return getActiveProducts()
    .filter((p) => p.category_id === product.category_id && p.id !== product.id)
    .slice(0, limit);
}

export function getLowStockThreshold(product: Product): number {
  return product.low_stock_threshold ?? siteSettings.low_stock_threshold;
}

export function isLowStock(product: Product): boolean {
  return product.stock_quantity > 0 && product.stock_quantity <= getLowStockThreshold(product);
}

const NEW_WINDOW_DAYS = 21;
export function isNewProduct(product: Product): boolean {
  const ageMs = Date.now() - new Date(product.created_at).getTime();
  return ageMs <= NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

export function getCareInstructions(product: Product): string[] {
  return product.care_instructions
    ? [product.care_instructions]
    : siteSettings.default_care_instructions;
}
