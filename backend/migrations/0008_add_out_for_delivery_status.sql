-- Adds "out_for_delivery" as its own order_status, between "shipped" and
-- "delivered" — the courier's last-mile hand-off stage, distinct from
-- "shipped" (handed to the courier network) since a customer asking "where
-- is it" benefits from knowing it's on today's delivery run, not just
-- somewhere in transit.
alter table orders drop constraint if exists orders_order_status_check;
alter table orders add constraint orders_order_status_check
  check (order_status in (
    'placed','confirmed','packed','shipped','out_for_delivery','delivered','cancelled'
  ));
