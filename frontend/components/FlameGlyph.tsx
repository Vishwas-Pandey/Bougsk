// The one recurring motif per Brand Bible §8 — favicon, loading state, section divider.
// Always gold, regardless of surrounding context.
export function FlameGlyph({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2C10 6 7 8 7 12.5C7 16.09 9.24 19 12 19C14.76 19 17 16.09 17 12.5C17 11 16.4 9.8 15.6 8.7C15.4 10.4 14.3 11.5 13.2 11.5C13.7 9.5 13.2 6 12 2Z"
        fill="var(--color-gold)"
      />
      <path
        d="M12 15.5C10.9 15.5 10 14.5 10 13.3C10 12.5 10.4 11.9 10.9 11.3C10.9 12.3 11.6 13 12.3 12.9C12.1 13.7 12.4 14.4 13 14.7C12.7 15.2 12.4 15.5 12 15.5Z"
        fill="var(--color-paper)"
      />
    </svg>
  );
}
