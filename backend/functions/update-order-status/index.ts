// update-order-status: admin-only Edge Function that advances order_status
// (and optionally courier_name/tracking_number) and sends the matching
// customer email for that transition. The admin panel calls this instead of
// writing order_status directly, so every status change (a) writes an
// admin_audit_logs row and (b) triggers its notification from the same
// place that owns the change — per the Build Spec's "never a separate cron
// job re-deriving what happened."
//
// payment_status/refund_status are never touched here — those stay the
// exclusive province of verify-payment/refund-order/the Razorpay webhook.

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  sendOrderPackedEmail,
  sendOrderShippedEmail,
  sendOutForDeliveryEmail,
  sendOrderDeliveredEmail,
} from "../_shared/email.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ALLOWED_ORIGIN = Deno.env.get("ADMIN_ORIGIN");
if (!ALLOWED_ORIGIN) {
  console.error("update-order-status: ADMIN_ORIGIN is not set — refusing to advertise any CORS origin");
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

const VALID_STATUSES = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;
type OrderStatus = (typeof VALID_STATUSES)[number];

// Only these transitions fire a customer email — placed/confirmed are
// covered by create-order/verify-payment, and cancelling isn't a promise
// of anything arriving, so no email fires from here for it.
const NOTIFIABLE: Partial<Record<OrderStatus, true>> = {
  packed: true,
  shipped: true,
  out_for_delivery: true,
  delivered: true,
};

interface UpdateStatusPayload {
  order_id: string;
  order_status: OrderStatus;
  courier_name?: string;
  tracking_number?: string;
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

  const { data: isAdmin, error: isAdminError } = await callerClient.rpc("is_admin");
  if (isAdminError || !isAdmin) {
    return jsonResponse({ error: "Admin access required" }, 403);
  }

  let payload: UpdateStatusPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { order_id, order_status, courier_name, tracking_number } = payload;
  if (!order_id || !VALID_STATUSES.includes(order_status)) {
    return jsonResponse({ error: "order_id and a valid order_status are required" }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: before, error: findError } = await supabase
    .from("orders")
    .select("id, order_status, order_number, customer_name, customer_email, total_inr, courier_name, tracking_number")
    .eq("id", order_id)
    .maybeSingle();

  if (findError) {
    return jsonResponse({ error: "Failed to load order", detail: findError.message }, 500);
  }
  if (!before) {
    return jsonResponse({ error: "Order not found" }, 404);
  }

  const patch: Record<string, unknown> = { order_status, updated_at: new Date().toISOString() };
  if (courier_name !== undefined) patch.courier_name = courier_name;
  if (tracking_number !== undefined) patch.tracking_number = tracking_number;

  const { error: updateError } = await supabase.from("orders").update(patch).eq("id", order_id);
  if (updateError) {
    return jsonResponse({ error: "Failed to update order", detail: updateError.message }, 500);
  }

  await supabase.from("admin_audit_logs").insert({
    admin_id: userData.user.id,
    action: "order.status_changed",
    entity_type: "order",
    entity_id: order_id,
    old_value: { order_status: before.order_status },
    new_value: { order_status, courier_name, tracking_number },
  });

  if (NOTIFIABLE[order_status]) {
    const emailOrder = {
      order_number: before.order_number,
      customer_name: before.customer_name,
      customer_email: before.customer_email,
      total_inr: before.total_inr,
      courier_name: courier_name ?? before.courier_name,
      tracking_number: tracking_number ?? before.tracking_number,
    };
    const send =
      order_status === "packed"
        ? sendOrderPackedEmail
        : order_status === "shipped"
          ? sendOrderShippedEmail
          : order_status === "out_for_delivery"
            ? sendOutForDeliveryEmail
            : sendOrderDeliveredEmail;
    send(emailOrder).catch((err) =>
      console.error(`update-order-status: ${order_status} email failed`, err),
    );
  }

  return jsonResponse({ status: "ok", order_status });
});
