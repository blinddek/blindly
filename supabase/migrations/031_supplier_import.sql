-- ============================================================
-- 031_supplier_import.sql — Supplier management + import mapping enhancements
-- ============================================================

-- ─── Suppliers Table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed existing supplier
INSERT INTO suppliers (name, slug) VALUES ('Shademaster', 'shademaster')
ON CONFLICT (slug) DO NOTHING;

-- ─── Enhance import_mappings ───────────────────────────────
ALTER TABLE import_mappings
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ─── RLS for suppliers ─────────────────────────────────────
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active suppliers"
  ON suppliers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage suppliers"
  ON suppliers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ─── RLS for import_mappings (admin only) ──────────────────
ALTER TABLE import_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage import mappings"
  ON import_mappings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );
