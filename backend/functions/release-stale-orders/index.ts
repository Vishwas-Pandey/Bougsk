// release-stale-orders: scheduled job (pg_cron, every 5 minutes — see
// migration 0007_v1_2_cron_jobs.sql) that releases stock held by orders
// that were created but never paid for.
//
// Why this exists: create-order decrements stock atomically the moment
// an order row is written (see create_order_tx, migration 0004) — before
// the customer has actually completed Razorpay Checkout. If they abandon
// checkout (closed the tab, payment failed silently, lost signal), that
// stock stays reserved forever against a payment that's never coming.
// This job is the release valve: any order still payment_status =
// 'pending' after a 30-minute window gets its stock handed back and is
// marked cancelled, so a real customer isn't blocked by a phantom hold.
//
// Not public-facing — no CORS handling needed. Supabase's default
// verify_jwt gate (see config.toml) is what protects this endpoint; the
// cron job authenticates with the service role key as its bearer token.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const STALE_AFTER_MINUTES = 30;

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const cutoff = new Date(Date.now() - STALE_AFTER_MINUTES * 60 * 1000).toISOString();

  const { data: staleOrders, error: findError } = await supabase
    .from("orders")
    .select("id, order_number")
    .eq("payment_status", "pending")
    .eq("order_status", "placed")
    .lt("created_at", cutoff);

  if (findError) {
    console.error("release-stale-orders: failed to query stale orders", findError.message);
    return new Response(JSON.stringify({ error: findError.message }), { status: 500 });
  }

  const results: Array<{ order_number: string; released: boolean }> = [];

  for (const order of staleOrders ?? []) {
    // Release stock first (reverses the atomic decrement from
    // create_order_tx, see migration 0004), then mark the order
    // cancelled. If either step fails, log and move on to the next order
    // rather than letting one bad row block the whole batch.
    const { error: stockError } = await supabase.rpc("release_stock_for_order", { p_order_id: order.id });
    if (stockError) {
      console.error(`release-stale-orders: failed to release stock for ${order.order_number}`, stockError.message);
      results.push({ order_number: order.order_number, released: false });
      continue;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        order_status: "cancelled",
        notes: "Cancelled automatically: payment timeout (no payment received within 30 minutes).",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) {
      console.error(`release-stale-orders: failed to cancel ${order.order_number}`, updateError.message);
      results.push({ order_number: order.order_number, released: false });
      continue;
    }

    results.push({ order_number: order.order_number, released: true });
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
