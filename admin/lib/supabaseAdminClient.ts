// Stub so wiring up the real project later is a one-file change: install
// @supabase/supabase-js, construct the client here with
// NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY, and replace the
// bodies below with real calls. Nothing outside this file should import
// @supabase/supabase-js directly.

export interface AdminSession {
  email: string;
}

export interface SignInResult {
  session: AdminSession | null;
  error: string | null;
}

async function signInWithPassword(
  email: string,
  password: string
): Promise<SignInResult> {
  // Real call goes here: supabase.auth.signInWithPassword({ email, password }),
  // then check the signed-in user against the `admins` allow-list table
  // before granting a session — Supabase Auth alone doesn't scope who
  // may reach this panel.
  if (!email || !password) {
    return { session: null, error: "Enter your email and password." };
  }
  return { session: { email }, error: null };
}

async function signOut(): Promise<void> {
  // Real call goes here: supabase.auth.signOut()
}

export const supabaseAdminClient = {
  auth: {
    signInWithPassword,
    signOut,
  },
};
