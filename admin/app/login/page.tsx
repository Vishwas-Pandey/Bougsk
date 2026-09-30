"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Field, Input } from "@/components/FormControls";
import { Logo } from "@/components/Logo";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    // supabaseAdminClient.auth.signInWithPassword is a stub today — see
    // lib/supabaseAdminClient.ts for where the real Supabase Auth call and
    // the admins allow-list check will go.
    const { session, error: signInError } =
      await supabaseAdminClient.auth.signInWithPassword(email, password);
    setSubmitting(false);
    if (!session) {
      setError(signInError ?? "We could not sign you in.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Logo className="h-24" />
          <p className="text-body text-ink/60 mt-2">
            Sign in to manage the storefront.
          </p>
        </div>
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
          <Field label="Password">
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          {error && <p className="text-body text-error">{error}</p>}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full mt-2"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="text-center mt-6">
          <Link href="/forgot-password" className="text-body text-wine hover:underline">
            Forgot password?
          </Link>
        </p>
      </div>
    </div>
  );
}
