-- ============================================================
-- MIGRATION 026: BLINDS PRODUCT CATALOGUE
-- Product hierarchy: Category → Type → Range → Price Matrix
-- ============================================================

-- ---------------------
-- 1. BLIND CATEGORIES
-- Top-level: Roller, Aluminium Venetian, Wood Venetian, Vertical
-- ---------------------
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

-- ---------------------
-- 2. BLIND TYPES
-- Within category: 25mm Aluminium, 50mm Aluminium, 127mm Vertical, etc.
-- ---------------------
CREATE TABLE blind_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES blind_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  slat_size_mm INTEGER,                    -- 25, 50, 63, 90, 127; NULL for rollers
  material TEXT,                            -- 'aluminium', 'wood', 'bamboo', 'pvc', 'fabric'
  description TEXT,
  features JSONB DEFAULT '{}',             -- {"light_filtering": true, "moisture_resistant": false}
  min_width_cm NUMERIC(6,1) NOT NULL,
  max_width_cm NUMERIC(6,1) NOT NULL,
  min_drop_cm NUMERIC(6,1) NOT NULL,
  max_drop_cm NUMERIC(6,1) NOT NULL,
  min_frame_depth_mm INTEGER,              -- For inside mount depth warning
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_blind_types_category ON blind_types(category_id);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON blind_types FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------
-- 3. BLIND RANGES
-- Within type: Plain & Designer, Beach, Cedar, etc.
-- Each range maps to ONE Shademaster price sheet
-- ---------------------
CREATE TABLE blind_ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blind_type_id UUID NOT NULL REFERENCES blind_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  colour_options JSONB DEFAULT '[]',       -- [{"name":"White","hex":"#FFF","swatch_url":"..."}]
  swatch_image_url TEXT,
  lifestyle_image_url TEXT,
  starting_price_cents INTEGER,            -- Cached: lowest customer price for "from R..." display
  supplier TEXT DEFAULT 'shademaster',     -- Future: support multiple suppliers
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_blind_ranges_type ON blind_ranges(blind_type_id);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON blind_ranges FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------
-- 4. PRICE MATRICES
-- The big table: Width × Drop → Supplier Price per Range
-- ~15,000–20,000 rows for current Shademaster data
-- ---------------------
CREATE TABLE price_matrices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blind_range_id UUID NOT NULL REFERENCES blind_ranges(id) ON DELETE CASCADE,
  width_cm NUMERIC(6,1) NOT NULL,
  drop_cm NUMERIC(6,1) NOT NULL,
  supplier_price_cents INTEGER NOT NULL,   -- Supplier cost in ZAR cents
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(blind_range_id, width_cm, drop_cm)
);

-- Primary lookup index — this is the hot path
CREATE INDEX idx_price_matrix_lookup
  ON price_matrices(blind_range_id, width_cm, drop_cm);

-- For finding available grid points per range
CREATE INDEX idx_price_matrix_widths
  ON price_matrices(blind_range_id, width_cm);
CREATE INDEX idx_price_matrix_drops
  ON price_matrices(blind_range_id, drop_cm);

-- ---------------------
-- 5. VERTICAL BLIND SLAT MAPPING
-- Maps width_cm → slat count (non-uniform increments)
-- ---------------------
CREATE TABLE vertical_slat_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blind_type_id UUID NOT NULL REFERENCES blind_types(id) ON DELETE CASCADE,
  width_cm NUMERIC(6,1) NOT NULL,
  slat_count INTEGER NOT NULL,

  UNIQUE(blind_type_id, width_cm)
);
