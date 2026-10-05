# BLINDLY — Build Index

> **Purpose:** Each numbered build is a self-contained task for Claude Code.
> Feed one build at a time. Each includes context, deliverables, and acceptance criteria.
> Migrations are split: universal Yoros foundation first, then Blindly-specific.

---

## Build Overview

| Build | Name | Type | Est. Time | Dependencies |
|-------|------|------|-----------|--------------|
| 01 | Project Scaffold | Setup | 30 min | None |
| 02 | Universal Database Foundation | Migration | 45 min | 01 |
| 03 | Blinds Product Schema | Migration | 30 min | 02 |
| 04 | Pricing & Markup Schema | Migration | 30 min | 03 |
| 05 | Orders & Checkout Schema | Migration | 30 min | 04 |
| 06 | Quotes & Leads Schema | Migration | 20 min | 05 |
| 07 | RLS Policies & Indexes | Migration | 30 min | 06 |
| 08 | XLS Parser Engine | Backend | 2–3 hrs | 07 |
| 09 | Seed Data Import | Backend | 1–2 hrs | 08 |
| 10 | Price Lookup Engine | Backend | 1–2 hrs | 09 |
| 11 | Admin: Auth & Layout | Frontend | 1–2 hrs | 07 |
| 12 | Admin: Price Import UI | Frontend | 2–3 hrs | 08, 11 |
| 13 | Admin: Product Management | Frontend | 2–3 hrs | 11 |
| 14 | Admin: Markup & Pricing Config | Frontend | 1–2 hrs | 10, 11 |
| 15 | Configurator: Steps 1–5 | Frontend | 3–4 hrs | 10 |
| 16 | Configurator: Steps 6–7 (Measurements + Multi-Window) | Frontend | 3–4 hrs | 15 |
| 17 | Cart & Accessories Upsell | Frontend | 2–3 hrs | 16 |
| 18 | Quote Save & Share | Full-stack | 2–3 hrs | 17 |
| 19 | Checkout & Paystack | Full-stack | 2–3 hrs | 17 |
| 20 | Order Emails & Confirmation | Full-stack | 1–2 hrs | 19 |
| 21 | Admin: Order Management | Frontend | 2–3 hrs | 19, 11 |
| 22 | Admin: Supplier PDF Generation | Backend | 1–2 hrs | 21 |
| 23 | Admin: Quotes & Leads Management | Frontend | 1–2 hrs | 18, 11 |
| 24 | Public Pages: Homepage & Layout | Frontend | 2–3 hrs | 02 |
| 25 | Public Pages: Product Browse | Frontend | 2–3 hrs | 10, 24 |
| 26 | Public Pages: About, Contact, FAQ, Gallery | Frontend | 2–3 hrs | 24 |
| 27 | SEO, Sitemap, Structured Data | Full-stack | 1–2 hrs | 24–26 |
| 28 | Room Preview (Stretch Goal) | Frontend | 3–4 hrs | 16 |
| 29 | Final Polish, Performance Audit, Launch Prep | QA | 2–3 hrs | All |

---

## MIGRATIONS

### Migration 001 — Universal Yoros Foundation
**Reuse:** ✅ Every project
**File:** `supabase/migrations/001_foundation.sql`

