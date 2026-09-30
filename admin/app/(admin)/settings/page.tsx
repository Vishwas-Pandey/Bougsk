"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/Button";
import { Field, Input, Textarea } from "@/components/FormControls";
import { useStore } from "@/lib/store";
import { supabaseAdminClient, type CurrentAdmin } from "@/lib/supabaseAdminClient";
import { listAdmins, createAdmin, deleteAdmin, type AdminRow } from "@/lib/adminAccounts";

function AccountSection() {
  const [admin, setAdmin] = useState<CurrentAdmin | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabaseAdminClient.auth.getCurrentAdmin().then(setAdmin);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (newPassword.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    const { error: updateError } = await supabaseAdminClient.auth.updateOwnPassword(newPassword);
    setSubmitting(false);
    if (updateError) {
      setError(updateError);
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    setSaved(true);
  }

  return (
    <div className="bg-white border border-sand rounded-card p-6 max-w-xl flex flex-col gap-5 mt-8">
      <div>
        <h2 className="font-display text-h3 text-ink">Your account</h2>
        {admin && <p className="text-body text-ink/60 mt-1">{admin.email}</p>}
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="New password" hint="At least 8 characters. This only ever changes your own password.">
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setSaved(false);
            }}
          />
        </Field>
        <Field label="Confirm new password">
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setSaved(false);
            }}
          />
        </Field>
        {error && <p className="text-body text-error">{error}</p>}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Change password"}
          </Button>
          {saved && <span className="text-body text-sage">Saved.</span>}
        </div>
      </form>
    </div>
  );
}

function AdminsSection() {
  const [admins, setAdmins] = useState<AdminRow[] | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function refresh() {
    listAdmins()
      .then(setAdmins)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load admins."));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await createAdmin(email.trim().toLowerCase(), password);
      setEmail("");
      setPassword("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add admin.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id: string) {
    if (!confirm("Remove this admin's access to the panel?")) return;
    try {
      await deleteAdmin(id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove admin.");
    }
  }

  return (
    <div className="bg-white border border-sand rounded-card p-6 max-w-xl flex flex-col gap-5 mt-8">
      <h2 className="font-display text-h3 text-ink">Admins</h2>
      <p className="text-body text-ink/60 -mt-3">
        Only your account can add or remove other admins. Every admin can change only their own password, from
        their own &ldquo;Your account&rdquo; section above.
      </p>

      {admins === null ? (
        <p className="text-body text-ink/50">Loading…</p>
      ) : (
        <div className="flex flex-col gap-2">
          {admins.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-md bg-sand px-4 py-2.5">
              <div className="text-body text-ink">
                {a.email}
                {a.is_super_admin && (
                  <span className="ml-2 text-xs uppercase tracking-[0.08em] text-ink/50">Super-admin</span>
                )}
              </div>
              {!a.is_super_admin && (
                <button
                  type="button"
                  onClick={() => handleRemove(a.id)}
                  className="text-body text-error hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex flex-col gap-5 border-t border-sand pt-5">
        <Field label="New admin's email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="New admin's password" hint="At least 8 characters. Share it with them separately.">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <p className="text-body text-error">{error}</p>}
        <div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Adding…" : "Add admin"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function SettingsPage() {
  const { getSetting, updateSetting } = useStore();
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdmin | null>(null);

  useEffect(() => {
    supabaseAdminClient.auth.getCurrentAdmin().then(setCurrentAdmin);
  }, []);

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

      <AccountSection />
      {currentAdmin?.is_super_admin && <AdminsSection />}
    </div>
  );
}
