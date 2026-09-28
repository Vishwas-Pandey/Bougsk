import Link from "next/link";
import type { ComponentType } from "react";
import { ButtonLink } from "@/components/Button";
import { ProductCard } from "@/components/ProductCard";
import { FlameGlyph } from "@/components/FlameGlyph";
import { PageViewTracker } from "@/components/PageViewTracker";
import { DropletIcon, ScissorsIcon, GiftIcon, InstagramIcon } from "@/components/icons";
import { getFeaturedProducts, categories, siteSettings } from "@/lib/mockData";

const howItsMade: { title: string; copy: string; Icon: ComponentType<{ className?: string }> }[] = [
  { title: "Poured", copy: "Soy wax, poured by hand into small batches.", Icon: DropletIcon },
  { title: "Wick-trimmed", copy: "Every wick trimmed and checked before it ships.", Icon: ScissorsIcon },
  { title: "Wrapped", copy: "Wrapped in kraft and tissue, ready to give.", Icon: GiftIcon },
];

const occasionSlugs = ["diwali", "wedding-favors", "housewarming"];

export default function HomePage() {
  const featured = getFeaturedProducts();
  const occasions = categories.filter((c) => occasionSlugs.includes(c.slug));
  const whatsappHref = `https://wa.me/${siteSettings.whatsapp_number}?text=${encodeURIComponent(
    "Hi Bougsk, I'd like help picking a candle — any recommendations?"
  )}`;

  return (
    <div>
      <PageViewTracker event="homepage_viewed" />

      <section className="relative flex min-h-[70vh] items-end overflow-hidden rounded-b-lg bg-gradient-to-br from-charcoal via-charcoal to-wine/60 sm:rounded-b-lg">
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-transparent" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-32 sm:px-6">
          <p className="mb-3 text-xs uppercase tracking-[0.08em] text-gold">
            Hand-poured · Small batches
          </p>
          <h1 className="font-display max-w-xl text-5xl italic text-paper sm:text-6xl">
            Maison de Lumière
          </h1>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <ButtonLink href="/shop">Shop the collection</ButtonLink>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-paper/80 hover:text-paper hover:underline"
            >
              Not sure what to pick? Message us — real answers, no bot.
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-3xl text-ink">Featured</h2>
          <Link href="/shop" className="text-sm text-wine hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="rounded-lg bg-sand px-6 py-12 text-center sm:px-16">
          <FlameGlyph className="mx-auto mb-4 h-6 w-6" />
          <p className="font-display italic text-xl text-ink sm:text-2xl">
            A flame you light on purpose, in a room you want to feel different in.
          </p>
          <Link
            href="/about"
            className="mt-5 inline-block text-sm text-wine hover:underline"
          >
            Read our story
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <h2 className="font-display mb-8 text-3xl text-ink">How it&apos;s made</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {howItsMade.map((step) => (
            <div key={step.title} className="rounded-md bg-sand p-6">
              <div className="mb-4 flex aspect-video items-center justify-center rounded-sm bg-gradient-to-br from-wine/15 to-gold/20">
                <step.Icon className="h-7 w-7 text-wine/70" />
              </div>
              <h3 className="font-display text-lg text-ink">{step.title}</h3>
              <p className="mt-1 text-sm text-ink/70">{step.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {occasions.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <h2 className="font-display mb-8 text-3xl text-ink">Gifting for the occasion</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {occasions.map((occasion) => (
              <Link
                key={occasion.id}
                href={`/shop/${occasion.slug}`}
                className="group rounded-md bg-charcoal p-6 text-charcoal-ink transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-wine"
              >
                <h3 className="font-display text-xl">{occasion.name}</h3>
                <p className="mt-2 text-sm text-charcoal-ink/70 group-hover:text-paper/80">
                  {occasion.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="mb-6 flex items-center gap-2">
          <InstagramIcon className="h-5 w-5 text-wine" />
          <h2 className="font-display text-2xl text-ink">Follow along</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-sm bg-gradient-to-br from-sand to-wine/20"
            />
          ))}
        </div>
        <a
          href={siteSettings.instagram_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm text-wine hover:underline"
        >
          @bougsk on Instagram
        </a>
      </section>
    </div>
  );
}