```sql
-- ============================================================
-- MIGRATION 001: UNIVERSAL YOROS FOUNDATION
-- Reusable across all Yoros projects
-- ============================================================

-- ---------------------
-- 1. SITE SETTINGS
-- Key-value store for all site-wide configuration
-- ---------------------
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  value_type TEXT NOT NULL DEFAULT 'text',  -- 'text', 'number', 'boolean', 'json', 'url', 'email'
  category TEXT NOT NULL DEFAULT 'general', -- 'general', 'contact', 'social', 'seo', 'email', 'legal'
  label TEXT,                               -- Human-readable label for admin UI
  description TEXT,
  is_public BOOLEAN DEFAULT true,           -- false = admin-only (API keys, secrets)
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed essential settings
INSERT INTO site_settings (key, value, value_type, category, label, description) VALUES
  -- General
  ('site_name', '', 'text', 'general', 'Site Name', 'Business/brand name'),
  ('site_tagline', '', 'text', 'general', 'Tagline', 'Short tagline or slogan'),
  ('site_description', '', 'text', 'general', 'Description', 'Site-wide meta description fallback'),
  ('logo_url', '', 'url', 'general', 'Logo', 'Primary logo URL'),
  ('logo_dark_url', '', 'url', 'general', 'Logo (Dark)', 'Logo variant for dark backgrounds'),
  ('favicon_url', '', 'url', 'general', 'Favicon', 'Favicon URL'),
  -- Contact
  ('contact_email', '', 'email', 'contact', 'Email', 'Primary contact email'),
  ('contact_phone', '', 'text', 'contact', 'Phone', 'Primary contact number'),
  ('contact_whatsapp', '', 'text', 'contact', 'WhatsApp', 'WhatsApp number with country code'),
  ('contact_address', '', 'text', 'contact', 'Address', 'Physical address'),
  -- Social
  ('social_facebook', '', 'url', 'social', 'Facebook', 'Facebook page URL'),
  ('social_instagram', '', 'url', 'social', 'Instagram', 'Instagram profile URL'),
  ('social_linkedin', '', 'url', 'social', 'LinkedIn', 'LinkedIn page URL'),
  ('social_tiktok', '', 'url', 'social', 'TikTok', 'TikTok profile URL'),
  ('social_youtube', '', 'url', 'social', 'YouTube', 'YouTube channel URL'),
  -- SEO
  ('seo_default_title', '', 'text', 'seo', 'Default Title', 'Fallback page title'),
  ('seo_default_description', '', 'text', 'seo', 'Default Description', 'Fallback meta description'),
  ('seo_og_image', '', 'url', 'seo', 'OG Image', 'Default Open Graph image URL'),
  ('google_analytics_id', '', 'text', 'seo', 'GA4 ID', 'Google Analytics 4 measurement ID'),
  ('google_search_console', '', 'text', 'seo', 'Search Console', 'Google Search Console verification code');

-- ---------------------
-- 2. NAVIGATION
-- Admin-manageable nav items
-- ---------------------
CREATE TABLE navigation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL,             -- 'header', 'footer', 'footer_legal', 'mobile'
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  target TEXT DEFAULT '_self',        -- '_self', '_blank'
  parent_id UUID REFERENCES navigation_items(id),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------
-- 3. PAGES (dynamic SEO + content)
-- ---------------------
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,          -- 'about', 'contact', 'faq'
  title TEXT NOT NULL,
  seo_title TEXT,
  seo_description TEXT,
  og_image_url TEXT,
  content JSONB,                      -- Flexible content blocks
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------
-- 4. USER PROFILES
-- Auto-created on signup via trigger
-- ---------------------
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user',  -- 'user', 'admin', 'super_admin'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger: auto-create profile on signup
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
-- 5. CONTACT SUBMISSIONS / LEADS
-- ---------------------
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  source TEXT DEFAULT 'contact_form', -- 'contact_form', 'footer', 'popup', etc.
  metadata JSONB,                     -- Any extra fields
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------
-- 6. NEWSLETTER SUBSCRIBERS
-- ---------------------
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'unsubscribed'
  source TEXT DEFAULT 'footer',          -- 'footer', 'popup', 'checkout'
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

-- ---------------------
-- 7. MEDIA LIBRARY
-- ---------------------
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,          -- Supabase Storage path
  url TEXT NOT NULL,                   -- Public URL
  mime_type TEXT,
  size_bytes INTEGER,
  alt_text TEXT,
  folder TEXT DEFAULT 'general',       -- Logical grouping
  uploaded_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------
-- 8. ACTIVITY LOG
-- ---------------------
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  action TEXT NOT NULL,                -- 'create', 'update', 'delete', 'import', 'login'
  entity_type TEXT,                    -- 'order', 'product', 'price_import', etc.
  entity_id UUID,
  details JSONB,                       -- What changed
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);

-- ---------------------
-- 9. UPDATED_AT TRIGGER (reusable)
-- ---------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to foundation tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON navigation_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

### Migration 002 — Blinds Product Catalogue
**Reuse:** 🔶 Adaptable (category → type → range → matrix pattern works for decking, flooring, any dimension-priced product)
**File:** `supabase/migrations/002_blinds_products.sql`

```sql
-- ============================================================
-- MIGRATION 002: BLINDS PRODUCT CATALOGUE
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
```

---

### Migration 003 — Extras, Motorisation & Pricing Config
**Reuse:** 🔶 Extras pattern reusable; motorisation is Blindly-specific
**File:** `supabase/migrations/003_pricing_config.sql`

```sql
-- ============================================================
-- MIGRATION 003: EXTRAS, MOTORISATION & PRICING CONFIGURATION
-- ============================================================

-- ---------------------
-- 1. BLIND EXTRAS / ACCESSORIES
-- Chain upgrades, valances, cassettes, side guides
-- ---------------------
CREATE TABLE blind_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  applies_to_categories UUID[],            -- Which categories; NULL = all
  applies_to_types UUID[],                 -- Which types; NULL = all in matching categories
  pricing_type TEXT NOT NULL               -- 'fixed', 'width_based', 'per_unit'
    CHECK (pricing_type IN ('fixed', 'width_based', 'per_unit')),
  fixed_price_cents INTEGER,               -- For 'fixed' and 'per_unit' types
  max_width_cm NUMERIC(6,1),               -- NULL = no limit
  is_upgrade BOOLEAN DEFAULT false,        -- true = replaces standard component
  replaces_extra_id UUID REFERENCES blind_extras(id),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON blind_extras FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------
-- 2. EXTRA PRICE POINTS
-- Width-based pricing for 'width_based' extras
-- ---------------------
CREATE TABLE extra_price_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extra_id UUID NOT NULL REFERENCES blind_extras(id) ON DELETE CASCADE,
  width_cm NUMERIC(6,1) NOT NULL,
  price_cents INTEGER NOT NULL,

  UNIQUE(extra_id, width_cm)
);

CREATE INDEX idx_extra_prices_lookup ON extra_price_points(extra_id, width_cm);

