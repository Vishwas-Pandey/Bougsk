-- Bougsk backend — v1.2 schema extensions.
-- Adds: GST/tax fields, refunds, gifting, inventory-concurrency-safe
-- sequences, audit logging, reviews, subscribers, and rate limiting.
-- This migration is additive only — nothing from 0001 is dropped or
-- renamed, so every column/table added here layers on top of a fresh
-- 0001 + 0002 + 0003 run.

-- ---------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------
alter table products
  add column sku text unique,                 -- only for products with no variants; variants carry their own sku
  add column care_instructions text,           -- null = fall back to site_settings.default_care_instructions
  add column hsn_code text,                    -- GST HSN classification, snapshotted onto order_items at purchase
  add column low_stock_threshold int;          -- null = use site_settings.low_stock_threshold

-- ---------------------------------------------------------------------
-- product_variants
-- ---------------------------------------------------------------------
alter table product_variants
  add column is_active boolean not null default true; -- lets admin retire one size without deleting the row

-- ---------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------
alter table orders
  add column billing_address jsonb,             -- null = same as shipping_address
  add column discount_inr numeric not null default 0,      -- always 0 at launch, no coupon engine yet
  add column taxable_amount_inr numeric not null,           -- = subtotal_inr - discount_inr
  add column tax_rate_percent numeric not null default 0,   -- snapshotted from site_settings at purchase time
  add column tax_amount_inr numeric not null default 0,     -- snapshotted — later rate changes never touch past orders
  add column gst_invoice_number text unique,    -- generated once, on payment success, from gst_invoice_seq
  add column buyer_gstin text,                  -- optional, for a business buyer's input-tax-credit invoice
  add column refund_status text not null default 'none'
    check (refund_status in ('none','initiated','partial','completed','failed')),
  add column refund_amount_inr numeric,
  add column razorpay_refund_id text,
  add column refund_reason text,
  add column refunded_at timestamptz,
  add column is_gift boolean not null default false,
  add column gift_message text,
  add column recipient_name text,               -- shown only when is_gift; distinct from customer_name on the shipping label
  add column gift_wrap_requested boolean not null default false;

-- total_inr semantics change under v1.2: it is now
--   taxable_amount_inr + tax_amount_inr + shipping_fee_inr
-- (previously just subtotal_inr + shipping_fee_inr, before GST existed).
comment on column orders.total_inr is
  'taxable_amount_inr + tax_amount_inr + shipping_fee_inr. Set once at order creation and never recomputed from a later rate change.';

-- payment_status keeps its original three-plus-one values (pending/paid/
-- failed/refunded) from 0001. Refund *lifecycle* detail now lives in the
-- new refund_status column below — payment_status is not repurposed here,
-- to avoid touching a constraint 0001 already shipped with.

-- ---------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------
alter table order_items
  add column variant_id uuid references product_variants(id),
  add column hsn_code text; -- snapshotted from products.hsn_code at order-creation time

-- ---------------------------------------------------------------------
-- Sequences — order numbers and GST invoice numbers must never be derived
-- from `select max()+1` / `count()+1` in application code, since that
-- races under concurrent orders. A sequence's nextval() is atomic under
-- concurrency by construction.
-- ---------------------------------------------------------------------
create sequence order_number_seq;
create sequence gst_invoice_seq;

-- ---------------------------------------------------------------------
-- New tables
-- ---------------------------------------------------------------------
create table admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references admins(id),
  action text not null,        -- e.g. "product.price_updated", "order.status_changed"
  entity_type text not null,   -- "product" | "order" | "site_settings" | ...
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz default now()
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  order_id uuid references orders(id),   -- null = not a verified purchase
  customer_name text not null,
  rating int not null check (rating between 1 and 5),
  review_text text,
  image_path text,
  is_verified_purchase boolean not null default false,  -- set server-side only, by a submit-review Edge Function checking the order actually contains this product
  is_published boolean not null default false,          -- admin approval gate
  created_at timestamptz default now()
);

