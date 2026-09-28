"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/Button";
import { Field, Input, Textarea } from "@/components/FormControls";
import { useStore } from "@/lib/store";

export default function SettingsPage() {
  const { getSetting, updateSetting } = useStore();

  const [whatsapp, setWhatsapp] = useState(
    String(getSetting("whatsapp_number") ?? "")
  );
  const [shippingFee, setShippingFee] = useState(
    String(getSetting("shipping_fee_inr") ?? "")
  );
  const [bannerText, setBannerText] = useState(
    String(getSetting("banner_text") ?? "")
  );
  const [instagramUrl, setInstagramUrl] = useState(
    String(getSetting("instagram_url") ?? "")
  );
  const [taxRatePercent, setTaxRatePercent] = useState(
    String(getSetting("tax_rate_percent") ?? "0")
  );
  const [defaultCareInstructions, setDefaultCareInstructions] = useState(
    String(getSetting("default_care_instructions") ?? "")
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    String(getSetting("low_stock_threshold") ?? "")
  );
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateSetting("whatsapp_number", whatsapp);
    updateSetting("shipping_fee_inr", Number(shippingFee) || 0);
    updateSetting("banner_text", bannerText);
    updateSetting("instagram_url", instagramUrl);
    updateSetting("tax_rate_percent", Number(taxRatePercent) || 0);
    updateSetting("default_care_instructions", defaultCareInstructions);
    updateSetting("low_stock_threshold", Number(lowStockThreshold) || 0);
    setSaved(true);
  }

  return (
    <div>
      <h1 className="font-display text-h1 text-ink mb-8">Settings</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-sand rounded-card p-6 max-w-xl flex flex-col gap-5"
      >
        <Field label="WhatsApp number" hint="Shown on the storefront contact button">
          <Input
            value={whatsapp}
            onChange={(e) => {
              setWhatsapp(e.target.value);
              setSaved(false);
            }}
            placeholder="+91 98765 43210"
          />
        </Field>
        <Field label="Shipping fee (₹)">
          <Input
            type="number"
            min={0}
            value={shippingFee}
            onChange={(e) => {
              setShippingFee(e.target.value);
              setSaved(false);
            }}
          />
        </Field>
        <Field label="Banner text" hint="The strip shown at the top of the storefront">
          <Textarea
            value={bannerText}
            onChange={(e) => {
              setBannerText(e.target.value);
              setSaved(false);
            }}
            rows={2}
          />
        </Field>
        <Field label="Instagram URL">
          <Input
            value={instagramUrl}
            onChange={(e) => {
              setInstagramUrl(e.target.value);
              setSaved(false);
            }}
            placeholder="https://instagram.com/bougsk.candles"
          />
        </Field>
        <Field
          label="GST rate (%)"
          hint="Set to 0 if not GST-registered yet — switching this on later is just a settings change."
        >
          <Input
            type="number"
            min={0}
            step="0.01"
            value={taxRatePercent}
            onChange={(e) => {
              setTaxRatePercent(e.target.value);
              setSaved(false);
            }}
          />
        </Field>
        <Field
          label="Default care instructions"
          hint="Shown on every candle unless its own product page overrides it"
        >
          <Textarea
            value={defaultCareInstructions}
            onChange={(e) => {
              setDefaultCareInstructions(e.target.value);
              setSaved(false);
            }}
            rows={6}
          />
        </Field>
        <Field
          label="Low-stock threshold"
          hint="Per-product overrides live on each product's edit page"
        >
          <Input
            type="number"
            min={0}
            value={lowStockThreshold}
            onChange={(e) => {
              setLowStockThreshold(e.target.value);
              setSaved(false);
            }}
          />
        </Field>
        <div className="flex items-center gap-3">
          <Button type="submit">Save settings</Button>
          {saved && <span className="text-body text-sage">Saved.</span>}
        </div>
      </form>
    </div>
  );
}
