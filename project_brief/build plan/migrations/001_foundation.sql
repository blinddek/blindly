-- ============================================================
-- MIGRATION 001: UNIVERSAL YOROS FOUNDATION
-- Reusable across all Yoros projects
-- ============================================================

-- ---------------------
-- 1. SITE SETTINGS
-- ---------------------
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  value_type TEXT NOT NULL DEFAULT 'text',
  category TEXT NOT NULL DEFAULT 'general',
  label TEXT,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO site_settings (key, value, value_type, category, label, description) VALUES
  ('site_name', '', 'text', 'general', 'Site Name', 'Business/brand name'),
  ('site_tagline', '', 'text', 'general', 'Tagline', 'Short tagline or slogan'),
  ('site_description', '', 'text', 'general', 'Description', 'Site-wide meta description fallback'),
  ('logo_url', '', 'url', 'general', 'Logo', 'Primary logo URL'),
  ('logo_dark_url', '', 'url', 'general', 'Logo (Dark)', 'Logo variant for dark backgrounds'),
  ('favicon_url', '', 'url', 'general', 'Favicon', 'Favicon URL'),
  ('contact_email', '', 'email', 'contact', 'Email', 'Primary contact email'),
  ('contact_phone', '', 'text', 'contact', 'Phone', 'Primary contact number'),
  ('contact_whatsapp', '', 'text', 'contact', 'WhatsApp', 'WhatsApp number with country code'),
  ('contact_address', '', 'text', 'contact', 'Address', 'Physical address'),
  ('social_facebook', '', 'url', 'social', 'Facebook', 'Facebook page URL'),
  ('social_instagram', '', 'url', 'social', 'Instagram', 'Instagram profile URL'),
  ('social_linkedin', '', 'url', 'social', 'LinkedIn', 'LinkedIn page URL'),
  ('social_tiktok', '', 'url', 'social', 'TikTok', 'TikTok profile URL'),
  ('social_youtube', '', 'url', 'social', 'YouTube', 'YouTube channel URL'),
  ('seo_default_title', '', 'text', 'seo', 'Default Title', 'Fallback page title'),
  ('seo_default_description', '', 'text', 'seo', 'Default Description', 'Fallback meta description'),
  ('seo_og_image', '', 'url', 'seo', 'OG Image', 'Default Open Graph image URL'),
  ('google_analytics_id', '', 'text', 'seo', 'GA4 ID', 'Google Analytics 4 measurement ID'),
  ('google_search_console', '', 'text', 'seo', 'Search Console', 'Google Search Console verification code');

-- ---------------------
-- 2. NAVIGATION
-- ---------------------
CREATE TABLE navigation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL,
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  target TEXT DEFAULT '_self',
  parent_id UUID REFERENCES navigation_items(id),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------
-- 3. PAGES
-- ---------------------
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  seo_title TEXT,
  seo_description TEXT,
  og_image_url TEXT,
  content JSONB,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------
-- 4. USER PROFILES
-- ---------------------
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---------------------
-- 5. CONTACT SUBMISSIONS
-- ---------------------
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  source TEXT DEFAULT 'contact_form',
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------
-- 6. NEWSLETTER
-- ---------------------
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  source TEXT DEFAULT 'footer',
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

-- ---------------------
-- 7. MEDIA LIBRARY
-- ---------------------
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  alt_text TEXT,
  folder TEXT DEFAULT 'general',
  uploaded_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------
-- 8. ACTIVITY LOG
-- ---------------------
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);

-- ---------------------
-- 9. UPDATED_AT TRIGGER
-- ---------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON navigation_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
