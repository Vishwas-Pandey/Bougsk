import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-body font-medium transition-colors duration-300 ease-out disabled:pointer-events-none disabled:bg-disabled disabled:text-paper disabled:border-disabled whitespace-nowrap";

const variantClasses: Record<Variant, string> = {
  primary: "bg-gold text-ink border border-gold-deep hover:bg-gold-deep",
  secondary: "bg-transparent text-wine border border-wine hover:bg-wine hover:text-paper",
  ghost: "bg-transparent text-ink border border-transparent hover:border-sand hover:bg-sand",
  destructive: "bg-error text-paper border border-error hover:opacity-90",
};

interface CommonProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

type AsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type AsLink = CommonProps & { href: string };

export function Button(props: AsButton | AsLink) {
  const { variant = "primary", children, className = "" } = props;
  const classes = `${base} ${variantClasses[variant]} ${className}`;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { href: _href, variant: _variant, className: _className, children: _children, ...rest } =
    props as AsButton;
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
