-- MIGRATION 036: Add discount columns to blindly_orders
ALTER TABLE blindly_orders
  ADD COLUMN IF NOT EXISTS discount_rate  NUMERIC(5,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_cents INTEGER      NOT NULL DEFAULT 0;