-- ---------------------
-- 3. MECHANISM LOOKUP
-- Roller blinds: Width × Drop → Required tube diameter
-- Used to determine which upgrades/motors are compatible
-- ---------------------
CREATE TABLE mechanism_lookup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  width_cm NUMERIC(6,1) NOT NULL,
  drop_cm NUMERIC(6,1) NOT NULL,
  tube_size TEXT NOT NULL,                 -- '32', '40', '45', '45HD', '55 + EL'

  UNIQUE(width_cm, drop_cm)
);

CREATE INDEX idx_mechanism_lookup ON mechanism_lookup(width_cm, drop_cm);

-- ---------------------
-- 4. MOTORISATION OPTIONS
-- Somfy, One Touch, etc.
-- ---------------------
CREATE TABLE motorisation_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  tube_size_mm INTEGER,                    -- Required tube diameter
  description TEXT,
  is_rechargeable BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON motorisation_options FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------
-- 5. MOTORISATION PRICING
-- Width-based pricing per motor option
-- ---------------------
CREATE TABLE motorisation_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motor_id UUID NOT NULL REFERENCES motorisation_options(id) ON DELETE CASCADE,
  width_cm NUMERIC(6,1) NOT NULL,
  price_cents INTEGER NOT NULL,

  UNIQUE(motor_id, width_cm)
);

CREATE INDEX idx_motor_prices_lookup ON motorisation_prices(motor_id, width_cm);

-- ---------------------
-- 6. MARKUP CONFIGURATION
-- Cascading: range → type → category → global
-- ---------------------
CREATE TABLE markup_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type TEXT NOT NULL                 -- 'global', 'category', 'type', 'range'
    CHECK (scope_type IN ('global', 'category', 'type', 'range')),
  scope_id UUID,                           -- NULL for global; FK for others (not enforced — polymorphic)
  markup_percent NUMERIC(5,2) NOT NULL,    -- e.g. 40.00 = 40%
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(scope_type, scope_id)
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON markup_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed global default
INSERT INTO markup_config (scope_type, scope_id, markup_percent) VALUES
  ('global', NULL, 40.00);

-- ---------------------
-- 7. PRICING SETTINGS
-- Delivery, installation, VAT, etc.
-- ---------------------
INSERT INTO site_settings (key, value, value_type, category, label, description, is_public) VALUES
  ('global_markup_percent', '40', 'number', 'pricing', 'Default Markup %', 'Fallback markup on supplier prices', false),
  ('installation_fee_cents', '50000', 'number', 'pricing', 'Installation Fee', 'Per-blind installation fee (cents)', true),
  ('free_delivery_threshold_cents', '500000', 'number', 'pricing', 'Free Delivery Threshold', 'Free delivery above this amount (cents)', true),
  ('delivery_fee_cents', '50000', 'number', 'pricing', 'Delivery Fee', 'Standard delivery fee (cents)', true),
  ('vat_percent', '15', 'number', 'pricing', 'VAT %', 'South African VAT rate', true),
  ('currency', 'ZAR', 'text', 'pricing', 'Currency', 'Default currency code', true);

-- ---------------------
-- 8. IMPORT TRACKING
-- ---------------------
CREATE TABLE price_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  supplier TEXT NOT NULL DEFAULT 'shademaster',
  sheets_processed INTEGER DEFAULT 0,
  prices_created INTEGER DEFAULT 0,
  prices_updated INTEGER DEFAULT 0,
  prices_unchanged INTEGER DEFAULT 0,
  import_mode TEXT DEFAULT 'replace_all'   -- 'replace_all', 'update_changed'
    CHECK (import_mode IN ('replace_all', 'update_changed')),
  imported_by UUID REFERENCES user_profiles(id),
  error_log JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------
-- 9. IMPORT MAPPINGS
-- Sheet name → Range mapping (saved per supplier for re-imports)
-- ---------------------
CREATE TABLE import_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier TEXT NOT NULL DEFAULT 'shademaster',
  sheet_name TEXT NOT NULL,
  maps_to_range_id UUID REFERENCES blind_ranges(id),
  parser_type TEXT NOT NULL DEFAULT 'standard_matrix'
    CHECK (parser_type IN ('standard_matrix', 'extras', 'mechanisms', 'motorisation', 'vertical')),
  is_active BOOLEAN DEFAULT true,

  UNIQUE(supplier, sheet_name)
);
```

---

### Migration 004 — Orders & Checkout
**Reuse:** 🔶 Order structure adaptable; line items are Blindly-specific
**File:** `supabase/migrations/004_orders.sql`

```sql
-- ============================================================
-- MIGRATION 004: ORDERS & CHECKOUT
-- ============================================================

