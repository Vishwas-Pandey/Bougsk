import { FlameGlyph } from "@/components/FlameGlyph";
import { businessInfo } from "@/lib/businessInfo";

export const metadata = {
  title: "About — Bougsk",
  description: "Why every Bougsk candle is poured by hand, in small batches.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="mb-3 text-xs uppercase tracking-[0.08em] text-ink/50">Our story</p>
      <h1 className="font-display mb-6 text-4xl italic text-ink">Maison de Lumière</h1>

      <div className="space-y-5 text-sm leading-relaxed text-ink/80">
        <p>
          House of light — that&apos;s the whole idea behind Bougsk. A candle is a
          small, deliberate thing: a flame you light on purpose, in a room you want to
          feel different in. Nothing louder than that.
        </p>
        <p className="font-display italic text-lg text-ink">
          Light, not just scent. Warmth over noise. Made by hand.
        </p>
        <p>
          Every candle is poured in small batches, wick-trimmed and checked by hand, and
          wrapped before it ships. We&apos;d rather make fewer things well than more
          things quickly.
        </p>
      </div>

      <div className="mt-12 flex items-center gap-2 text-ink/50">
        <FlameGlyph className="h-4 w-4" />
        <span className="text-xs">
          Hand-poured in {businessInfo.address.city} · a brand by {businessInfo.tradeName}
        </span>
      </div>
    </div>
  );
}
