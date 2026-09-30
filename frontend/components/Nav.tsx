"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { Logo } from "./Logo";
import { CartIcon } from "./icons";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/track-order", label: "Track order" },
];

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount, openDrawer } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-sand bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/">
          <Logo className="h-14" />
        </Link>

        <nav className="hidden items-center gap-8 min-[880px]:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-ink/80 transition-colors duration-300 hover:text-wine"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={openDrawer}
            aria-label="Open cart"
            className="relative text-ink/80 transition-colors duration-300 hover:text-wine"
          >
            <CartIcon className="h-6 w-6" />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[11px] font-medium text-ink">
                {itemCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className="text-ink min-[880px]:hidden"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-sand px-4 pb-4 min-[880px]:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-md px-2 py-3 text-sm text-ink/80 hover:bg-sand"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
