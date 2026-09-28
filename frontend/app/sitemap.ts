import type { MetadataRoute } from "next";
import { categories, getActiveProducts } from "@/lib/mockData";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bougsk.pages.dev";

// Generated from is_active products/categories per Build Spec §SEO requirements.
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/shop", "/about", "/contact", "/track-order", "/policies"].map(
    (path) => ({ url: `${siteUrl}${path}`, lastModified: new Date() })
  );

  const categoryRoutes = categories.map((c) => ({
    url: `${siteUrl}/shop/${c.slug}`,
    lastModified: new Date(),
  }));

  const productRoutes = getActiveProducts().map((p) => ({
    url: `${siteUrl}/product/${p.slug}`,
    lastModified: new Date(p.created_at),
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
