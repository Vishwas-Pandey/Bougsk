import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { FlameGlyph } from "./FlameGlyph";

type Variant = "primary" | "secondary" | "ghost";

interface BaseProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gold text-ink border border-gold-deep hover:bg-gold-deep disabled:bg-disabled disabled:text-paper disabled:border-disabled",
  secondary:
    "bg-transparent text-wine border border-wine hover:bg-wine hover:text-paper disabled:border-disabled disabled:text-disabled disabled:hover:bg-transparent disabled:hover:text-disabled",
  ghost:
    "bg-transparent text-ink border border-transparent hover:border-sand hover:text-wine disabled:text-disabled disabled:hover:border-transparent",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:pointer-events-none";

export function Button({
  variant = "primary",
  children,
  className = "",
  loading = false,
  loadingText,
  disabled,
  ...rest
}: BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; loadingText?: string }) {
  return (
    <button
      className={`${base} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <FlameGlyph className="h-4 w-4 animate-flame-flicker" />}
      {loading ? loadingText ?? children : children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  children,
  className = "",
  onClick,
}: BaseProps & { href: string; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${base} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
