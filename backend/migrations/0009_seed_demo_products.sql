-- Bougsk backend — placeholder product catalog.
-- These mirror the storefront's local mock catalog (frontend/lib/mockData.ts)
-- so the real checkout + Razorpay flow has real rows to re-price against
-- before the real catalog (photos, final copy, final pricing) is uploaded.
-- Replace/edit freely from the admin panel — nothing here is final.
-- "Untitled Draft" is intentionally is_active = false, same as the mock,
-- to exercise the "inactive product" path too.

insert into products (
  category_id, name, slug, description, scent_notes, ingredients, hsn_code,
  burn_time_hours, weight_grams, price_inr, compare_at_price_inr,
  stock_quantity, low_stock_threshold, is_active, is_featured, image_paths
) values
  (
    (select id from categories where slug = 'signature'),
    'Amber Dusk', 'amber-dusk',
    'Amber and sandalwood, poured into blackened terracotta. The scent settles in slowly, like a room after the last guest leaves.',
    array['Amber','Sandalwood','Smoke'],
    'Soy wax, cotton wick, phthalate-free fragrance oil, blackened terracotta vessel.',
    '3406', 40, 220, 1450, null, 24, null, true, true, '{}'
  ),
  (
    (select id from categories where slug = 'signature'),
    'Wine Ember', 'wine-ember',
    'Fig, dark plum, and a thread of clove. Poured in deep wine glass, the kind of scent that arrives before it announces itself.',
    array['Fig','Plum','Clove'],
    'Soy wax, cotton wick, phthalate-free fragrance oil, tinted glass vessel.',
    '3406', 38, 210, 1550, null, 0, null, true, true, '{}'
  ),
  (
    (select id from categories where slug = 'amber-wood'),
    'Cedar & Smoke', 'cedar-smoke',
    'Cedarwood and a little smoke, like a fireplace in an old library. Grounding, unhurried, built for long evenings.',
    array['Cedarwood','Smoke','Vetiver'],
    'Soy wax, cotton wick, phthalate-free fragrance oil, matte charcoal vessel.',
    '3406', 45, 230, 1650, null, 15, null, true, true, '{}'
  ),
  (
    (select id from categories where slug = 'amber-wood'),
    'Sandalwood Study', 'sandalwood-study',
    'Sandalwood, a little leather, a little paper. Made for a desk lamp and a closed door.',
    array['Sandalwood','Leather','Paper'],
    'Soy wax, cotton wick, phthalate-free fragrance oil, matte stone vessel.',
    '3406', 42, 220, 1500, null, 18, null, true, false, '{}'
  ),
  (
    (select id from categories where slug = 'floral-green'),
    'Linen Bloom', 'linen-bloom',
    'White tea and jasmine, folded into fresh linen. Light enough for a morning room.',
    array['White Tea','Jasmine','Linen'],
    'Soy wax, cotton wick, phthalate-free fragrance oil, pale ceramic vessel.',
    '3406', 36, 200, 1350, null, 20, null, true, true, '{}'
  ),
  (
    (select id from categories where slug = 'floral-green'),
    'Fig Leaf & Moss', 'fig-leaf-moss',
    'Green fig leaf, damp moss, a little citrus at the edge. Cut stems in a glass by the window.',
    array['Fig Leaf','Moss','Citrus'],
    'Soy wax, cotton wick, phthalate-free fragrance oil, pale ceramic vessel.',
    '3406', 36, 200, 1350, null, 3, null, true, false, '{}'
  ),
  (
    (select id from categories where slug = 'seasonal'),
    'Winter Hearth', 'winter-hearth',
    'Clove, orange peel, and burnt sugar. Poured for the shortest days of the year, in small batches only.',
    array['Clove','Orange','Burnt Sugar'],
    'Soy wax, cotton wick, phthalate-free fragrance oil, wine-glazed ceramic vessel.',
    '3406', 40, 220, 1600, null, 10, 5, true, false, '{}'
  ),
  (
    (select id from categories where slug = 'seasonal'),
    'Untitled Draft', 'untitled-draft',
    'Still being tested in the studio — not ready for the shop yet.',
    array['Bergamot','Tobacco'],
    'Soy wax, cotton wick, phthalate-free fragrance oil.',
    '3406', 40, 220, 1500, null, 0, null, false, false, '{}'
  )
on conflict (slug) do nothing;

insert into product_variants (product_id, name, price_inr, stock_quantity, sku, is_active)
select id, 'Small / 120g', 950, 30, 'AD-SM', true from products where slug = 'amber-dusk'
union all
select id, 'Large / 220g', 1450, 24, 'AD-LG', true from products where slug = 'amber-dusk'
on conflict (sku) do nothing;

-- Shipping settings the mock storefront also uses (create-order reads these
-- fresh per order; missing keys default to shipping_fee_inr = 0).
insert into site_settings (key, value) values
  ('shipping_fee_inr', '99'),
  ('free_shipping_threshold_inr', '2000')
on conflict (key) do update set value = excluded.value;
