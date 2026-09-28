import Link from "next/link";
import { Logo } from "./Logo";
import { PinIcon, InstagramIcon, MailIcon } from "./icons";
import { NewsletterForm } from "./NewsletterForm";
import { businessInfo } from "@/lib/businessInfo";
import { siteSettings } from "@/lib/mockData";

export function Footer() {
  return (
    <footer className="mt-24 bg-charcoal text-charcoal-ink">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo tone="paper" className="text-xl" />
          <p className="mt-3 flex items-start gap-2 text-sm text-charcoal-ink/70">
            <PinIcon className="mt-0.5 h-4 w-4 shrink-0" />
            Hand-poured in small batches, {businessInfo.address.city}.
          </p>
          <p className="mt-2 text-xs text-charcoal-ink/50">
            {businessInfo.brandName} is a brand by {businessInfo.tradeName}.
          </p>
          <div className="mt-5 max-w-sm">
            <p className="mb-2 text-xs uppercase tracking-[0.08em] text-charcoal-ink/50">
              Get first access to new scents — no spam, just light.
            </p>
            <NewsletterForm source="footer" />
          </div>
        </div>

        <div className="text-sm">
          <p className="mb-3 uppercase tracking-[0.08em] text-charcoal-ink/50">Shop</p>
          <ul className="space-y-2 text-charcoal-ink/80">
            <li><Link href="/shop">All candles</Link></li>
            <li><Link href="/track-order">Track order</Link></li>
            <li className="flex items-center gap-2">
              <MailIcon className="h-4 w-4" />
              <Link href="/contact">Contact</Link>
            </li>
            <li className="flex items-center gap-2">
              <InstagramIcon className="h-4 w-4" />
              <a href={siteSettings.instagram_url} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </li>
          </ul>
        </div>

        <div className="text-sm">
          <p className="mb-3 uppercase tracking-[0.08em] text-charcoal-ink/50">Policies</p>
          <ul className="space-y-2 text-charcoal-ink/80">
            <li><Link href="/policies#shipping">Shipping</Link></li>
            <li><Link href="/policies#returns">Returns</Link></li>
            <li><Link href="/policies#privacy">Privacy</Link></li>
            <li><Link href="/policies#terms">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-charcoal-ink/10 px-4 py-4 text-center text-xs text-charcoal-ink/50 sm:px-6">
        © {new Date().getFullYear()} {businessInfo.tradeName}. Maison de Lumière.
      </div>
    </footer>
  );
}