-- ---------------------
-- 1. ORDERS
-- ---------------------
CREATE TABLE orders (
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

CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_payment ON orders(payment_status);
CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------
-- 2. ORDER ITEMS
-- One row per blind in the order
-- ---------------------
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
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

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ---------------------
-- 3. ORDER NUMBER SEQUENCE
-- Auto-generate BL-YYYY-NNNN format
-- ---------------------
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
```

---

### Migration 005 — Quotes & Leads
**Reuse:** 🔶 Quote save/share pattern reusable; lead tables adaptable
**File:** `supabase/migrations/005_quotes_leads.sql`

```sql
-- ============================================================
-- MIGRATION 005: QUOTES, SWATCH REQUESTS & LEAD CAPTURE
-- ============================================================

-- ---------------------
-- 1. SAVED QUOTES (Abandoned Cart Recovery)
-- ---------------------
CREATE TABLE saved_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_token TEXT UNIQUE NOT NULL,        -- For shareable URL: /quote/[token]
  customer_email TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  cart_data JSONB NOT NULL,                -- Full cart snapshot (all configured blinds)
  total_cents INTEGER NOT NULL,

  -- Follow-up tracking
  email_sent_24h BOOLEAN DEFAULT false,
  email_sent_72h BOOLEAN DEFAULT false,
  email_sent_7d BOOLEAN DEFAULT false,
  converted_to_order_id UUID REFERENCES orders(id),

  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_saved_quotes_token ON saved_quotes(quote_token);
CREATE INDEX idx_saved_quotes_email ON saved_quotes(customer_email);
CREATE INDEX idx_saved_quotes_created ON saved_quotes(created_at DESC);

-- ---------------------
-- 2. SWATCH REQUESTS
-- Free sample lead capture from colour selection step
-- ---------------------
CREATE TABLE swatch_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  delivery_address JSONB NOT NULL,         -- {street, city, province, postal_code}
  blind_range_id UUID REFERENCES blind_ranges(id),
  colour TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'sent', 'delivered')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON swatch_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------
-- 3. MEASURE REQUESTS
-- Professional measurement lead capture
-- ---------------------
CREATE TABLE measure_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  address JSONB,                           -- {street, city, province, postal_code}
  preferred_method TEXT DEFAULT 'in_person'
    CHECK (preferred_method IN ('in_person', 'virtual')),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'scheduled', 'completed', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON measure_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

### Migration 006 — RLS Policies
**Reuse:** ✅ Pattern reusable (swap table names)
**File:** `supabase/migrations/006_rls_policies.sql`

```sql
-- ============================================================
-- MIGRATION 006: ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Helper: check if current user is admin
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

-- ========== PUBLIC READ TABLES ==========
-- These tables are readable by anyone (anon + authenticated)

-- Site Settings (public ones only)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public settings readable by all" ON site_settings
  FOR SELECT USING (is_public = true);
CREATE POLICY "Admin full access to settings" ON site_settings
  FOR ALL USING (is_admin());

-- Navigation
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nav items readable by all" ON navigation_items
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to nav" ON navigation_items
  FOR ALL USING (is_admin());

-- Pages
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published pages readable by all" ON pages
  FOR SELECT USING (is_published = true);
CREATE POLICY "Admin full access to pages" ON pages
  FOR ALL USING (is_admin());

-- Media
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Media readable by all" ON media
  FOR SELECT USING (true);
CREATE POLICY "Admin full access to media" ON media
  FOR ALL USING (is_admin());

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

-- User profiles (own profile or admin)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON user_profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admin full access to profiles" ON user_profiles
  FOR ALL USING (is_admin());

-- Activity log
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only activity log" ON activity_log
  FOR ALL USING (is_admin());

-- ========== ORDER TABLES ==========
-- Orders: insert by anon (guest checkout), read/update by admin

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Customers read own orders by email" ON orders
  FOR SELECT USING (true);  -- Order lookup by ID/number is public (guest checkout)
CREATE POLICY "Admin full access to orders" ON orders
  FOR ALL USING (is_admin());

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order items readable with order" ON order_items
  FOR SELECT USING (true);
CREATE POLICY "Anyone can create order items" ON order_items
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin full access to order items" ON order_items
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

-- Contact submissions & newsletter (from foundation)
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact form" ON contact_submissions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin full access to contacts" ON contact_submissions
  FOR ALL USING (is_admin());

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin full access to subscribers" ON newsletter_subscribers
  FOR ALL USING (is_admin());
```

---

## BUILD INSTRUCTIONS

> Each build below will become its own file: `build_01.md`, `build_02.md`, etc.
> Feed one at a time to Claude Code with the relevant migration SQL and context.

### Build 01 — Project Scaffold
**Feed to Claude Code with:** YOROS_UNIVERSAL_PROJECT_BRIEF.md

**Deliverables:**
- `npx create-next-app@latest blindly --typescript --tailwind --app --src-dir`
- Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `shadcn/ui`, `lucide-react`, `sonner`, `xlsx`, `resend`, `@react-email/components`
- Supabase client setup (`lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`)
- Middleware with auth session refresh + route protection (`/admin/*` → admin only)
- Environment variables template (`.env.example`)
- Folder structure: `src/app/(public)`, `src/app/(admin)`, `src/app/api`, `src/components`, `src/lib`, `src/types`
- Tailwind config with Blindly brand tokens (placeholder colours until brand is finalised)
- shadcn/ui init + install core components (button, input, card, dialog, table, tabs, select, checkbox, toast)
- Dark mode setup (toggle + system preference + no flash)
- `supabase/migrations/` folder ready

**Acceptance:** `npm run build` passes. Supabase client connects. Middleware redirects unauthenticated users from `/admin`. Dark mode toggle works.

---

### Build 02 — Universal Database Foundation
**Feed to Claude Code with:** Migration 001 SQL

