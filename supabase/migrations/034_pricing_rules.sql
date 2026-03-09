-- Migration 034: Pricing rules — volume discounts & installation costs
-- Adds discount and distance tracking to blindly_orders.
-- Rule configs stored in site_content (section_key: 'installation_pricing', 'volume_discounts').

-- Discount columns on blindly_orders
ALTER TABLE blindly_orders
  ADD COLUMN IF NOT EXISTS discount_rate   NUMERIC(5,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_cents  INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS distance_km     NUMERIC(8,2);

-- Seed default installation pricing rules
INSERT INTO site_content (section_key, content)
VALUES (
  'installation_pricing',
  '{
    "transport_free_radius_km": 50,
    "price_per_km_cents": 1200,
    "tiers": [
      {"min_blinds": 1, "max_blinds": 2,    "cost_cents": 75000},
      {"min_blinds": 3, "max_blinds": 4,    "cost_cents": 60000},
      {"min_blinds": 5, "max_blinds": 7,    "cost_cents": 40000},
      {"min_blinds": 8, "max_blinds": null, "cost_cents": 0}
    ]
  }'::jsonb
)
ON CONFLICT (section_key) DO NOTHING;

-- Seed default volume discount rules
INSERT INTO site_content (section_key, content)
VALUES (
  'volume_discounts',
  '{
    "tiers": [
      {"min_cents": 2000000, "max_cents": 2499999, "rate": 0.025},
      {"min_cents": 2500000, "max_cents": 2999999, "rate": 0.030},
      {"min_cents": 3000000, "max_cents": 3999999, "rate": 0.035},
      {"min_cents": 4000000, "max_cents": null,    "rate": 0.050}
    ]
  }'::jsonb
)
ON CONFLICT (section_key) DO NOTHING;
