-- Bougsk backend — seed data for launch categories.
-- Copy in Bougsk's brand voice: warm, concrete, no exclamation marks.

insert into categories (name, slug, description, sort_order) values
  ('Signature', 'signature', 'The scents that started it all, poured the way we first imagined them.', 1),
  ('Amber & Wood', 'amber-wood', 'Resin, cedar, and smoke, built for rooms that want to feel lived in.', 2),
  ('Floral & Green', 'floral-green', 'Petals and stems, cut close to the earth they grew from.', 3),
  ('Seasonal', 'seasonal', 'Small batches tied to the months, gone once the season turns.', 4),
  ('Gift Sets', 'gift-sets', 'Candles paired and boxed for someone you are thinking of.', 5);
