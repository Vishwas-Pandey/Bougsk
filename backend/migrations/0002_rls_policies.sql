-- Bougsk backend — Row Level Security policies.
--
-- Access matrix implemented here:
--   categories, products, product_variants
--     -> anon/public: SELECT only rows tied to an is_active product
--        (the product itself for `products`, the parent product for
--        `product_variants`; for `categories`, only categories that have
--        at least one active product — categories have no is_active
--        column of their own, see note below)
--     -> admins: full read/write
--   orders, order_items
--     -> anon/authenticated (non-admin): NO access at all, in any direction.
--        All writes happen inside the create-order Edge Function using the
--        service role key, which bypasses RLS entirely.
--     -> admins: full read/write
--   site_settings
--     -> anon/public: SELECT only rows whose key is in a small public
--        allow-list ('whatsapp_number', 'shipping_fee_inr', 'banner_text')
--     -> admins: full read/write
--   admins
--     -> anon/authenticated (non-admin): no access at all
--     -> admin: SELECT only their own row (id = auth.uid())
--        (rows are inserted via the service role — see 0001 comment: this
--        table is an allow-list, "usually exactly one row" — so no
--        self-service insert/update/delete policy is defined here)
--
-- NOTE on categories: the spec describes the public-read condition in terms
-- of "the product (or its parent product, for variants) has is_active =
-- true", but `categories` has no is_active column of its own. Rather than
-- leave categories unrestricted (which would be a looser reading than the
-- spec seems to intend), this migration takes the more literal reading and
-- only exposes a category once it has at least one active product. Admins
-- always see every category regardless.

-- ---------------------------------------------------------------------
-- Helper: is_admin()
-- security definer so it can read `admins` even though `admins` itself
-- has RLS enabled and locked down to non-admins.
-- ---------------------------------------------------------------------
create function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from admins where id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table site_settings enable row level security;
alter table admins enable row level security;

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
create policy "public can read categories with an active product"
  on categories for select
  to anon, authenticated
  using (
    is_admin()
    or exists (
      select 1 from products p
      where p.category_id = categories.id
        and p.is_active = true
    )
  );

create policy "admins full access to categories"
  on categories for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------
create policy "public can read active products"
  on products for select
  to anon, authenticated
  using (is_admin() or is_active = true);

create policy "admins full access to products"
  on products for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------
-- product_variants
-- ---------------------------------------------------------------------
create policy "public can read variants of active products"
  on product_variants for select
  to anon, authenticated
  using (
    is_admin()
    or exists (
      select 1 from products p
      where p.id = product_variants.product_id
        and p.is_active = true
    )
  );

create policy "admins full access to product_variants"
  on product_variants for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------
-- orders — no anon/authenticated-non-admin access whatsoever.
-- All customer-facing writes go through create-order (service role, bypasses RLS).
-- ---------------------------------------------------------------------
create policy "admins full access to orders"
  on orders for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------
-- order_items — same as orders, no public access.
-- ---------------------------------------------------------------------
create policy "admins full access to order_items"
  on order_items for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------
-- site_settings
-- ---------------------------------------------------------------------
create policy "public can read allow-listed settings"
  on site_settings for select
  to anon, authenticated
  using (
    is_admin()
    or key in ('whatsapp_number', 'shipping_fee_inr', 'banner_text')
  );

create policy "admins full access to site_settings"
  on site_settings for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------
-- admins — self-select only; no insert/update/delete policy at all, rows
-- are managed via the service role (bypasses RLS) from outside the app.
-- ---------------------------------------------------------------------
create policy "admin can read own row"
  on admins for select
  to authenticated
  using (id = auth.uid());

-- ---------------------------------------------------------------------
-- Storage bucket policies (NOT runnable SQL — Supabase Storage bucket
-- policies are configured via the dashboard or the Storage API, not via
-- plain SQL in a migration). Documented here for reference:
--
--   bucket: product-images
--     - public read (anyone can GET/download objects)
--     - INSERT/UPDATE/DELETE restricted to is_admin()
--
--   Equivalent policy intent, if it were expressed as SQL against
--   storage.objects:
--
--   create policy "product-images public read"
--     on storage.objects for select
--     using (bucket_id = 'product-images');
--
--   create policy "product-images admin write"
--     on storage.objects for insert
--     with check (bucket_id = 'product-images' and is_admin());
--
--   create policy "product-images admin update"
--     on storage.objects for update
--     using (bucket_id = 'product-images' and is_admin());
--
--   create policy "product-images admin delete"
--     on storage.objects for delete
--     using (bucket_id = 'product-images' and is_admin());
-- ---------------------------------------------------------------------
