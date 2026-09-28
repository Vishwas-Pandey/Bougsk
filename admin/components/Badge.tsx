import type { ReactNode } from "react";
import type { BadgeTone } from "@/lib/statusMeta";

const toneClasses: Record<BadgeTone, string> = {
  sage: "bg-sage/15 text-sage",
  gold: "bg-gold/20 text-gold-deep",
  error: "bg-error/15 text-error",
  wine: "bg-wine/10 text-wine",
  neutral: "bg-sand text-ink/70",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-label-upper uppercase tracking-[0.08em] font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
