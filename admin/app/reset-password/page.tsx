"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Field, Input } from "@/components/FormControls";
import { Logo } from "@/components/Logo";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";

// Reached from the link in the reset email — Supabase's client
// automatically picks up the recovery session from the URL on load
// (detectSessionInUrl, the default), so by the time this form submits
// there's already an authenticated session to update.
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    const { error: updateError } = await supabaseAdminClient.auth.updateOwnPassword(password);
    setSubmitting(false);
    if (updateError) {
      setError("That reset link may have expired. Request a new one from the sign-in page.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Logo className="h-24" />
        </div>

        {done ? (
          <div className="bg-white border border-sand rounded-card p-8 text-center">
            <p className="text-body text-ink">Password updated.</p>
            <Button className="mt-4" onClick={() => router.push("/login")}>
              Sign in
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-sand rounded-card p-8 flex flex-col gap-5"
          >
            <Field label="New password" hint="At least 8 characters.">
              <Input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field label="Confirm new password">
              <Input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Field>
            {error && <p className="text-body text-error">{error}</p>}
            <Button type="submit" disabled={submitting} className="w-full mt-2">
              {submitting ? "Saving…" : "Set new password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
