-- ============================================================
-- MIGRATION 003: EXTRAS, MOTORISATION & PRICING CONFIGURATION
-- ============================================================

CREATE TABLE blind_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  applies_to_categories UUID[],
  applies_to_types UUID[],
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('fixed', 'width_based', 'per_unit')),
  fixed_price_cents INTEGER,
  max_width_cm NUMERIC(6,1),
  is_upgrade BOOLEAN DEFAULT false,
  replaces_extra_id UUID REFERENCES blind_extras(id),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON blind_extras FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE extra_price_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extra_id UUID NOT NULL REFERENCES blind_extras(id) ON DELETE CASCADE,
  width_cm NUMERIC(6,1) NOT NULL,
  price_cents INTEGER NOT NULL,
  UNIQUE(extra_id, width_cm)
);

CREATE INDEX idx_extra_prices_lookup ON extra_price_points(extra_id, width_cm);

CREATE TABLE mechanism_lookup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  width_cm NUMERIC(6,1) NOT NULL,
  drop_cm NUMERIC(6,1) NOT NULL,
  tube_size TEXT NOT NULL,
  UNIQUE(width_cm, drop_cm)
);

CREATE INDEX idx_mechanism_lookup ON mechanism_lookup(width_cm, drop_cm);

CREATE TABLE motorisation_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  tube_size_mm INTEGER,
  description TEXT,
  is_rechargeable BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON motorisation_options FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE motorisation_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motor_id UUID NOT NULL REFERENCES motorisation_options(id) ON DELETE CASCADE,
  width_cm NUMERIC(6,1) NOT NULL,
  price_cents INTEGER NOT NULL,
  UNIQUE(motor_id, width_cm)
);

CREATE INDEX idx_motor_prices_lookup ON motorisation_prices(motor_id, width_cm);

CREATE TABLE markup_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type TEXT NOT NULL CHECK (scope_type IN ('global', 'category', 'type', 'range')),
  scope_id UUID,
  markup_percent NUMERIC(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(scope_type, scope_id)
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON markup_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed global default
INSERT INTO markup_config (scope_type, scope_id, markup_percent) VALUES ('global', NULL, 40.00);

-- Pricing settings (extends site_settings from migration 001)
INSERT INTO site_settings (key, value, value_type, category, label, description, is_public) VALUES
  ('global_markup_percent', '40', 'number', 'pricing', 'Default Markup %', 'Fallback markup on supplier prices', false),
  ('installation_fee_cents', '50000', 'number', 'pricing', 'Installation Fee', 'Per-blind installation fee (cents)', true),
  ('free_delivery_threshold_cents', '500000', 'number', 'pricing', 'Free Delivery Threshold', 'Free delivery above this amount (cents)', true),
  ('delivery_fee_cents', '50000', 'number', 'pricing', 'Delivery Fee', 'Standard delivery fee (cents)', true),
  ('vat_percent', '15', 'number', 'pricing', 'VAT %', 'South African VAT rate', true),
  ('currency', 'ZAR', 'text', 'pricing', 'Currency', 'Default currency code', true);

CREATE TABLE price_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  supplier TEXT NOT NULL DEFAULT 'shademaster',
  sheets_processed INTEGER DEFAULT 0,
  prices_created INTEGER DEFAULT 0,
  prices_updated INTEGER DEFAULT 0,
  prices_unchanged INTEGER DEFAULT 0,
  import_mode TEXT DEFAULT 'replace_all' CHECK (import_mode IN ('replace_all', 'update_changed')),
  imported_by UUID REFERENCES user_profiles(id),
  error_log JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE import_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier TEXT NOT NULL DEFAULT 'shademaster',
  sheet_name TEXT NOT NULL,
  maps_to_range_id UUID REFERENCES blind_ranges(id),
  parser_type TEXT NOT NULL DEFAULT 'standard_matrix' CHECK (parser_type IN ('standard_matrix', 'extras', 'mechanisms', 'motorisation', 'vertical')),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(supplier, sheet_name)
);
