import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductImage } from "@/components/ProductImage";
import { ProductActions } from "@/components/ProductActions";
import { ProductCard } from "@/components/ProductCard";
import { Badge } from "@/components/Badge";
import { PageViewTracker } from "@/components/PageViewTracker";
import { ClockIcon, WeightIcon, LeafIcon } from "@/components/icons";
import {
  getProductBySlug,
  getRelatedProducts,
  getCareInstructions,
  isNewProduct,
  products,
} from "@/lib/mockData";

export function generateStaticParams() {
  return products.filter((p) => p.is_active).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};

  const title = `${product.name} — ${product.scent_notes.slice(0, 2).join(", ")} | Bougsk`;
  const description = `${product.description} Burns for roughly ${product.burn_time_hours} hours.`;

  return {
    title,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: { title, description, url: `/product/${product.slug}`, type: "website" },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const related = getRelatedProducts(product);
  const careLines = getCareInstructions(product);
  const soldOut = product.stock_quantity === 0 && !product.variants?.some((v) => v.stock_quantity > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: "Bougsk" },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price_inr,
      availability: soldOut
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageViewTracker event="product_viewed" data={{ product_id: product.id }} />
      <script
        type="application/ld+json"
        // Escape "<" so a product name/description containing "</script>"
        // can't break out of this tag — JSON.stringify alone doesn't do this.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductImage name={product.name} className="aspect-square w-full" radius="rounded-lg" />

        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl text-ink">{product.name}</h1>
            {isNewProduct(product) && <Badge tone="new">New</Badge>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.scent_notes.map((note) => (
              <span
                key={note}
                className="rounded-full bg-sand px-3 py-1 text-xs text-ink/70"
              >
                {note}
              </span>
            ))}
            <Badge tone="neutral">Soy wax</Badge>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink/70">
            <span className="flex items-center gap-1.5">
              <ClockIcon className="h-4 w-4" />
              Burns for roughly {product.burn_time_hours} hours
            </span>
            <span className="flex items-center gap-1.5">
              <WeightIcon className="h-4 w-4" />
              {product.weight_grams}g
            </span>
            <span className="flex items-center gap-1.5 text-sage">
              <LeafIcon className="h-4 w-4" />
              Natural soy wax
            </span>
          </div>

          <div className="mt-8">
            <ProductActions product={product} />
          </div>

          <div className="mt-10 space-y-6 border-t border-sand pt-8 text-sm text-ink/80">
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.08em] text-ink/50">
                Description
              </p>
              <p>{product.description}</p>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.08em] text-ink/50">
                Ingredients
              </p>
              <p>{product.ingredients}</p>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.08em] text-ink/50">Care</p>
              <ul className="list-disc space-y-1 pl-4">
                {careLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="font-display mb-6 text-2xl text-ink">You may also like</h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