**Deliverables:**
- Create `supabase/migrations/001_foundation.sql`
- Run migration against Supabase project
- TypeScript types for all foundation tables (`src/types/database.ts`)
- Server actions for site_settings CRUD (`src/lib/actions/settings.ts`)
- Verify: seed settings exist, trigger creates profile on user signup

**Acceptance:** All tables created. `site_settings` seeded. New auth user auto-creates `user_profiles` row. Types generated.

---

### Build 03 — Blinds Product Schema
**Feed to Claude Code with:** Migration 002 SQL + Shademaster data analysis from TECHNICAL_DESIGN.md §1

**Deliverables:**
- Create `supabase/migrations/002_blinds_products.sql`
- Run migration
- TypeScript types for product tables
- Server actions for category/type/range CRUD

**Acceptance:** All tables created. Indexes verified. Types match schema.

---

### Build 04 — Pricing & Extras Schema
**Feed to Claude Code with:** Migration 003 SQL

**Deliverables:**
- Create `supabase/migrations/003_pricing_config.sql`
- Run migration
- TypeScript types for pricing tables
- Pricing settings seeded in site_settings

**Acceptance:** All tables created. Global markup seeded at 40%. Pricing settings in site_settings.

---

### Build 05 — Orders & Checkout Schema
**Feed to Claude Code with:** Migration 004 SQL

**Deliverables:**
- Create `supabase/migrations/004_orders.sql`
- Run migration
- TypeScript types for order tables
- Verify order number auto-generation: insert with empty order_number → get 'BL-2026-0001'

**Acceptance:** Tables created. Order number sequence works. Indexes verified.

---

### Build 06 — Quotes & Leads Schema
**Feed to Claude Code with:** Migration 005 SQL

**Deliverables:**
- Create `supabase/migrations/005_quotes_leads.sql`
- Run migration
- TypeScript types for quote/lead tables

**Acceptance:** All tables created. Triggers work. Types match.

---

### Build 07 — RLS Policies
**Feed to Claude Code with:** Migration 006 SQL

**Deliverables:**
- Create `supabase/migrations/006_rls_policies.sql`
- Run migration
- Create admin user in Supabase Auth (for testing)
- Verify: anon can read active categories but NOT markup_config
- Verify: admin can read/write all tables
- Verify: anon can insert orders and contact_submissions

**Acceptance:** All RLS policies active. Anon reads public data. Admin has full access. Markup config hidden from public. Guest checkout insert works.

---

### Build 08 — XLS Parser Engine
**Feed to Claude Code with:** TECHNICAL_DESIGN.md §4 (XLS Import Engine) + sample XLS files

**Deliverables:**
- `src/lib/parsers/shademaster.ts` — main parser orchestrator
- `src/lib/parsers/standard-matrix.ts` — standard width × drop grid parser
- `src/lib/parsers/extras.ts` — roller blind extras parser
- `src/lib/parsers/mechanisms.ts` — tube size lookup parser
- `src/lib/parsers/motorisation.ts` — motor options parser
- `src/lib/parsers/vertical.ts` — vertical blind parser (slat count + non-uniform widths)
- Unit tests: parse each Shademaster XLS file, verify row/column counts match expected
- Auto-detection: given a sheet, determine which parser to use

**Acceptance:** All 6 Shademaster XLS files parse successfully. Each parser returns structured data. Extras, mechanisms, motorisation parse correctly. Vertical 90mm sheet (907×94) handles without timeout.

---

### Build 09 — Seed Data Import
**Feed to Claude Code with:** Build 08 parsers + all Shademaster XLS files

**Deliverables:**
- `src/lib/import/seed.ts` — script to seed all Shademaster data
- Creates all blind_categories (4): Roller, Aluminium Venetian, Wood/Bamboo/PVC Venetian, Vertical
- Creates all blind_types with correct min/max dimensions and slat sizes
- Creates all blind_ranges mapped to correct types
- Imports all ~40 price matrix sheets into price_matrices table
- Imports extras, mechanisms, motorisation data
- Imports vertical slat mappings
- Creates default import_mappings for all sheet names
- Summary output: X categories, X types, X ranges, X prices imported

**Acceptance:** Database fully seeded. Spot-check 10 random prices against source XLS files — all match. Total price_matrices rows within expected range (15,000–20,000). All ranges have correct type → category chain.

---

### Build 10 — Price Lookup Engine
**Feed to Claude Code with:** TECHNICAL_DESIGN.md §3 (Price Lookup Engine)

**Deliverables:**
- `src/lib/pricing/lookup.ts` — core price lookup (range_id + width_mm + drop_mm + mount_type → price)
- `src/lib/pricing/markup.ts` — cascading markup resolver (range → type → category → global)
- `src/lib/pricing/extras.ts` — extras price calculator (fixed / width-based / per-unit)
- `src/lib/pricing/motorisation.ts` — motor price with mechanism cross-reference
- `POST /api/blinds/price` — public endpoint for live pricing
- `POST /api/blinds/extras` — public endpoint for applicable extras + prices
- Unit tests: verify round-up (outside) and round-down (inside) logic
- Unit tests: verify markup cascade (range override beats global)
- Unit tests: verify extras pricing for all 3 types

