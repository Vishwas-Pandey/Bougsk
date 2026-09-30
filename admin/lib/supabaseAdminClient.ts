import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// No project connected yet — falls back to the mock in-memory session below.
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;
export const isSupabaseConfigured = supabase !== null;

export interface AdminSession {
  email: string;
}

export interface SignInResult {
  session: AdminSession | null;
  error: string | null;
}

async function signInWithPassword(email: string, password: string): Promise<SignInResult> {
  if (!email || !password) {
    return { session: null, error: "Enter your email and password." };
  }

  if (!supabase) {
    // Local dev fallback — no Supabase project connected, any non-empty
    // email/password signs in.
    return { session: { email }, error: null };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { session: null, error: "Incorrect email or password." };
  }

  // Supabase Auth alone doesn't scope who may reach this panel — the
  // `admins` allow-list table (backend/migrations/0001_init_schema.sql) is
  // the actual gate. A valid Auth login that isn't on the allow-list must
  // still be refused, and refused with the same message as a wrong
  // password so the allow-list's membership is never revealed.
  const { data: adminRow, error: adminError } = await supabase
    .from("admins")
    .select("email")
    .eq("id", data.user.id)
    .maybeSingle();

  if (adminError || !adminRow) {
    await supabase.auth.signOut();
    return { session: null, error: "Incorrect email or password." };
  }

  return { session: { email: adminRow.email }, error: null };
}

async function signOut(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
}

async function getSession(): Promise<AdminSession | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session ? { email: data.session.user.email ?? "" } : null;
}

export interface CurrentAdmin {
  id: string;
  email: string;
  is_super_admin: boolean;
}

// The logged-in admin's own row — used to decide whether to show the
// "manage admins" section (super-admin only) and to label the account
// settings section with their email.
async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  if (!supabase) return null;
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("admins")
    .select("id, email, is_super_admin")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

// Self-service only — Supabase's updateUser call always acts on the
// currently authenticated session, so this can never change anyone
// else's password.
async function updateOwnPassword(newPassword: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Accounts aren't available in local dev mode yet." };
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: error?.message ?? null };
}

async function sendPasswordResetEmail(email: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Accounts aren't available in local dev mode yet." };
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  // Same message whether the email exists or not — never confirm/deny
  // which emails are on the admin allow-list.
  return { error: error ? "Could not send the reset email. Try again shortly." : null };
}

export const supabaseAdminClient = {
  auth: {
    signInWithPassword,
    signOut,
    getSession,
    getCurrentAdmin,
    updateOwnPassword,
    sendPasswordResetEmail,
  },
};
