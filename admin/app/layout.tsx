import type { Metadata } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bougsk Admin",
  description: "Manage Bougsk's products, orders and storefront settings.",
  // Private panel — must never show up in search results, unlike the
  // storefront. Not a substitute for the domain-level access control
  // (Supabase Auth + admins allow-list); this only stops indexing.
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${workSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
