-- ============================================================
-- generic.sql — Industry seed: Minimal fallback
-- Makes no changes to the default seed — exists for script compat
-- ============================================================

-- The generic seed (supabase/seed.sql) already provides sensible
-- defaults for all sections. This file is a no-op placeholder
-- so that setup-db.sh can always run:
--   psql ... -f seed-industry/${INDUSTRY}.sql
-- without needing a special "skip" case.

-- No overrides needed — generic seed is already industry-neutral.
select 1;
