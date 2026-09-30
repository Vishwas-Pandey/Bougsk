"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Field, Input } from "@/components/FormField";
import { GoogleIcon } from "@/components/icons";
import { useAuth } from "@/lib/auth-context";
import { isValidEmail } from "@/lib/validation";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/account";
  const { signUpWithPassword, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: signUpError, needsEmailConfirmation } = await signUpWithPassword(email, password);
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError);
      return;
    }
    if (needsEmailConfirmation) {
      setCheckEmail(true);
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
  }

  if (checkEmail) {
    return (
      <div className="mx-auto max-w-sm px-4 py-24 text-center sm:px-6">
        <p className="font-display text-2xl text-ink">Check your email.</p>
        <p className="mt-2 text-sm text-ink/70">
          We&apos;ve sent a confirmation link to <span className="font-medium text-ink">{email}</span>.
          Confirm it, then sign in.
        </p>
        <Link href={`/login?redirect=${encodeURIComponent(redirectPath)}`} className="mt-6 inline-block text-sm text-wine hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:px-6">
      <h1 className="font-display mb-2 text-3xl text-ink">Create an account</h1>
      <p className="mb-8 text-sm text-ink/60">
        You can browse and add to cart without one — an account is only needed at checkout.
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
        <Field label="Password" htmlFor="password" hint="At least 8 characters.">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Confirm password" htmlFor="confirmPassword">
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Field>
        {error && <p className="text-sm text-error">{error}</p>}
        <Button type="submit" className="w-full" loading={submitting} loadingText="Creating account…">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        Already have an account?{" "}
        <Link href={`/login?redirect=${encodeURIComponent(redirectPath)}`} className="text-wine hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
