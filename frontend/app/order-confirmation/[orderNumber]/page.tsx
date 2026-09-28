import Link from "next/link";
import { getOrderByNumberAction } from "@/lib/serverOrders";
import { formatCurrency } from "@/lib/formatCurrency";
import { ButtonLink } from "@/components/Button";
import { FlameGlyph } from "@/components/FlameGlyph";
import { siteSettings } from "@/lib/mockData";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await getOrderByNumberAction(orderNumber);

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <p className="font-display text-2xl text-ink">We can&apos;t find that order.</p>
        <p className="mt-2 text-sm text-ink/70">
          Double check the order number, or track it from{" "}
          <Link href="/track-order" className="text-wine hover:underline">
            here
          </Link>
          .
        </p>
      </div>
    );
  }

  const whatsappMessage = `Hi Bougsk, I have a question about order ${order.order_number}.`;
  const whatsappHref = `https://wa.me/${siteSettings.whatsapp_number}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <FlameGlyph className="mx-auto mb-4 h-8 w-8" />
        <p className="font-display text-3xl text-ink">Thank you.</p>
        <p className="mt-2 text-sm text-ink/70">
          Order <span className="font-medium text-ink">{order.order_number}</span> is
          confirmed.
        </p>
      </div>

      <div className="mt-10 rounded-md bg-sand p-6">
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between py-1.5 text-sm text-ink/80">
            <span>
              {item.product_name}
              {item.variant_name ? ` — ${item.variant_name}` : ""} × {item.quantity}
            </span>
            <span>{formatCurrency(item.line_total_inr)}</span>
          </div>
        ))}
        <div className="mt-2 space-y-1 border-t border-ink/10 pt-2 text-sm text-ink/70">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal_inr)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST ({order.tax_rate_percent}%)</span>
            <span>{formatCurrency(order.tax_amount_inr)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{order.shipping_fee_inr === 0 ? "Free" : formatCurrency(order.shipping_fee_inr)}</span>
          </div>
        </div>
        <div className="mt-2 flex justify-between border-t border-ink/10 pt-2 text-base font-medium text-ink">
          <span>Total paid</span>
          <span>{formatCurrency(order.total_inr)}</span>
        </div>
      </div>

      {order.is_gift && (
        <div className="mt-4 rounded-md border border-gold/50 bg-sand/60 p-4 text-sm text-ink/80">
          <p className="text-xs uppercase tracking-[0.08em] text-ink/50">Gift details</p>
          <p className="mt-1">For {order.recipient_name}{order.gift_wrap_requested ? " · gift-wrapped" : ""}</p>
          {order.gift_message && <p className="mt-1 italic">&ldquo;{order.gift_message}&rdquo;</p>}
        </div>
      )}

      {order.gst_invoice_number && (
        <p className="mt-4 text-center text-xs text-ink/50">
          GST invoice {order.gst_invoice_number}
        </p>
      )}

      <p className="mt-6 text-center text-sm text-ink/70">
        Expected delivery in {siteSettings.delivery_estimate_days}, to {order.shipping_address.city}.
      </p>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <ButtonLink href="/shop" variant="secondary">
          Continue shopping
        </ButtonLink>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-wine hover:underline"
        >
          Questions about this order? Message us on WhatsApp
        </a>
      </div>
    </div>
  );
}
