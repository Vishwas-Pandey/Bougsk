import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopBrowser } from "@/components/ShopBrowser";
import { categories } from "@/lib/mockData";

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const match = categories.find((c) => c.slug === category);
  if (!match) return {};
  return {
    title: `${match.name} — Bougsk`,
    description: match.description,
    alternates: { canonical: `/shop/${match.slug}` },
  };
}

export default async function ShopCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const match = categories.find((c) => c.slug === category);
  if (!match) notFound();

  return <ShopBrowser initialCategorySlug={category} />;
}
