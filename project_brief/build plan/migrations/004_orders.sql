-- ============================================================
-- MIGRATION 004: ORDERS & CHECKOUT
-- ============================================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address JSONB,
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('self_install', 'professional_install')),
  interested_in_other_services BOOLEAN DEFAULT false,
  subtotal_cents INTEGER NOT NULL,
  extras_total_cents INTEGER DEFAULT 0,
  delivery_fee_cents INTEGER DEFAULT 0,
  installation_fee_cents INTEGER DEFAULT 0,
  vat_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  paystack_reference TEXT,
  paystack_access_code TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  order_status TEXT NOT NULL DEFAULT 'new' CHECK (order_status IN ('new', 'confirmed', 'ordered_from_supplier', 'shipped', 'delivered', 'installed', 'cancelled')),
  customer_notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_payment ON orders(payment_status);
CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  blind_range_id UUID NOT NULL REFERENCES blind_ranges(id),
  location_label TEXT,
  mount_type TEXT NOT NULL CHECK (mount_type IN ('inside', 'outside')),
  quantity INTEGER NOT NULL DEFAULT 1,
  width_mm INTEGER NOT NULL,
  drop_mm INTEGER NOT NULL,
  matched_width_cm NUMERIC(6,1) NOT NULL,
  matched_drop_cm NUMERIC(6,1) NOT NULL,
  colour TEXT NOT NULL,
  control_side TEXT CHECK (control_side IN ('left', 'right')),
  stacking TEXT CHECK (stacking IS NULL OR stacking IN ('left', 'right', 'centre_stack', 'centre_open')),
  supplier_price_cents INTEGER NOT NULL,
  markup_percent NUMERIC(5,2) NOT NULL,
  markup_cents INTEGER NOT NULL,
  extras_cents INTEGER DEFAULT 0,
  line_total_cents INTEGER NOT NULL,
  selected_extras JSONB DEFAULT '[]',
  room_preview_image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Order number auto-generation: BL-YYYY-NNNN
CREATE SEQUENCE order_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'BL-' || EXTRACT(YEAR FROM now())::TEXT || '-' || LPAD(nextval('order_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION generate_order_number();
