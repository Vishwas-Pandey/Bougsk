"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";
import { Logo } from "./Logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
  { href: "/orders", label: "Orders" },
  { href: "/reviews", label: "Reviews" },
  { href: "/notifications", label: "Notifications" },
  { href: "/settings", label: "Settings" },
  { href: "/audit-log", label: "Audit log" },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`rounded-full px-4 py-2.5 text-body transition-colors duration-300 ease-out ${
              active
                ? "bg-gold text-ink font-medium"
                : "text-paper/70 hover:bg-paper/10 hover:text-paper"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await supabaseAdminClient.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      <header className="md:hidden flex items-center justify-between bg-charcoal px-5 py-4">
        <Logo className="h-10" />
        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setMobileOpen((v) => !v)}
          className="text-paper text-body px-3 py-1.5 rounded-full border border-paper/30"
        >
          {mobileOpen ? "Close" : "Menu"}
        </button>
      </header>
      {mobileOpen && (
        <div className="md:hidden bg-charcoal px-5 pb-5">
          <NavLinks onNavigate={() => setMobileOpen(false)} />
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-3 w-full text-left rounded-full px-4 py-2.5 text-body text-paper/70 hover:bg-paper/10 hover:text-paper transition-colors duration-300 ease-out"
          >
            Sign out
          </button>
        </div>
      )}

      <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:justify-between bg-charcoal px-5 py-8 min-h-screen sticky top-0">
        <div>
          <Logo className="h-20 block px-4 mb-8" />
          <NavLinks />
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-left rounded-full px-4 py-2.5 text-body text-paper/70 hover:bg-paper/10 hover:text-paper transition-colors duration-300 ease-out"
        >
          Sign out
        </button>
      </aside>
    </>
  );
}
