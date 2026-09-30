"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/lib/toast-context";
import { formatCurrency } from "@/lib/formatCurrency";
import { Button, ButtonLink } from "@/components/Button";
import { Field, Input, Textarea } from "@/components/FormField";
import { LockIcon } from "@/components/icons";
import { createOrderAction } from "@/lib/serverOrders";
import { siteSettings } from "@/lib/mockData";
import { isValidEmail, isValidPhone, isValidPincode } from "@/lib/validation";
import { track } from "@/lib/analytics";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { createRealOrder, verifyRealPayment } from "@/lib/realCheckout";
import { openRazorpayCheckout, RazorpayDismissedError } from "@/lib/razorpayCheckout";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

const INDIAN_STATES = [
  "Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Karnataka", "Kerala",
  "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana",
  "Uttar Pradesh", "West Bengal",
];

type Address = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
};

const emptyAddress: Address = { line1: "", line2: "", city: "", state: INDIAN_STATES[0], pincode: "" };

export default function CheckoutPage() {
  const { lines, subtotalInr, clearCart } = useCart();
  const { showToast } = useToast();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [shipping, setShipping] = useState<Address>(emptyAddress);

  const [isGift, setIsGift] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [giftWrap, setGiftWrap] = useState(false);
  const [billingDiffers, setBillingDiffers] = useState(false);
  const [billing, setBilling] = useState<Address>(emptyAddress);
  const [buyerGstin, setBuyerGstin] = useState("");

  useEffect(() => {
    if (lines.length > 0) track("checkout_started", { item_count: lines.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Browsing and the cart stay open to anyone — signing in is only
  // required here, at checkout (create-order enforces this server-side
  // too, see backend/functions/create-order/index.ts).
  useEffect(() => {
    if (isSupabaseConfigured && !authLoading && !user) {
      router.replace("/login?redirect=/checkout");
    }
  }, [authLoading, user, router]);

  const shippingFeeInr =
    subtotalInr >= siteSettings.free_shipping_threshold_inr ? 0 : siteSettings.shipping_fee_inr;
  const taxableAmountInr = subtotalInr;
  const taxAmountInr = Math.round((taxableAmountInr * siteSettings.tax_rate_percent) / 100);
  const total = taxableAmountInr + taxAmountInr + shippingFeeInr;

  if (isSupabaseConfigured && (authLoading || !user)) {
    return <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6" />;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <p className="font-display text-2xl text-ink">There&apos;s nothing to check out yet.</p>
        <ButtonLink href="/shop" className="mt-8 inline-flex">
          Shop the collection
        </ButtonLink>
      </div>
    );
  }

  // Pre-fills from the signed-in account until the customer types their
  // own — see the Email field's value below, which uses this same fallback.
  const effectiveEmail = email || user?.email || "";

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Enter your full name.";
    if (!isValidEmail(effectiveEmail)) next.email = "Enter a valid email address.";
    if (!isValidPhone(phone)) next.phone = "Enter a 10-digit Indian mobile number.";
    if (!shipping.line1.trim()) next.line1 = "Enter your address.";
    if (!shipping.city.trim()) next.city = "Enter your city.";
    if (!isValidPincode(shipping.pincode)) next.pincode = "Enter a valid 6-digit pincode.";
    if (isGift && !recipientName.trim()) next.recipientName = "Enter the recipient's name.";
    if (billingDiffers) {
      if (!billing.line1.trim()) next.billingLine1 = "Enter the billing address.";
      if (!billing.city.trim()) next.billingCity = "Enter the billing city.";
      if (!isValidPincode(billing.pincode)) next.billingPincode = "Enter a valid 6-digit pincode.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      showToast("error", "Please fix the highlighted fields.");
      return;
    }
    setSubmitting(true);
    track("payment_initiated", { subtotal_inr: subtotalInr });

    const shippingAddress = { line1: shipping.line1, line2: shipping.line2 || undefined, city: shipping.city, state: shipping.state, pincode: shipping.pincode };
    const billingAddress = billingDiffers
      ? { line1: billing.line1, line2: billing.line2 || undefined, city: billing.city, state: billing.state, pincode: billing.pincode }
      : undefined;

    if (isSupabaseConfigured) {
      // Real flow: create-order re-prices from the live `products` table,
      // atomically decrements stock, and opens a Razorpay order; Razorpay
      // Checkout then collects payment against that order id; verify-payment
      // recomputes the signature server-side before marking the order paid.
      try {
        const created = await createRealOrder({
          lines,
          customerName: name,
          customerEmail: effectiveEmail,
          customerPhone: phone,
          shippingAddress,
          billingAddress,
          isGift,
          giftMessage,
          recipientName,
          giftWrapRequested: giftWrap,
          buyerGstin,
        });

        const paymentResponse = await openRazorpayCheckout({
          keyId: created.razorpay_key_id,
          razorpayOrderId: created.razorpay_order_id,
          customerName: name,
          customerEmail: effectiveEmail,
          customerPhone: phone,
        });

        const verified = await verifyRealPayment(paymentResponse);

        // The confirmation page can't re-fetch this order itself — orders
        // are admin-only by RLS (see backend/migrations/0002_rls_policies.sql),
        // and the only public order lookup (track-order) deliberately
        // returns just status/tracking, never the receipt. The browser
        // that just placed and paid for this order already legitimately
        // knows everything below, so it's handed forward via sessionStorage
        // instead of re-fetched.
        const receipt = {
          order_number: created.order_number,
          items: lines.map((l) => ({
            product_name: l.product.name,
            variant_name: l.variant?.name,
            quantity: l.quantity,
            line_total_inr: (l.variant?.price_inr ?? l.product.price_inr) * l.quantity,
          })),
          subtotal_inr: subtotalInr,
          tax_rate_percent: siteSettings.tax_rate_percent,
          tax_amount_inr: taxAmountInr,
          shipping_fee_inr: shippingFeeInr,
          total_inr: created.total_inr,
          gst_invoice_number: verified.gst_invoice_number,
          is_gift: isGift,
          recipient_name: recipientName || undefined,
          gift_message: giftMessage || undefined,
          gift_wrap_requested: giftWrap,
          shipping_city: shipping.city,
        };
        sessionStorage.setItem(`bougsk-order-confirmation:${created.order_number}`, JSON.stringify(receipt));

        track("payment_successful", { order_number: created.order_number, total_inr: created.total_inr });
        clearCart();
        router.push(`/order-confirmation/${created.order_number}`);
      } catch (err) {
        setSubmitting(false);
        if (err instanceof RazorpayDismissedError) {
          showToast("error", "Payment was not completed. Your cart is still here whenever you're ready.");
        } else {
          showToast("error", err instanceof Error ? err.message : "Something went wrong placing your order.");
        }
      }
      return;
    }

    // Local dev fallback — no Supabase project connected, so this calls a
    // Server Action that re-prices against a shared local JSON file instead
    // of a real database — see lib/serverOrders.ts.
    const order = await createOrderAction({
      lines,
      customerName: name,
      customerEmail: effectiveEmail,
      customerPhone: phone,
      shippingAddress,
      billingAddress,
      isGift,
      giftMessage,
      recipientName,
      giftWrapRequested: giftWrap,
      buyerGstin,
    });

    track("payment_successful", { order_number: order.order_number, total_inr: order.total_inr });
    clearCart();
    router.push(`/order-confirmation/${order.order_number}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display mb-8 text-4xl text-ink">Checkout</h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-10">
        <section>
          <h2 className="font-display mb-4 text-xl text-ink">Shipping address</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="name" error={errors.name} className="sm:col-span-2">
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
            </Field>
            <Field label="Email" htmlFor="email" error={errors.email}>
              <Input id="email" type="email" value={effectiveEmail} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
            </Field>
            <Field label="Phone" htmlFor="phone" error={errors.phone}>
              <Input id="phone" type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} />
            </Field>
            <Field label="Address line 1" htmlFor="line1" error={errors.line1} className="sm:col-span-2">
              <Input id="line1" value={shipping.line1} onChange={(e) => setShipping((s) => ({ ...s, line1: e.target.value }))} error={errors.line1} />
            </Field>
            <Field label="Address line 2 (optional)" htmlFor="line2" className="sm:col-span-2">
              <Input id="line2" value={shipping.line2} onChange={(e) => setShipping((s) => ({ ...s, line2: e.target.value }))} />
            </Field>
            <Field label="City" htmlFor="city" error={errors.city}>
              <Input id="city" value={shipping.city} onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))} error={errors.city} />
            </Field>
            <Field label="State" htmlFor="state">
              <select
                id="state"
                value={shipping.state}
                onChange={(e) => setShipping((s) => ({ ...s, state: e.target.value }))}
                className="w-full rounded-md border border-transparent bg-sand px-4 py-2.5 text-sm outline-none focus:border-gold-deep focus:ring-2 focus:ring-gold-deep/20"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Pincode" htmlFor="pincode" error={errors.pincode}>
              <Input id="pincode" inputMode="numeric" maxLength={6} value={shipping.pincode} onChange={(e) => setShipping((s) => ({ ...s, pincode: e.target.value }))} error={errors.pincode} />
            </Field>
            <Field label="GSTIN (optional)" htmlFor="gstin" hint="For a business input-tax-credit invoice.">
              <Input id="gstin" value={buyerGstin} onChange={(e) => setBuyerGstin(e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="rounded-md bg-sand p-5">
          <label className="flex items-center gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={isGift}
              onChange={(e) => setIsGift(e.target.checked)}
              className="h-5 w-5 rounded border-ink/20 accent-wine"
            />
            This is a gift
          </label>

          {isGift && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Recipient's name" htmlFor="recipientName" error={errors.recipientName} className="sm:col-span-2">
                <Input id="recipientName" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} error={errors.recipientName} />
              </Field>
              <Field label="Gift message (optional)" htmlFor="giftMessage" className="sm:col-span-2">
                <Textarea id="giftMessage" rows={3} value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} />
              </Field>
              <label className="flex items-center gap-3 text-sm text-ink sm:col-span-2">
                <input
                  type="checkbox"
                  checked={giftWrap}
                  onChange={(e) => setGiftWrap(e.target.checked)}
                  className="h-5 w-5 rounded border-ink/20 accent-wine"
                />
                Gift-wrap in signature kraft box (free)
              </label>
            </div>
          )}
        </section>

        <section>
          <label className="flex items-center gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={billingDiffers}
              onChange={(e) => setBillingDiffers(e.target.checked)}
              className="h-5 w-5 rounded border-ink/20 accent-wine"
            />
            Billing address is different
          </label>

          {billingDiffers && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Address line 1" htmlFor="billingLine1" error={errors.billingLine1} className="sm:col-span-2">
                <Input id="billingLine1" value={billing.line1} onChange={(e) => setBilling((s) => ({ ...s, line1: e.target.value }))} error={errors.billingLine1} />
              </Field>
              <Field label="City" htmlFor="billingCity" error={errors.billingCity}>
                <Input id="billingCity" value={billing.city} onChange={(e) => setBilling((s) => ({ ...s, city: e.target.value }))} error={errors.billingCity} />
              </Field>
              <Field label="Pincode" htmlFor="billingPincode" error={errors.billingPincode}>
                <Input id="billingPincode" inputMode="numeric" maxLength={6} value={billing.pincode} onChange={(e) => setBilling((s) => ({ ...s, pincode: e.target.value }))} error={errors.billingPincode} />
              </Field>
            </div>
          )}
        </section>

        <section className="rounded-md bg-sand p-5">
          <button
            type="button"
            onClick={() => setSummaryOpen((v) => !v)}
            className="flex w-full items-center justify-between text-left sm:pointer-events-none"
          >
            <h2 className="font-display text-xl text-ink">Order summary</h2>
            <span className="text-sm text-ink/60 sm:hidden">
              {summaryOpen ? "Hide" : "Show"}
            </span>
          </button>

          <div className={`${summaryOpen ? "block" : "hidden"} mt-4 space-y-2 sm:block`}>
            {lines.map((l) => (
              <div
                key={`${l.product.id}-${l.variant?.id ?? "base"}`}
                className="flex justify-between text-sm text-ink/80"
              >
                <span>
                  {l.product.name}
                  {l.variant ? ` — ${l.variant.name}` : ""} × {l.quantity}
                </span>
                <span>
                  {formatCurrency((l.variant?.price_inr ?? l.product.price_inr) * l.quantity)}
                </span>
              </div>
            ))}
            <div className="flex justify-between border-t border-ink/10 pt-2 text-sm text-ink/70">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotalInr)}</span>
            </div>
            <div className="flex justify-between text-sm text-ink/70">
              <span>GST ({siteSettings.tax_rate_percent}%)</span>
              <span>{formatCurrency(taxAmountInr)}</span>
            </div>
            <div className="flex justify-between text-sm text-ink/70">
              <span>Shipping</span>
              <span>{shippingFeeInr === 0 ? "Free" : formatCurrency(shippingFeeInr)}</span>
            </div>
            <div className="flex justify-between text-base font-medium text-ink">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </section>

        <div>
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/60">
            <span className="flex items-center gap-1.5">
              <LockIcon className="h-4 w-4" />
              Secure payment via Razorpay
            </span>
            <span>UPI · Cards · Netbanking</span>
            <Link href="/policies#returns" className="text-wine hover:underline">
              Returns &amp; refund policy
            </Link>
          </div>
          {!isSupabaseConfigured && (
            <p className="mb-3 text-xs text-ink/50">
              Test checkout — no payment gateway is connected yet, so no real payment is processed.
            </p>
          )}
          <Button
            type="submit"
            className="w-full"
            loading={submitting}
            loadingText="Placing order…"
          >
            {`Pay ${formatCurrency(total)}`}
          </Button>
        </div>
      </form>
    </div>
  );
}
