import type { SVGProps } from "react";

// Thin line icons (1.5px stroke, rounded caps) per Brand Bible §8.
// Color is inherited from the surrounding text color — theme with className.
const base: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function CartIcon({ className = "" }: { className?: string }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M3 4h2l2.2 11.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L20.5 8H6" />
      <circle cx="9.5" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ClockIcon({ className = "" }: { className?: string }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function WeightIcon({ className = "" }: { className?: string }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M8.5 4h7l1.5 3h-10z" />
      <path d="M6 7h12l1.5 12.5a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5z" />
    </svg>
  );
}

export function LeafIcon({ className = "" }: { className?: string }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M5 19c9-1 12-7 12-14-9 0-13 4-13 11 0 1.2.2 2.1.6 3z" />
      <path d="M6 18 15 6" />
    </svg>
  );
}

export function TruckIcon({ className = "" }: { className?: string }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M2.5 6.5h11v9h-11z" />
      <path d="M13.5 10h4l3 3v2.5h-7z" />
      <circle cx="7" cy="18.5" r="1.6" />
      <circle cx="17" cy="18.5" r="1.6" />
    </svg>
  );
}

export function ShieldIcon({ className = "" }: { className?: string }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 3.5 19 6v6c0 4.2-2.9 7-7 8.5-4.1-1.5-7-4.3-7-8.5V6z" />
      <path d="M9.2 12 11 13.8l4-4" />
    </svg>
  );
}

export function DocumentIcon({ className = "" }: { className?: string }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M6.5 3h7l4 4v14h-11z" />
      <path d="M13.5 3v4h4" />
      <path d="M9 13h6M9 16.5h6" />
    </svg>
  );
}

export function ReturnIcon({ className = "" }: { className?: string }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M4 10.5h9a5 5 0 0 1 0 10H9" />
      <path d="M7.5 6.5 4 10.5l3.5 4" />
    </svg>
  );
}

export function PinIcon({ className = "" }: { className?: string }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.25" />
    </svg>
  );
}

export function InstagramIcon({ className = "" }: { className?: string }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.7" />
      <circle cx="17" cy="7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function DropletIcon({ className = "" }: { className?: string }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 3.5C9 8 6 11.3 6 14.8a6 6 0 0 0 12 0c0-3.5-3-6.8-6-11.3z" />
    </svg>
  );
}

export function ScissorsIcon({ className = "" }: { className?: string }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="2.3" />
      <circle cx="6.5" cy="17.5" r="2.3" />
      <path d="M8.3 8 20 19M8.3 16 20 5" />
    </svg>
  );
}

export function GiftIcon({ className = "" }: { className?: string }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="4" y="9.5" width="16" height="10.5" rx="1.5" />
      <path d="M4 12.5h16" />
      <path d="M12 9.5v10.5" />
      <path d="M12 9.5c-1-3-3-4-4.5-3S6 9 8 9.5zM12 9.5c1-3 3-4 4.5-3S18 9 16 9.5z" />
    </svg>
  );
}

export function LockIcon({ className = "" }: { className?: string }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="5.5" y="10.5" width="13" height="9" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function MailIcon({ className = "" }: { className?: string }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}
