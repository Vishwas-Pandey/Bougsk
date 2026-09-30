// Super-admin-only admin account management — calls the manage-admins
// Edge Function, which re-checks is_super_admin() itself server-side
// (this client-side gating is only for the UI, never the real gate).

import { supabase } from "./supabaseAdminClient";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export interface AdminRow {
  id: string;
  email: string;
  is_super_admin: boolean;
  created_at: string;
}

async function callManageAdmins<T>(body: Record<string, unknown>): Promise<T> {
  if (!supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Admin management isn't available in local dev mode yet.");
  }
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error("Your session has expired. Please sign in again.");

  const res = await fetch(`${SUPABASE_URL}/functions/v1/manage-admins`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed.");
  return data as T;
}

export async function listAdmins(): Promise<AdminRow[]> {
  const result = await callManageAdmins<{ admins: AdminRow[] }>({ action: "list" });
  return result.admins;
}

export async function createAdmin(email: string, password: string): Promise<void> {
  await callManageAdmins({ action: "create", email, password });
}

export async function deleteAdmin(adminId: string): Promise<void> {
  await callManageAdmins({ action: "delete", admin_id: adminId });
}
