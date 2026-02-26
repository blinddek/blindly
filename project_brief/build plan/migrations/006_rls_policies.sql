-- ============================================================
-- MIGRATION 006: ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Helper function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ========== FOUNDATION TABLES ==========

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public settings readable by all" ON site_settings FOR SELECT USING (is_public = true);
CREATE POLICY "Admin full access to settings" ON site_settings FOR ALL USING (is_admin());

ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nav items readable by all" ON navigation_items FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to nav" ON navigation_items FOR ALL USING (is_admin());

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published pages readable by all" ON pages FOR SELECT USING (is_published = true);
CREATE POLICY "Admin full access to pages" ON pages FOR ALL USING (is_admin());

ALTER TABLE media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Media readable by all" ON media FOR SELECT USING (true);
CREATE POLICY "Admin full access to media" ON media FOR ALL USING (is_admin());

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON user_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON user_profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admin full access to profiles" ON user_profiles FOR ALL USING (is_admin());

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only activity log" ON activity_log FOR ALL USING (is_admin());

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact form" ON contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin full access to contacts" ON contact_submissions FOR ALL USING (is_admin());

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin full access to subscribers" ON newsletter_subscribers FOR ALL USING (is_admin());

-- ========== PRODUCT TABLES ==========

ALTER TABLE blind_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active categories readable by all" ON blind_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to categories" ON blind_categories FOR ALL USING (is_admin());

ALTER TABLE blind_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active types readable by all" ON blind_types FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to types" ON blind_types FOR ALL USING (is_admin());

ALTER TABLE blind_ranges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active ranges readable by all" ON blind_ranges FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to ranges" ON blind_ranges FOR ALL USING (is_admin());

ALTER TABLE price_matrices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prices readable by all" ON price_matrices FOR SELECT USING (true);
CREATE POLICY "Admin full access to prices" ON price_matrices FOR ALL USING (is_admin());

ALTER TABLE vertical_slat_mapping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Slat mapping readable by all" ON vertical_slat_mapping FOR SELECT USING (true);
CREATE POLICY "Admin full access to slat mapping" ON vertical_slat_mapping FOR ALL USING (is_admin());

-- ========== EXTRAS & PRICING ==========

ALTER TABLE blind_extras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active extras readable by all" ON blind_extras FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to extras" ON blind_extras FOR ALL USING (is_admin());

ALTER TABLE extra_price_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Extra prices readable by all" ON extra_price_points FOR SELECT USING (true);
CREATE POLICY "Admin full access to extra prices" ON extra_price_points FOR ALL USING (is_admin());

ALTER TABLE motorisation_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active motors readable by all" ON motorisation_options FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to motors" ON motorisation_options FOR ALL USING (is_admin());

ALTER TABLE motorisation_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Motor prices readable by all" ON motorisation_prices FOR SELECT USING (true);
CREATE POLICY "Admin full access to motor prices" ON motorisation_prices FOR ALL USING (is_admin());

ALTER TABLE mechanism_lookup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mechanisms readable by all" ON mechanism_lookup FOR SELECT USING (true);
CREATE POLICY "Admin full access to mechanisms" ON mechanism_lookup FOR ALL USING (is_admin());

ALTER TABLE markup_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only markup config" ON markup_config FOR ALL USING (is_admin());

ALTER TABLE price_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only price imports" ON price_imports FOR ALL USING (is_admin());

ALTER TABLE import_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only import mappings" ON import_mappings FOR ALL USING (is_admin());

-- ========== ORDERS ==========

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Orders readable by all" ON orders FOR SELECT USING (true);
CREATE POLICY "Admin full access to orders" ON orders FOR ALL USING (is_admin());

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order items readable with order" ON order_items FOR SELECT USING (true);
CREATE POLICY "Anyone can create order items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin full access to order items" ON order_items FOR ALL USING (is_admin());

-- ========== QUOTES & LEADS ==========

ALTER TABLE saved_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create quotes" ON saved_quotes FOR INSERT WITH CHECK (true);
CREATE POLICY "Quotes readable by token" ON saved_quotes FOR SELECT USING (true);
CREATE POLICY "Admin full access to quotes" ON saved_quotes FOR ALL USING (is_admin());

ALTER TABLE swatch_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can request swatches" ON swatch_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin full access to swatch requests" ON swatch_requests FOR ALL USING (is_admin());

ALTER TABLE measure_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can request measures" ON measure_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin full access to measure requests" ON measure_requests FOR ALL USING (is_admin());
