-- Bougsk backend — v1.2 RLS policies.
-- Covers the tables added in 0004_v1_2_schema.sql, plus one small update
-- to the public site_settings allow-list from 0002 (see bottom of file).
--
-- Access matrix added here:
--   admin_audit_logs
--     -> anon/authenticated (non-admin): no access at all
--     -> admin: SELECT only. No insert/update/delete policy is defined for
--        anyone — rows are written exclusively by Edge Functions / admin
--        server actions using the service role key (which bypasses RLS),
--        so an admin can never edit or delete their own audit trail
--        through the panel.
--   reviews
--     -> anon/public: SELECT only where is_published = true
--     -> no public INSERT policy at all — submissions go through a
--        dedicated Edge Function using the service role, so
--        is_verified_purchase can never be client-forged
--     -> admin: full read/write, to moderate (approve/reject)
--   subscribers
--     -> anon/public: INSERT only — a one-way capture box, no select/update/delete
--     -> admin: full read/write
--   rate_limit_attempts
--     -> anon/authenticated/admin: no access at all via RLS. Read and
--        written only by the track-order Edge Function via the service
--        role key (through the check_rate_limit() function).

-- ---------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------
alter table admin_audit_logs enable row level security;
alter table reviews enable row level security;
alter table subscribers enable row level security;
alter table rate_limit_attempts enable row level security;

-- ---------------------------------------------------------------------
-- admin_audit_logs — admin read-only, no write policy for anyone.
-- ---------------------------------------------------------------------
create policy "admins can read audit logs"
  on admin_audit_logs for select
  to authenticated
  using (is_admin());

-- ---------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------
create policy "public can read published reviews"
  on reviews for select
  to anon, authenticated
  using (is_admin() or is_published = true);

create policy "admins full access to reviews"
  on reviews for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- Deliberately no insert policy for anon/authenticated: review submission
-- goes through a dedicated Edge Function using the service role, which is
-- the only way is_verified_purchase can be trusted.

-- ---------------------------------------------------------------------
-- subscribers — insert-only capture box for anon/public.
-- ---------------------------------------------------------------------
create policy "public can subscribe"
  on subscribers for insert
  to anon, authenticated
  with check (true);

create policy "admins full access to subscribers"
  on subscribers for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------
-- rate_limit_attempts — no RLS-granted access for anyone, including
-- admins. Only the service role (via check_rate_limit(), itself callable
-- only by service_role) touches this table.
-- ---------------------------------------------------------------------
-- (No policies created — with RLS enabled and zero policies, every role
-- other than the table owner / service role is denied by default.)

-- ---------------------------------------------------------------------
-- site_settings — extend the public allow-list from 0002 with the two
-- new v1.2 keys that the storefront needs to render correctly:
--   - tax_rate_percent: so a cart/checkout page can show a GST line
--     before the customer submits their order (create-order still
--     recomputes and snapshots this server-side regardless).
--   - default_care_instructions: the site-wide fallback used on any
--     product page whose own products.care_instructions is null.
-- low_stock_threshold is deliberately left off this list — it's an
-- internal inventory-ops number, not something the storefront needs.
-- ---------------------------------------------------------------------
drop policy "public can read allow-listed settings" on site_settings;

create policy "public can read allow-listed settings"
  on site_settings for select
  to anon, authenticated
  using (
    is_admin()
    or key in (
      'whatsapp_number',
      'shipping_fee_inr',
      'banner_text',
      'tax_rate_percent',
      'default_care_instructions'
    )
  );
