"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Field, Input } from "@/components/FormControls";
import { Logo } from "@/components/Logo";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await supabaseAdminClient.auth.sendPasswordResetEmail(email);
    setSubmitting(false);
    // Always show the same "check your email" state, whether or not the
    // address is actually on the admin allow-list — see the comment on
    // sendPasswordResetEmail.
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Logo className="h-24" />
        </div>

        {sent ? (
          <div className="bg-white border border-sand rounded-card p-8 text-center">
            <p className="text-body text-ink">
              If that email is an admin account, a reset link is on its way.
            </p>
            <Link href="/login" className="text-body text-wine hover:underline mt-4 inline-block">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-sand rounded-card p-8 flex flex-col gap-5"
          >
            <Field label="Email">
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@bougsk.co"
              />
            </Field>
            <Button type="submit" disabled={submitting} className="w-full mt-2">
              {submitting ? "Sending…" : "Send reset link"}
            </Button>
            <Link href="/login" className="text-body text-wine hover:underline text-center">
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
