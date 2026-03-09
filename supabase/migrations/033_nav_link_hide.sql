-- Migration 033: Add hide_in_nav flag to nav_links
-- Allows a link to exist in the DB (accessible via CTA button / direct URL)
-- without appearing as a plain text item in the navigation bar.

ALTER TABLE nav_links ADD COLUMN IF NOT EXISTS hide_in_nav BOOLEAN NOT NULL DEFAULT false;
