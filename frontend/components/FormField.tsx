import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

// Rest (sand fill), focus (gold-deep border + glow), error (error border, paper fill,
// message below), disabled (disabled token) — per Brand Bible's Input component.
// Always labeled above the field; native browser validation UI is suppressed
// (forms use noValidate) in favor of this error state.
const fieldBase =
  "w-full rounded-md px-4 py-2.5 text-sm border transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] outline-none disabled:bg-disabled/15 disabled:text-disabled disabled:cursor-not-allowed";

function fieldClasses(error?: string) {
  return error
    ? `${fieldBase} border-error bg-paper focus:border-error focus:ring-2 focus:ring-error/15`
    : `${fieldBase} border-transparent bg-sand focus:border-gold-deep focus:ring-2 focus:ring-gold-deep/20`;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-xs uppercase tracking-[0.08em] text-ink/60">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-error">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink/50">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({
  error,
  className = "",
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return <input aria-invalid={!!error} className={`${fieldClasses(error)} ${className}`} {...rest} />;
}

export function Textarea({
  error,
  className = "",
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return <textarea aria-invalid={!!error} className={`${fieldClasses(error)} ${className}`} {...rest} />;
}
