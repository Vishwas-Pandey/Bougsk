-- Bougsk backend — customer accounts (email/password + Google via Supabase
-- Auth). Browsing stays fully public; placing an order now requires a
-- signed-in customer. Customers are plain Supabase Auth users — NOT rows
-- in `admins`, which remains the separate, much narrower staff allow-list.

alter table orders
  add column user_id uuid references auth.users(id) on delete set null;

comment on column orders.user_id is
  'The signed-in customer who placed this order. Null only for orders created before accounts existed.';

-- ---------------------------------------------------------------------
-- create_order_tx — same as migration 0004's version, with one addition:
-- p_user_id. Appending a parameter (even with a default) changes the
-- function's signature, so plain CREATE OR REPLACE would leave the old
-- 14-argument version behind as a second overload rather than replacing
-- it — drop that exact old signature first so exactly one version exists
-- (the revoke/grant below would otherwise be ambiguous between the two).
-- ---------------------------------------------------------------------
drop function if exists create_order_tx(
  text, text, text, jsonb, jsonb, boolean, text, text, boolean, text,
  numeric, numeric, text, jsonb
);

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
  p_items jsonb,
  p_user_id uuid default null
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
    is_gift, gift_message, recipient_name, gift_wrap_requested, buyer_gstin,
    user_id
  ) values (
    v_order_number, p_customer_name, p_customer_email, p_customer_phone,
    p_shipping_address, p_billing_address,
    v_subtotal, 0, v_taxable, p_tax_rate_percent, v_tax_amount,
    p_shipping_fee_inr, v_total,
    'pending', p_razorpay_order_id, 'placed',
    p_is_gift, p_gift_message, p_recipient_name, p_gift_wrap_requested, p_buyer_gstin,
    p_user_id
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

-- ---------------------------------------------------------------------
-- RLS — a signed-in customer may read (never write) their own orders.
-- This is additive alongside the existing admin-full-access policy
-- (migration 0002): Postgres OR's multiple permissive policies for the
-- same command together, so this never widens what an admin can already
-- do, and never lets a customer see or touch anyone else's order.
-- ---------------------------------------------------------------------
create policy "customers can read own orders"
  on orders for select
  using (auth.uid() = user_id);

create policy "customers can read own order_items"
  on order_items for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );
