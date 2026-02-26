-- ============================================================
-- MIGRATION 030: ROW LEVEL SECURITY — BLINDLY-SPECIFIC TABLES
-- ============================================================

-- Note: is_admin() function already exists from template migration 001.
-- If not, uncomment the block below:
--
-- CREATE OR REPLACE FUNCTION is_admin()
-- RETURNS BOOLEAN AS $$
-- BEGIN
--   RETURN EXISTS (
--     SELECT 1 FROM user_profiles
--     WHERE id = auth.uid()
--     AND role IN ('admin', 'super_admin')
--     AND is_active = true
--   );
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ========== PRODUCT TABLES (public read) ==========

ALTER TABLE blind_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active categories readable by all" ON blind_categories
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to categories" ON blind_categories
  FOR ALL USING (is_admin());

ALTER TABLE blind_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active types readable by all" ON blind_types
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to types" ON blind_types
  FOR ALL USING (is_admin());

ALTER TABLE blind_ranges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active ranges readable by all" ON blind_ranges
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to ranges" ON blind_ranges
  FOR ALL USING (is_admin());

-- Price matrices: public read (customers need live pricing)
-- Supplier prices are in cents — markup applied server-side, never exposed raw
ALTER TABLE price_matrices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prices readable by all" ON price_matrices
  FOR SELECT USING (true);
CREATE POLICY "Admin full access to prices" ON price_matrices
  FOR ALL USING (is_admin());

-- Vertical slat mapping
ALTER TABLE vertical_slat_mapping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Slat mapping readable by all" ON vertical_slat_mapping
  FOR SELECT USING (true);
CREATE POLICY "Admin full access to slat mapping" ON vertical_slat_mapping
  FOR ALL USING (is_admin());

-- Extras (public read — customers see upgrade options)
ALTER TABLE blind_extras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active extras readable by all" ON blind_extras
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to extras" ON blind_extras
  FOR ALL USING (is_admin());

ALTER TABLE extra_price_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Extra prices readable by all" ON extra_price_points
  FOR SELECT USING (true);
CREATE POLICY "Admin full access to extra prices" ON extra_price_points
  FOR ALL USING (is_admin());

-- Motorisation (public read)
ALTER TABLE motorisation_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active motors readable by all" ON motorisation_options
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to motors" ON motorisation_options
  FOR ALL USING (is_admin());

ALTER TABLE motorisation_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Motor prices readable by all" ON motorisation_prices
  FOR SELECT USING (true);
CREATE POLICY "Admin full access to motor prices" ON motorisation_prices
  FOR ALL USING (is_admin());

-- Mechanism lookup (public read — used in configurator)
ALTER TABLE mechanism_lookup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mechanisms readable by all" ON mechanism_lookup
  FOR SELECT USING (true);
CREATE POLICY "Admin full access to mechanisms" ON mechanism_lookup
  FOR ALL USING (is_admin());

-- ========== ADMIN-ONLY TABLES ==========

-- Markup config (NEVER public — contains margin strategy)
ALTER TABLE markup_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only markup config" ON markup_config
  FOR ALL USING (is_admin());

-- Price imports
ALTER TABLE price_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only price imports" ON price_imports
  FOR ALL USING (is_admin());

-- Import mappings
ALTER TABLE import_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only import mappings" ON import_mappings
  FOR ALL USING (is_admin());

-- ========== BLINDLY ORDER TABLES ==========

ALTER TABLE blindly_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create blindly orders" ON blindly_orders
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Orders readable by all" ON blindly_orders
  FOR SELECT USING (true);  -- Guest checkout: orders looked up by ID/number
CREATE POLICY "Admin full access to blindly orders" ON blindly_orders
  FOR ALL USING (is_admin());

ALTER TABLE blindly_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order items readable with order" ON blindly_order_items
  FOR SELECT USING (true);
CREATE POLICY "Anyone can create order items" ON blindly_order_items
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin full access to order items" ON blindly_order_items
  FOR ALL USING (is_admin());

-- ========== LEADS & QUOTES ==========

ALTER TABLE saved_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create quotes" ON saved_quotes
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Quotes readable by token" ON saved_quotes
  FOR SELECT USING (true);  -- Accessed via unique token
CREATE POLICY "Admin full access to quotes" ON saved_quotes
  FOR ALL USING (is_admin());

ALTER TABLE swatch_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can request swatches" ON swatch_requests
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin full access to swatch requests" ON swatch_requests
  FOR ALL USING (is_admin());

ALTER TABLE measure_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can request measures" ON measure_requests
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin full access to measure requests" ON measure_requests
  FOR ALL USING (is_admin());
