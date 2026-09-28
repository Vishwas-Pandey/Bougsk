import type { ReactNode } from "react";

// One fixed meaning per tone — never reused for something else (Brand Bible Components tab).
type Tone = "new" | "natural" | "in-stock" | "sold-out" | "neutral";

const toneClasses: Record<Tone, string> = {
  new: "bg-wine text-paper",
  natural: "bg-sage/15 text-sage",
  "in-stock": "bg-sage/15 text-sage",
  "sold-out": "bg-error/10 text-error",
  neutral: "bg-sand text-ink/70 border border-ink/10",
};

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.06em] ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
