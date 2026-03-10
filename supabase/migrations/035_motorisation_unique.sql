-- Fix: add unique constraint on (brand, model) so the import upsert works.
-- Without this, onConflict: "brand,model" silently returns null for every row.
ALTER TABLE motorisation_options
  ADD CONSTRAINT motorisation_options_brand_model_key UNIQUE (brand, model);
