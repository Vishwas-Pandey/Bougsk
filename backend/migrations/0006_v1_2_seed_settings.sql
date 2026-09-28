-- Bougsk backend — v1.2 site_settings seed data.
-- Copy in Bougsk's brand voice: warm, plain, no exclamation marks.

insert into site_settings (key, value) values
  -- GST registration is complete. 5% is the current rate for candles
  -- (HSN 3406) under the GST 2.0 reform effective 22 Sept 2025 — confirm
  -- with an accountant whether hand-poured candles qualify for the lower
  -- 2.5% "handicraft goods" rate instead; this is the safe standard rate.
  -- A later rate change is a settings update here, never a schema change,
  -- and never touches a past order's already-snapshotted tax_rate_percent.
  ('tax_rate_percent', '5'),

  -- Site-wide default low-stock warning threshold for the admin panel.
  -- A given product can override this with its own
  -- products.low_stock_threshold; null there means "use this value".
  ('low_stock_threshold', '3'),

  -- Site-wide fallback care/safety copy, shown on any product whose own
  -- products.care_instructions is null.
  -- Dollar-quoted so the apostrophes in the copy below don't need SQL
  -- escaping (a doubled '' would work too, but is easy to miss on edit).
  ('default_care_instructions', $json$[
    "Let it burn long enough for an even melt pool on the first light.",
    "Trim the wick to 5mm before every light.",
    "Don't leave a burning candle unattended; keep away from children, pets, and flammable objects.",
    "The jar gets hot — discontinue use once about 1cm of wax is left.",
    "Store cool, out of direct sunlight."
  ]$json$::jsonb)
on conflict (key) do update set value = excluded.value;
