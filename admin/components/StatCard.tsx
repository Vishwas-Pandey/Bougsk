export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-card bg-white border border-sand p-6">
      <p className="text-label-upper uppercase tracking-[0.08em] font-semibold text-ink/60">
        {label}
      </p>
      <p className="font-display text-h1 text-ink mt-2">{value}</p>
      {hint && <p className="text-body text-ink/60 mt-1">{hint}</p>}
    </div>
  );
}
