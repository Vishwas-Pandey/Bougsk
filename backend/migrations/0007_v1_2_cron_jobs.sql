-- Bougsk backend — scheduled release of stale (payment-pending) orders.
--
-- Why this exists: create-order decrements stock the moment an order row
-- is created (see create_order_tx in 0004), *before* the customer has
-- actually paid — Razorpay Checkout is still in front of them at that
-- point. If they close the tab / lose signal / abandon checkout, that
-- stock stays reserved against a payment that will never arrive. This
-- job is the release valve: anything still payment_status = 'pending'
-- past a reasonable window gets its stock handed back and is marked
-- cancelled, so real customers aren't blocked by phantom holds.
--
-- Schedule: every 5 minutes, via pg_cron. The release-stale-orders Edge
-- Function itself only touches orders whose pending window has actually
-- exceeded 30 minutes (see that function) — running the *check* every 5
-- minutes just keeps the lag between "order goes stale" and "stock comes
-- back" small, without being wasteful.
--
-- pg_cron and pg_net are both available on every Supabase project (enable
-- them once via Database -> Extensions in the dashboard if they aren't
-- already on). This migration assumes that's been done; `create extension
-- if not exists` below is a no-op if so.
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- The project URL and a service-role key are needed to call the Edge
-- Function, but neither belongs in a migration file that gets committed
-- to git. Store them ONCE, out-of-band (Supabase dashboard SQL editor, or
-- `supabase secrets`/CLI against the linked project), via Vault:
--
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<service-role-key>', 'service_role_key');
--
-- This migration only reads them back through vault.decrypted_secrets at
-- schedule-registration time and, again, every time the job actually
-- fires — the literal values are never written into migration history.
select cron.schedule(
  'release-stale-orders',
  '*/5 * * * *',
  $cron$
  select
    net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
             || '/functions/v1/release-stale-orders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
      ),
      body := '{}'::jsonb
    );
  $cron$
);