create table subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  source text,          -- "footer" | "checkout" | "post_purchase" — which capture point
  consented boolean not null default true,
  created_at timestamptz default now()
);

create table rate_limit_attempts (
  key text primary key,     -- e.g. "track-order:ip:" || ip, or "track-order:order:" || order_number
  attempt_count int not null default 1,
  window_start timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Transaction-safe helper functions used by Edge Functions (via the
-- service role / supabase.rpc()). Each of these does its real work inside
-- a single Postgres function call, which Postgres always runs as one
-- implicit transaction — an exception raised partway through rolls back
-- everything the function already wrote, which is what gives us "atomic
-- stock decrement + order creation" and "atomic rate-limit upsert"
-- without hand-rolling multi-statement transaction control from Deno.
-- All three are locked to the service_role — they are never meant to be
-- callable directly by anon/authenticated clients.
-- ---------------------------------------------------------------------

-- create_order_tx: atomically decrements stock for every line item
-- (conditionally, so it can never go negative under concurrent orders)
-- and, only if every line had enough stock, inserts the order + its
-- items. p_items is a jsonb array of objects shaped like:
--   { product_id, variant_id | null, product_name, variant_name | null,
--     unit_price_inr, quantity, line_total_inr, hsn_code | null }
-- Raises 'OUT_OF_STOCK:<product name>' (aborting the whole call, so
-- nothing partial is ever written) when any line can't be fulfilled.
create or replace function create_order_tx(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_shipping_address jsonb,
  p_billing_address jsonb,
  p_is_gift boolean,
  p_gift_message text,
  p_recipient_name text,
  p_gift_wrap_requested boolean,
  p_buyer_gstin text,
  p_shipping_fee_inr numeric,
  p_tax_rate_percent numeric,
  p_razorpay_order_id text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_subtotal numeric := 0;
  v_taxable numeric;
  v_tax_amount numeric;
  v_total numeric;
  v_order_number text;
  v_order_id uuid;
  v_updated_stock int;
  v_qty int;
begin
  select coalesce(sum((elem->>'line_total_inr')::numeric), 0)
  into v_subtotal
  from jsonb_array_elements(p_items) elem;

  -- discount_inr is always 0 for now — no coupon engine yet.
  v_taxable := v_subtotal;
  v_tax_amount := round(v_taxable * p_tax_rate_percent / 100, 2);
  v_total := v_taxable + v_tax_amount + p_shipping_fee_inr;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::int;

    if (v_item->>'variant_id') is not null then
      update product_variants
      set stock_quantity = stock_quantity - v_qty
      where id = (v_item->>'variant_id')::uuid
        and stock_quantity >= v_qty
      returning stock_quantity into v_updated_stock;
    else
      update products
      set stock_quantity = stock_quantity - v_qty
      where id = (v_item->>'product_id')::uuid
        and stock_quantity >= v_qty
      returning stock_quantity into v_updated_stock;
    end if;

    if v_updated_stock is null then
      raise exception 'OUT_OF_STOCK:%', (v_item->>'product_name');
    end if;
  end loop;

  v_order_number := 'BOUGSK-' || lpad(nextval('order_number_seq')::text, 6, '0');

  insert into orders (
    order_number, customer_name, customer_email, customer_phone,
    shipping_address, billing_address,
    subtotal_inr, discount_inr, taxable_amount_inr, tax_rate_percent, tax_amount_inr,
    shipping_fee_inr, total_inr,
    payment_status, payment_gateway_order_id, order_status,
    is_gift, gift_message, recipient_name, gift_wrap_requested, buyer_gstin
  ) values (
    v_order_number, p_customer_name, p_customer_email, p_customer_phone,
    p_shipping_address, p_billing_address,
    v_subtotal, 0, v_taxable, p_tax_rate_percent, v_tax_amount,
    p_shipping_fee_inr, v_total,
    'pending', p_razorpay_order_id, 'placed',
    p_is_gift, p_gift_message, p_recipient_name, p_gift_wrap_requested, p_buyer_gstin
  )
  returning id into v_order_id;

  insert into order_items (
    order_id, product_id, variant_id, product_name, variant_name,
    unit_price_inr, quantity, line_total_inr, hsn_code
  )
  select
    v_order_id,
    (elem->>'product_id')::uuid,
    nullif(elem->>'variant_id', '')::uuid,
    elem->>'product_name',
    elem->>'variant_name',
    (elem->>'unit_price_inr')::numeric,
    (elem->>'quantity')::int,
    (elem->>'line_total_inr')::numeric,
    elem->>'hsn_code'
  from jsonb_array_elements(p_items) elem;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal_inr', v_subtotal,
    'taxable_amount_inr', v_taxable,
    'tax_amount_inr', v_tax_amount,
    'total_inr', v_total
  );
end;
$$;

revoke all on function create_order_tx from public;
grant execute on function create_order_tx to service_role;

-- release_stock_for_order: reverses the atomic decrement above for every
-- line item of an order. Shared by refund-order (manual admin cancel
-- before shipping) and release-stale-orders (automatic cancel after a
-- payment-pending timeout) so the "add the stock back" logic only lives
-- in one place.
create or replace function release_stock_for_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_line record;
begin
  for v_line in
    select variant_id, product_id, quantity from order_items where order_id = p_order_id
  loop
    if v_line.variant_id is not null then
      update product_variants set stock_quantity = stock_quantity + v_line.quantity where id = v_line.variant_id;
    else
      update products set stock_quantity = stock_quantity + v_line.quantity where id = v_line.product_id;
    end if;
  end loop;
end;
$$;

revoke all on function release_stock_for_order from public;
grant execute on function release_stock_for_order to service_role;

-- check_rate_limit: atomically upserts a rate_limit_attempts row keyed on
-- an arbitrary string (e.g. "track-order:ip:1.2.3.4" or
-- "track-order:order:BOUGSK-000123"), resetting the window once it has
-- elapsed, and returns whether the caller is still within the allowed
-- attempt count. The upsert's ON CONFLICT clause is a single atomic
-- statement, so two concurrent requests for the same key can't both read
-- a stale count and both "win".
create or replace function check_rate_limit(
  p_key text,
  p_max_attempts int default 5,
  p_window_minutes int default 10
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row rate_limit_attempts%rowtype;
begin
  insert into rate_limit_attempts (key, attempt_count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set attempt_count = case
          when rate_limit_attempts.window_start < now() - (p_window_minutes || ' minutes')::interval
            then 1
          else rate_limit_attempts.attempt_count + 1
        end,
        window_start = case
          when rate_limit_attempts.window_start < now() - (p_window_minutes || ' minutes')::interval
            then now()
          else rate_limit_attempts.window_start
        end
  returning * into v_row;

  return v_row.attempt_count <= p_max_attempts;
end;
$$;

revoke all on function check_rate_limit from public;
grant execute on function check_rate_limit to service_role;

-- generate_gst_invoice_number: wraps nextval(gst_invoice_seq) so it can be
-- called via supabase.rpc() from verify-payment. PostgREST only exposes
-- functions declared in the public schema, and the built-in nextval()
-- lives in pg_catalog — this thin wrapper is what actually makes the
-- sequence reachable from an Edge Function, and lets us restrict who may
-- advance it (service_role only) rather than exposing nextval() itself
-- (which would let a caller advance *any* sequence by name).
create or replace function generate_gst_invoice_number()
returns text
language sql
security definer
set search_path = public
as $$
  select 'BOUGSK-INV-' || nextval('gst_invoice_seq')::text;
$$;

revoke all on function generate_gst_invoice_number from public;
grant execute on function generate_gst_invoice_number to service_role;
