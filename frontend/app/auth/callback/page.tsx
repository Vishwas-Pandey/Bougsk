"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

// Google redirects here after Supabase's own OAuth callback. The
// Supabase client auto-detects the session from the URL on load
// (detectSessionInUrl, the default) — this page just waits for that to
// land in useAuth() and then forwards on to wherever sign-in was for.
function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const next = searchParams.get("next") || "/account";

  useEffect(() => {
    if (!loading) {
      router.replace(user ? next : "/login");
    }
  }, [loading, user, next, router]);

  return (
    <div className="mx-auto max-w-sm px-4 py-24 text-center sm:px-6">
      <p className="text-sm text-ink/60">Signing you in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackInner />
    </Suspense>
  );
}
