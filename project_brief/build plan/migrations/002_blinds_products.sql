-- ============================================================
-- MIGRATION 002: BLINDS PRODUCT CATALOGUE
-- Category → Type → Range → Price Matrix
-- ============================================================

CREATE TABLE blind_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON blind_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE blind_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES blind_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  slat_size_mm INTEGER,
  material TEXT,
  description TEXT,
  features JSONB DEFAULT '{}',
  min_width_cm NUMERIC(6,1) NOT NULL,
  max_width_cm NUMERIC(6,1) NOT NULL,
  min_drop_cm NUMERIC(6,1) NOT NULL,
  max_drop_cm NUMERIC(6,1) NOT NULL,
  min_frame_depth_mm INTEGER,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_blind_types_category ON blind_types(category_id);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON blind_types FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE blind_ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blind_type_id UUID NOT NULL REFERENCES blind_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  colour_options JSONB DEFAULT '[]',
  swatch_image_url TEXT,
  lifestyle_image_url TEXT,
  starting_price_cents INTEGER,
  supplier TEXT DEFAULT 'shademaster',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_blind_ranges_type ON blind_ranges(blind_type_id);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON blind_ranges FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE price_matrices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blind_range_id UUID NOT NULL REFERENCES blind_ranges(id) ON DELETE CASCADE,
  width_cm NUMERIC(6,1) NOT NULL,
  drop_cm NUMERIC(6,1) NOT NULL,
  supplier_price_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blind_range_id, width_cm, drop_cm)
);

CREATE INDEX idx_price_matrix_lookup ON price_matrices(blind_range_id, width_cm, drop_cm);
CREATE INDEX idx_price_matrix_widths ON price_matrices(blind_range_id, width_cm);
CREATE INDEX idx_price_matrix_drops ON price_matrices(blind_range_id, drop_cm);

CREATE TABLE vertical_slat_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blind_type_id UUID NOT NULL REFERENCES blind_types(id) ON DELETE CASCADE,
  width_cm NUMERIC(6,1) NOT NULL,
  slat_count INTEGER NOT NULL,
  UNIQUE(blind_type_id, width_cm)
);
