"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Field, Input } from "@/components/FormField";
import { GoogleIcon } from "@/components/icons";
import { useAuth } from "@/lib/auth-context";
import { isValidEmail } from "@/lib/validation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/account";
  const { signInWithPassword, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email) || !password) {
      setError("Enter a valid email and your password.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await signInWithPassword(email, password);
    setSubmitting(false);
    if (signInError) {
      setError(signInError);
      return;
    }
    router.push(redirectPath);
  }

  async function handleGoogle() {
    setGoogleSubmitting(true);
    setError(null);
    const { error: googleError } = await signInWithGoogle(redirectPath);
    if (googleError) {
      setGoogleSubmitting(false);
      setError(googleError);
    }
    // On success the browser navigates away to Google, so no further
    // local state change happens here.
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:px-6">
      <h1 className="font-display mb-2 text-3xl text-ink">Sign in</h1>
      <p className="mb-8 text-sm text-ink/60">
        Sign in to check out and see your orders.
      </p>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleSubmitting}
        className="mb-6 flex w-full items-center justify-center gap-3 rounded-full border border-sand bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors duration-300 hover:bg-sand disabled:opacity-60"
      >
        <GoogleIcon className="h-4 w-4" />
        {googleSubmitting ? "Redirecting…" : "Continue with Google"}
      </button>

      <div className="mb-6 flex items-center gap-3 text-xs uppercase tracking-[0.08em] text-ink/40">
        <span className="h-px flex-1 bg-sand" />
        or
        <span className="h-px flex-1 bg-sand" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && <p className="text-sm text-error">{error}</p>}
        <Button type="submit" className="w-full" loading={submitting} loadingText="Signing in…">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        New here?{" "}
        <Link href={`/signup?redirect=${encodeURIComponent(redirectPath)}`} className="text-wine hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