**Acceptance:** Price lookup returns correct supplier price + customer price for known test dimensions. Mount type rounding works correctly. Markup cascade returns correct level. Extras calculate properly. API response < 100ms.

---

### Build 11 — Admin: Auth & Layout
**Feed to Claude Code with:** YOROS_UNIVERSAL_PROJECT_BRIEF.md §7 (Admin Panel)

**Deliverables:**
- `/admin/login` page (email + password, Supabase Auth)
- Admin layout: sidebar nav + top bar + main content area
- Sidebar items: Dashboard, Products, Pricing, Import, Orders, Quotes, Leads, Settings
- `/admin` dashboard: placeholder stats cards (orders today, revenue, pending quotes, pending leads)
- Settings page: CRUD for all site_settings grouped by category
- Media library page: upload to Supabase Storage, list/delete/copy-URL
- Activity log viewer (filterable table)
- Role check in middleware: non-admin → redirect to login

**Acceptance:** Admin login works. Sidebar navigation renders all items. Settings page loads and saves values. Media upload works. Non-admin users redirected.

---

### Build 12 — Admin: Price Import UI
**Feed to Claude Code with:** Build 08 parsers + TECHNICAL_DESIGN.md §4.3 (Import UI Flow)

**Deliverables:**
- `/admin/products/import` page
- File upload drop zone (accepts .xls, .xlsx)
- On upload: run parser, show preview screen (sheets found, prices per sheet, new/changed/unchanged counts)
- Sheet-to-range mapper: admin can override auto-detected mapping
- Import mode toggle: "Replace All" vs "Update Changed"
- Confirm button → writes to database
- Import history table (from price_imports)
- Error handling: malformed sheets, missing data, parser failures

**Acceptance:** Upload any Shademaster XLS → preview shows correct sheet count and price totals. Confirm writes to DB. Import log created. Re-import with "Update Changed" only modifies changed prices.

---

### Build 13 — Admin: Product Management
**Feed to Claude Code with:** Database schema for blind_categories, blind_types, blind_ranges

**Deliverables:**
- `/admin/products` — tabbed view: Categories | Types | Ranges
- Category CRUD: name, slug, description, image, display_order, active toggle
- Type CRUD: name, slug, category select, slat size, material, dimensions, frame depth, features JSON, image, active toggle
- Range CRUD: name, slug, type select, description, colour options editor (add/remove colours with name + hex + swatch), images, active toggle
- Colour options: inline editor with colour picker + swatch image upload
- All lists: search, sort, pagination, bulk active/inactive toggle

**Acceptance:** Full CRUD works for all three levels. Colour options save and load correctly. Image uploads work. Slug auto-generated from name. Display order drag-and-drop or manual.

---

### Build 14 — Admin: Markup & Pricing Config
**Feed to Claude Code with:** Markup cascade logic from Build 10

**Deliverables:**
- `/admin/pricing` page
- Global markup editor (single value)
- Per-category markup overrides (table: category name | markup % | active toggle)
- Per-type markup overrides
- Per-range markup overrides
- Visual cascade display: for any range, show "Effective markup: X% (from [level])"
- Pricing settings editor: delivery fee, free delivery threshold, installation fee, VAT
- Price simulator: select a range + enter dimensions → shows supplier price, markup, customer price

**Acceptance:** Markup values save and load. Cascade displays correct effective level. Price simulator matches Build 10 API output. Settings update correctly.

---

### Build 15 — Configurator: Steps 1–5
**Feed to Claude Code with:** PROJECT_BRIEF.md §3 (Steps 1–5) + product data from DB

