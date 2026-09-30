// manage-admins: super-admin-only. Lists, adds, and removes admin panel
// accounts. "Add" creates a real Supabase Auth user (needs the service
// role key, so this can't be a plain RLS-gated table write) and adds
// them to the `admins` allow-list. "Remove" only removes the allow-list
// row — the underlying auth.users account is left alone, so this is a
// revoke of admin-panel access, not an irreversible account deletion.
//
// Authorization model: same pattern as refund-order/update-order-status —
// the caller's own JWT is checked via is_super_admin() (migration 0011)
// before anything happens. A super-admin's own row can never be removed
// through this function, so nobody can lock the panel's only
// admin-manager out by mistake.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ALLOWED_ORIGIN = Deno.env.get("ADMIN_ORIGIN");
if (!ALLOWED_ORIGIN) {
  console.error("manage-admins: ADMIN_ORIGIN is not set — refusing to advertise any CORS origin");
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
if (ALLOWED_ORIGIN) corsHeaders["Access-Control-Allow-Origin"] = ALLOWED_ORIGIN;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

interface ManageAdminsPayload {
  action: "list" | "create" | "delete";
  email?: string;
  password?: string;
  admin_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Missing Authorization header" }, 401);
  }

  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData?.user) {
    return jsonResponse({ error: "Invalid or expired session" }, 401);
  }

  const { data: isSuperAdmin, error: superAdminError } = await callerClient.rpc("is_super_admin");
  if (superAdminError || !isSuperAdmin) {
    return jsonResponse({ error: "Only the super-admin can manage admin accounts" }, 403);
  }

  let payload: ManageAdminsPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  if (payload.action === "list") {
    const { data, error } = await supabase
      .from("admins")
      .select("id, email, is_super_admin, created_at")
      .order("created_at", { ascending: true });
    if (error) {
      console.error("manage-admins: list failed", error.message);
      return jsonResponse({ error: "Failed to load admins" }, 500);
    }
    return jsonResponse({ admins: data });
  }

  if (payload.action === "create") {
    const email = payload.email?.trim().toLowerCase();
    const password = payload.password ?? "";
    if (!email || !isValidEmail(email)) {
      return jsonResponse({ error: "A valid email is required" }, 400);
    }
    if (password.length < 8) {
      return jsonResponse({ error: "Password must be at least 8 characters" }, 400);
    }

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError || !created?.user) {
      return jsonResponse({ error: createError?.message ?? "Failed to create the account" }, 400);
    }

    const { error: insertError } = await supabase
      .from("admins")
      .insert({ id: created.user.id, email, is_super_admin: false });
    if (insertError) {
      console.error("manage-admins: admins insert failed", insertError.message);
      // The auth user now exists but isn't on the allow-list — not a
      // security issue (admins-table membership is the actual gate, see
      // supabaseAdminClient.ts's signInWithPassword), just an orphaned
      // account. Surface it so the caller can retry or clean up.
      return jsonResponse({ error: "Account created but could not be added to the admin allow-list" }, 500);
    }

    return jsonResponse({ status: "created", id: created.user.id, email });
  }

  if (payload.action === "delete") {
    const adminId = payload.admin_id;
    if (!adminId) {
      return jsonResponse({ error: "admin_id is required" }, 400);
    }

    const { data: target, error: findError } = await supabase
      .from("admins")
      .select("id, is_super_admin")
      .eq("id", adminId)
      .maybeSingle();
    if (findError) {
      console.error("manage-admins: lookup failed", findError.message);
      return jsonResponse({ error: "Failed to look up admin" }, 500);
    }
    if (!target) {
      return jsonResponse({ error: "Admin not found" }, 404);
    }
    if (target.is_super_admin) {
      return jsonResponse({ error: "The super-admin account can't be removed" }, 400);
    }

    const { error: deleteError } = await supabase.from("admins").delete().eq("id", adminId);
    if (deleteError) {
      console.error("manage-admins: delete failed", deleteError.message);
      return jsonResponse({ error: "Failed to remove admin" }, 500);
    }

    return jsonResponse({ status: "deleted" });
  }

  return jsonResponse({ error: "Unknown action" }, 400);
});
