import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Public, read-only client — anon key only. RLS (backend/migrations/0002_rls_policies.sql)
// is what actually restricts this to is_active rows; never ship the service role key here.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// No project connected yet — pages fall back to lib/mockData.ts until these are set.
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseConfigured = supabase !== null;