**Deliverables:**
- `/configure` route with step-based wizard
- Step 1: Blind type cards (fetched from blind_categories)
- Step 2: Inside mount / Outside mount selector with visual diagrams
- Step 3: Thickness / slat size selector (filtered by Step 1). Inside mount depth warning + confirmation checkbox.
- Step 4: Range selector (filtered by Step 1 + 3). Cards with swatch, name, "from R..." starting price
- Step 5: Colour selector (swatches from range's colour_options). Colour disclaimer + confirmation checkbox. "Request free swatch" button → modal form
- Wizard state management (React context or URL state)
- Back/forward navigation between steps
- Progress indicator
- Responsive: works on mobile

**Acceptance:** Full flow from Step 1 → 5 works. Filtering is correct (selecting Roller skips Step 3). Checkboxes block progression until confirmed. Swatch request form submits to swatch_requests table. Responsive on mobile.

---

### Build 16 — Configurator: Steps 6–7 (Measurements + Multi-Window)
**Feed to Claude Code with:** PROJECT_BRIEF.md §3 (Steps 6–7) + Price Lookup API

**Deliverables:**
- Step 6: Width + Drop inputs (mm), location label input
- Live price calculation: debounced API call on input change, shows price updating in real time
- Validation: inside mount → warn if exceeds max; outside mount → warn if below min
- Matched grid point display: "Your blind will be made to [X]cm × [Y]cm"
- Self-measurement disclaimer checkbox
- "Request professional measure" link → modal form → measure_requests table
- Step 7: Review summary card
- "Add same blind, different size" → return to Step 6 with config preserved
- "Add different blind" → return to Step 1
- "View Cart" → navigate to /cart
- Cart state management (persist across navigation, localStorage backup)

**Acceptance:** Price updates live as dimensions change. Rounding logic matches mount type. Multi-window flow works: add 3 blinds (2 same config different sizes, 1 different type). Cart persists across page refreshes. Measure request saves to DB.

---

### Build 17 — Cart & Accessories Upsell
**Feed to Claude Code with:** PROJECT_BRIEF.md §3 (Steps 8) + Extras pricing API

**Deliverables:**
- `/cart` page
- Cart table: all configured blinds with location, type, range, colour, size, price
- Edit/remove items
- Accessories section per blind item:
  - Fetch applicable extras based on blind type + width
  - Show upgrade cards with price difference and toggle/add button
  - For roller blinds: show motorisation options (filtered by mechanism/tube size)
- Running total updates live as accessories are added/removed
- Cart summary: subtotal, extras total, estimated delivery, estimated total
- Continue to checkout button
- Empty cart state

**Acceptance:** Cart displays all items correctly. Extras filter correctly per blind type. Motorisation only shows for rollers. Prices update as extras toggle. Cart total is accurate. Items can be edited/removed.

---

### Build 18 — Quote Save & Share
**Feed to Claude Code with:** PROJECT_BRIEF.md §3 (Step 9) + saved_quotes schema

**Deliverables:**
- "Email me this quote" button on cart page
- Modal: capture email + name (optional phone)
- Generate unique quote_token, save cart_data snapshot to saved_quotes
- Send quote email via Resend: formatted summary of all blinds + total + restore link
- "Share this quote" → generate shareable URL `/quote/[token]`
- `/quote/[token]` page: restores full cart from saved_quotes, "Continue to checkout" button
- Quote expiry handling (30 days)
- PDF download option (formatted quote document)

**Acceptance:** Save quote creates DB record. Email sends with correct data and restore link. Restore link loads cart correctly. PDF generates cleanly. Expired quotes show friendly message.

---

### Build 19 — Checkout & Paystack
**Feed to Claude Code with:** PROJECT_BRIEF.md §3 (Steps 10–11) + orders schema

**Deliverables:**
- `/checkout` page
- Step 10: Delivery type selector (self-install vs professional install)
  - Free delivery threshold logic
  - Installation fee calculation (per blind)
  - Cross-sell interest checkbox
- Step 11: Customer details form (name, email, phone, address)
- Order summary with final totals (subtotal + extras + delivery + installation + VAT = total)
- Paystack payment integration:
  - `POST /api/orders` → create order + init Paystack transaction
  - Paystack inline popup
  - `POST /api/orders/verify` → verify payment via Paystack API
  - Webhook handler: `POST /api/webhooks/paystack` (signature verification)
- Order confirmation page: `/order/[id]`
- Clear cart on successful payment

**Acceptance:** Full checkout flow works end-to-end. Paystack test payment succeeds. Order created in DB with correct status. Webhook updates payment_status. Confirmation page shows order details.

---

### Build 20 — Order Emails & Confirmation
**Feed to Claude Code with:** Email templates + order data

**Deliverables:**
- React Email templates:
  - Order confirmation (to customer): order number, all blind specs, total, delivery info
  - New order notification (to admin): same + customer contact details + cross-sell flag
  - Order status update (to customer): "Your blinds have been ordered / shipped / delivered"
- Resend integration: send emails on order creation and status changes
- `/order/[id]` confirmation page with full order details + printable view

**Acceptance:** Customer receives confirmation email on purchase. Admin receives notification. Status update emails trigger on order_status change. All emails render correctly in email clients.

---

### Build 21 — Admin: Order Management
**Feed to Claude Code with:** orders schema + TECHNICAL_DESIGN.md §7

**Deliverables:**
- `/admin/orders` — order list with status filter tabs (All, New, Confirmed, Ordered, Shipped, Delivered, Installed)
- Search by order number, customer name, email
- Order detail page:
  - Customer info
  - All blind items with full specs (type, range, colour, size, mount, extras)
  - Pricing breakdown (supplier cost vs customer price per item, profit margin)
  - Status pipeline: clickable status progression with confirmation
  - Admin notes field
  - Cross-sell interest flag highlight
- Status change triggers email to customer

**Acceptance:** Order list loads with correct filters. Order detail shows complete information. Status changes persist and trigger emails. Profit view shows correct margins.

---

### Build 22 — Admin: Supplier PDF Generation
**Feed to Claude Code with:** TECHNICAL_DESIGN.md §7 (Supplier Order PDF) + Shademaster Order Form

**Deliverables:**
- "Generate Supplier Order" button on order detail page
- PDF generation matching Shademaster order form layout:
  - Customer / order info header
  - Line items: location, qty, width (mm), drop (mm), controls, stacking, blind type, range, colour
- PDF download
- Optional: auto-populate XLS format (matching Shademaster order form)

**Acceptance:** PDF generates with correct data for all order items. Format matches Shademaster expectations. Download works.

---

### Build 23 — Admin: Quotes & Leads Management
**Feed to Claude Code with:** quotes + leads schema

**Deliverables:**
- `/admin/quotes` — saved quotes table: customer, total, date, status (pending/converted), days since created
- Quote detail: full cart contents + customer contact
- `/admin/swatches` — swatch request list with status management
- `/admin/measures` — measure request list with status + scheduling
- Lead pipeline summary on dashboard: X pending quotes (R total), X swatch requests, X measure requests
- Bulk actions: mark as contacted, export to CSV

**Acceptance:** All three lead types display correctly. Status updates work. Dashboard counts are accurate. CSV export works.

---

### Build 24 — Public Pages: Homepage & Layout
**Feed to Claude Code with:** PROJECT_BRIEF.md §9 (Pages) + brand identity (once finalised)

**Deliverables:**
- Public layout: header (logo, nav from navigation_items, dark mode toggle), footer (nav, contact info, newsletter signup from site_settings)
- Homepage:
  - Hero section with CTA "Start configuring your blinds"
  - Category showcase (visual cards linking to configurator)
  - Trust signals (reviews, guarantees, service area)
  - "How it works" section (configurator steps overview)
  - Newsletter signup
- Cookie consent banner
- Mobile responsive navigation (hamburger + slide-out)

**Acceptance:** Homepage renders with dynamic content from DB. Navigation works. Newsletter signup saves to DB. Cookie consent works. Fully responsive.

---

### Build 25 — Public Pages: Product Browse
**Feed to Claude Code with:** Product data + pricing engine

**Deliverables:**
- `/products` — category grid (lifestyle cards)
- `/products/[category-slug]` — types within category
- `/products/[category-slug]/[type-slug]` — ranges within type, with swatches + starting prices
- "Configure this blind" CTA on range cards → enters configurator at Step 2 with type pre-selected
- Breadcrumb navigation
- Make 5 products feel like a full showroom (as discussed)

**Acceptance:** 3-level browse works. Breadcrumbs correct. Starting prices display correctly. "Configure" links pre-populate configurator. Feels like a proper shop, not a 5-item list.

---

### Build 26 — Public Pages: About, Contact, FAQ, Gallery
**Feed to Claude Code with:** Page content from site_settings + pages table

**Deliverables:**
- `/about` — company story, team, service area (content from pages table)
- `/contact` — contact form + phone + email + WhatsApp + "Request a free measure" CTA
- `/faq` — accordion FAQ sections: Measuring, Ordering, Colour, Installation, Returns
- `/gallery` — installed blinds showcase grid (images from media library, filterable by category)
- All pages: content from DB (zero hardcoding per Yoros standards)

**Acceptance:** All 4 pages render. Contact form submits to contact_submissions. FAQ accordion works. Gallery loads from media table. All content editable from admin.

---

### Build 27 — SEO, Sitemap, Structured Data
**Feed to Claude Code with:** YOROS_UNIVERSAL_PROJECT_BRIEF.md §3 (SEO)

**Deliverables:**
- `app/sitemap.ts` — auto-generated sitemap including all public + product routes
- `app/robots.ts` — allow public, disallow /admin, /api, /auth
- `generateMetadata` on every page (title, description, OG tags from DB)
- JSON-LD structured data:
  - Homepage: Organization
  - Product pages: Product + BreadcrumbList
  - FAQ: FAQPage
  - Contact: LocalBusiness
- Custom 404 page (branded, helpful)
- Custom 500 page
- Canonical URLs on all pages

**Acceptance:** Lighthouse SEO = 100. Sitemap generates all routes. robots.txt correct. Structured data validates in Google Rich Results Test. 404/500 pages render correctly.

---

### Build 28 — Room Preview (Stretch Goal)
**Feed to Claude Code with:** PROJECT_BRIEF.md §4 (Room Preview)

**Deliverables:**
- Photo upload component in configurator (after colour selection)
- Canvas-based window area selector (drag rectangle over window)
- Blind texture overlay:
  - Roller: solid colour fill with fabric texture opacity
  - Venetian: horizontal stripes matching slat size + colour
  - Vertical: vertical stripes matching slat width + colour
- Preview display with before/after toggle
- Download/share preview image
- Save preview image URL to order_item

**Decision gate:** Prototype first. Only ship if it looks professional. If it looks cheap → cut it.

**Acceptance:** Upload photo → select area → overlay looks realistic enough to add value. Download works. If quality bar not met, document why and move on.

---

### Build 29 — Final Polish & Launch Prep
**Feed to Claude Code with:** All acceptance criteria from builds 01–28

**Deliverables:**
- Lighthouse audit: Performance > 85, Accessibility = 100, Best Practices = 100, SEO = 100
- Mobile responsiveness pass on all pages (iPhone SE → iPad → Desktop)
- Loading states and skeleton loaders on all async content
- Empty states on all admin lists
- Toast notifications on all actions (save, delete, import, order status change)
- Error boundaries on key flows (configurator, checkout)
- Environment variables documented in `.env.example`
- README.md with setup + deployment instructions
- Final cross-browser check (Chrome, Safari, Firefox)
- Verify Paystack webhook works in production
- Create admin user for client
- Seed initial content (homepage, FAQ, about page basics)

**Acceptance:** All Lighthouse targets met. No console errors. All flows work end-to-end. Client can log in, import prices, and process an order.
