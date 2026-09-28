// track-order: public, unauthenticated order lookup for a customer who
// doesn't have an account (there is no customer login in v1.2). This is
// the one place a stranger can look up someone else's order, so it's
// treated carefully:
//   - both order_number AND phone (or email) are required — never a
//     lookup by order number alone.
//   - every failure path returns the exact same generic message, whether
//     the order number is wrong, right-but-unmatched, or rate-limited —
//     a distinct message for any of those would itself leak information.
//   - rate limited by IP and separately by order_number (5 attempts /
//     10-minute window each), via the rate_limit_attempts table.
//   - returns the minimum: order_status, courier_name, tracking_number.
//     Never the address, payment details, or the internal orders.id —
//     order_number is the only identifier ever exposed publicly.

import { createClient } from "npm:@supabase/supabase-js@2";
import { orderMatchesContact } from "../_shared/orderMatch.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ALLOWED_ORIGIN = Deno.env.get("STOREFRONT_ORIGIN");
if (!ALLOWED_ORIGIN) {
  console.error("track-order: STOREFRONT_ORIGIN is not set — refusing to advertise any CORS origin");
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
if (ALLOWED_ORIGIN) corsHeaders["Access-Control-Allow-Origin"] = ALLOWED_ORIGIN;

// Always the same message. Never "too many attempts" (which would itself
// confirm the order number is real) and never anything distinguishing
// "no such order" from "order number right, phone/email wrong".
const GENERIC_ERROR = "We couldn't find a matching order. Double-check your order number and phone/email.";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Every failure path — bad input, rate-limited, no such order, wrong
// phone/email, even an infra error — returns this exact status and body.
// Varying either one by reason would itself be a signal to an attacker
// probing for valid order numbers.
function genericFailure() {
  return jsonResponse({ error: GENERIC_ERROR }, 404);
}

interface TrackOrderPayload {
  order_number: string;
  phone?: string;
  email?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let payload: TrackOrderPayload;
  try {
    payload = await req.json();
  } catch {
    return genericFailure();
  }

  const orderNumber = payload.order_number?.trim();
  const phone = payload.phone?.trim();
  const email = payload.email?.trim().toLowerCase();

  // Both factors required — never allow lookup by order number alone.
  // Same status code and message as every other failure path below: a
  // malformed request must be indistinguishable from a wrong order
  // number or a rate limit, not just have the same body text.
  if (!orderNumber || (!phone && !email)) {
    return genericFailure();
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // Rate limit by IP and, separately, by the order number being probed —
  // both must be within the 5-attempts/10-minute window. Each call to
  // check_rate_limit is a single atomic upsert (see migration 0004), so
  // concurrent requests can't race past the limit.
  const [{ data: ipAllowed, error: ipError }, { data: orderAllowed, error: orderError }] = await Promise.all([
    supabase.rpc("check_rate_limit", { p_key: `track-order:ip:${ip}`, p_max_attempts: 5, p_window_minutes: 10 }),
    supabase.rpc("check_rate_limit", {
      p_key: `track-order:order:${orderNumber}`,
      p_max_attempts: 5,
      p_window_minutes: 10,
    }),
  ]);

  if (ipError || orderError) {
    // Fail closed on an infrastructure error rather than skipping the
    // rate limit silently. Same status/message as everything else — a
    // rate-limit-check outage must not read differently from "not found".
    console.error("track-order: rate limit check failed", ipError?.message, orderError?.message);
    return genericFailure();
  }
  if (!ipAllowed || !orderAllowed) {
    return genericFailure();
  }

  const { data: order, error: findError } = await supabase
    .from("orders")
    .select("order_number, customer_phone, customer_email, order_status, courier_name, tracking_number")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (findError) {
    console.error("track-order: lookup failed", findError.message);
    return genericFailure();
  }

  // Identical response whether the order doesn't exist or exists but the
  // second factor doesn't match — never reveal which.
  if (!orderMatchesContact(order, phone, email)) {
    return genericFailure();
  }

  return jsonResponse({
    order_number: order!.order_number,
    order_status: order!.order_status,
    courier_name: order!.courier_name,
    tracking_number: order!.tracking_number,
  });
});
