// Brand mark — the client's own logo artwork (public/logo.webp): an arch,
// star, and flame emblem over the "Bougsk" wordmark and "Maison de Lumière"
// tagline, gold on transparent. Mirrors frontend/components/Logo.tsx exactly.
// `className` controls size — pass a height utility (e.g. `h-14`); width
// follows automatically to keep the artwork's own proportions.
export function Logo({
  className = "",
}: {
  tone?: "wine" | "paper"; // kept for call-site compatibility; the artwork itself doesn't vary by surface
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- small fixed brand asset, next/image's fixed intrinsic sizing fights the many different display heights this needs
    <img
      src="/logo.webp"
      alt="Bougsk — Maison de Lumière"
      className={`w-auto object-contain ${className}`}
    />
  );
}
