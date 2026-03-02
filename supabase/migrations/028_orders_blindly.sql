-- ============================================================
-- MIGRATION 028: BLINDLY ORDERS & CHECKOUT
-- Extends generic shop orders with blind-specific line items,
-- auto-generated order numbers, and pricing breakdowns.
-- ============================================================

-- ---------------------
-- 1. BLINDLY ORDERS
-- Guest checkout: no auth required
-- ---------------------
CREATE TABLE blindly_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,       -- 'BL-2026-0001'

  -- Customer (guest checkout — no auth required)
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address JSONB,                  -- {street, city, province, postal_code}

  -- Delivery & Installation
  delivery_type TEXT NOT NULL              -- 'self_install', 'professional_install'
    CHECK (delivery_type IN ('self_install', 'professional_install')),
  interested_in_other_services BOOLEAN DEFAULT false,  -- Cross-sell flag

  -- Pricing
  subtotal_cents INTEGER NOT NULL,
  extras_total_cents INTEGER DEFAULT 0,
  delivery_fee_cents INTEGER DEFAULT 0,
  installation_fee_cents INTEGER DEFAULT 0,
  vat_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,

  -- Payment
  paystack_reference TEXT,
  paystack_access_code TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),

  -- Pipeline
  order_status TEXT NOT NULL DEFAULT 'new'
    CHECK (order_status IN ('new', 'confirmed', 'ordered_from_supplier', 'shipped', 'delivered', 'installed', 'cancelled')),

  -- Notes
  customer_notes TEXT,
  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_blindly_orders_status ON blindly_orders(order_status);
CREATE INDEX idx_blindly_orders_payment ON blindly_orders(payment_status);
CREATE INDEX idx_blindly_orders_email ON blindly_orders(customer_email);
CREATE INDEX idx_blindly_orders_number ON blindly_orders(order_number);
CREATE INDEX idx_blindly_orders_created ON blindly_orders(created_at DESC);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON blindly_orders FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ---------------------
-- 2. ORDER ITEMS
-- One row per blind in the order
-- ---------------------
CREATE TABLE blindly_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES blindly_orders(id) ON DELETE CASCADE,
  blind_range_id UUID NOT NULL REFERENCES blind_ranges(id),

  -- Configuration
  location_label TEXT,                     -- 'Kitchen', 'Main Bedroom'
  mount_type TEXT NOT NULL                 -- 'inside', 'outside'
    CHECK (mount_type IN ('inside', 'outside')),
  quantity INTEGER NOT NULL DEFAULT 1,

  -- Customer measurements (mm)
  width_mm INTEGER NOT NULL,
  drop_mm INTEGER NOT NULL,

  -- Matched grid point (cm) — what was actually priced
  matched_width_cm NUMERIC(6,1) NOT NULL,
  matched_drop_cm NUMERIC(6,1) NOT NULL,

  -- Options
  colour TEXT NOT NULL,
  control_side TEXT                        -- 'left', 'right'
    CHECK (control_side IN ('left', 'right')),
  stacking TEXT                            -- Vertical blinds
    CHECK (stacking IS NULL OR stacking IN ('left', 'right', 'centre_stack', 'centre_open')),

  -- Pricing breakdown (all in cents)
  supplier_price_cents INTEGER NOT NULL,   -- Raw cost from matrix
  markup_percent NUMERIC(5,2) NOT NULL,    -- Markup applied
  markup_cents INTEGER NOT NULL,           -- Markup amount
  extras_cents INTEGER DEFAULT 0,          -- Total extras for this item
  line_total_cents INTEGER NOT NULL,       -- Final line total

  -- Selected extras detail
  selected_extras JSONB DEFAULT '[]',      -- [{"extra_id":"...","name":"...","price_cents":170}]

  -- Room preview
  room_preview_image_url TEXT,

  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_blindly_order_items_order ON blindly_order_items(order_id);

-- ---------------------
-- 3. ORDER NUMBER SEQUENCE
-- Auto-generate BL-YYYY-NNNN format
-- ---------------------
CREATE SEQUENCE blindly_order_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_blindly_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'BL-' || EXTRACT(YEAR FROM now())::TEXT || '-' || LPAD(nextval('blindly_order_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_blindly_order_number
  BEFORE INSERT ON blindly_orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION generate_blindly_order_number();
