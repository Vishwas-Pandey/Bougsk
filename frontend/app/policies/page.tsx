import { TruckIcon, ReturnIcon, ShieldIcon, DocumentIcon } from "@/components/icons";
import { businessInfo, formatRegisteredAddress } from "@/lib/businessInfo";

export const metadata = {
  title: "Policies — Bougsk",
  description: "Shipping, returns, privacy, and terms for ordering from Bougsk.",
  alternates: { canonical: "/policies" },
};

function SectionHeading({
  id,
  icon: Icon,
  title,
}: {
  id: string;
  icon: typeof TruckIcon;
  title: string;
}) {
  return (
    <h2 id={id} className="font-display mb-3 flex items-center gap-2 text-2xl text-ink">
      <Icon className="h-5 w-5 text-wine" />
      {title}
    </h2>
  );
}

export default function PoliciesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display mb-4 text-4xl text-ink">Policies</h1>

      <section id="shipping" className="mb-10">
        <SectionHeading id="shipping-h" icon={TruckIcon} title="Shipping" />
        <p className="text-sm leading-relaxed text-ink/80">
          Orders are packed within 1–2 business days and shipped across India. Delivery
          typically takes 4–6 business days depending on location. A shipping fee is
          shown at checkout before payment.
        </p>
      </section>

      <section id="returns" className="mb-10">
        <SectionHeading id="returns-h" icon={ReturnIcon} title="Returns" />
        <p className="text-sm leading-relaxed text-ink/80">
          Every candle is poured to order in small batches, so we don&apos;t accept
          returns or offer refunds for a change of mind. If your order arrives damaged,
          defective, or not what you ordered, contact us within 48 hours of delivery with
          photos and we&apos;ll make it right.
        </p>
      </section>

      <section id="privacy" className="mb-10">
        <SectionHeading id="privacy-h" icon={ShieldIcon} title="Privacy" />
        <p className="text-sm leading-relaxed text-ink/80">
          We collect only what&apos;s needed to fulfil an order — name, address, email,
          and phone number. We don&apos;t sell customer data. Order details are stored
          securely and used solely for shipping, support, and order tracking.
        </p>
      </section>

      <section id="terms">
        <SectionHeading id="terms-h" icon={DocumentIcon} title="Terms" />
        <p className="text-sm leading-relaxed text-ink/80">
          By placing an order with Bougsk, you agree to pay the listed price at checkout,
          including shipping and applicable GST. Product photography aims to represent
          each candle accurately; small variations are part of being hand-poured.
        </p>

        <div className="mt-6 rounded-md bg-sand p-5 text-sm text-ink/80">
          <p className="mb-2 text-xs uppercase tracking-[0.08em] text-ink/50">
            Seller identity (GST disclosure)
          </p>
          <p>
            {businessInfo.brandName} is a brand of <strong>{businessInfo.tradeName}</strong>{" "}
            ({businessInfo.constitution}), registered proprietor {businessInfo.legalName}.
          </p>
          <p className="mt-1">GSTIN: {businessInfo.gstin}</p>
          <p className="mt-1">Registered address: {formatRegisteredAddress()}</p>
        </div>
      </section>
    </div>
  );
}
