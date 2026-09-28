// Brand wordmark — italic serif "Bougsk" with the flame glyph as a small
// accent mark after the word (the earlier "Rumi" mark replaced the dot of
// the "i" with the flame; "Bougsk" has no "i" for that trick to reuse).
// Mirrors frontend/components/Logo.tsx exactly.
export function Logo({
  tone = "wine",
  className = "",
}: {
  tone?: "wine" | "paper";
  className?: string;
}) {
  const textColor = tone === "wine" ? "var(--wine)" : "var(--paper)";

  return (
    <span role="img" aria-label="Bougsk" className={`inline-flex items-baseline ${className}`}>
      <span aria-hidden="true" className="font-display italic" style={{ color: textColor }}>
        Bougsk
      </span>
      <svg aria-hidden="true" viewBox="0 0 10 14" className="ml-1 h-[0.55em] w-auto self-start">
        <path
          d="M5 0C3.5 2.5 2 3.8 2 6C2 7.7 3.3 9 5 9C6.7 9 8 7.7 8 6C8 5.1 7.7 4.3 7.2 3.7C7.1 4.6 6.5 5.3 5.8 5.3C6.1 4.3 5.8 2.2 5 0Z"
          fill="var(--gold)"
        />
      </svg>
    </span>
  );
}
