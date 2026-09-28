import { ShopBrowser } from "@/components/ShopBrowser";

export const metadata = {
  title: "Shop — Bougsk",
  description: "Hand-poured soy candles, small-batch — browse the full Bougsk collection.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  return <ShopBrowser />;
}
