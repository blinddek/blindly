-- 013_seo_advanced.sql
-- Adds advanced SEO columns to page_seo and content model tables.
-- Only populated when seoAdvanced feature is enabled.

-- ─── page_seo enhancements ──────────────────────────────────
ALTER TABLE page_seo ADD COLUMN IF NOT EXISTS og_type text DEFAULT 'website';
ALTER TABLE page_seo ADD COLUMN IF NOT EXISTS twitter_card text DEFAULT 'summary_large_image';
ALTER TABLE page_seo ADD COLUMN IF NOT EXISTS canonical_url text;
ALTER TABLE page_seo ADD COLUMN IF NOT EXISTS noindex boolean DEFAULT false;
ALTER TABLE page_seo ADD COLUMN IF NOT EXISTS priority real DEFAULT 0.5;
ALTER TABLE page_seo ADD COLUMN IF NOT EXISTS changefreq text DEFAULT 'monthly';

-- ─── Content model SEO overrides ────────────────────────────
-- These are optional — fallback to the model's existing title/description.

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_title text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_description text;

ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description text;

ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS meta_title text;
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS meta_description text;

ALTER TABLE courses ADD COLUMN IF NOT EXISTS meta_title text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS meta_description text;
