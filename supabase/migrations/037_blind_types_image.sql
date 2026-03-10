-- Add image_url to blind_types so each type can have a header photo
ALTER TABLE blind_types
  ADD COLUMN IF NOT EXISTS image_url TEXT;
