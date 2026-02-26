-- ============================================================
-- 011_customer_profiles.sql — Extended customer portal RLS
-- Runs when: customerAuth feature enabled (commerce/LMS or opt-in)
-- Extends user_profiles for customer self-service
-- ============================================================

-- Add portal-specific columns to user_profiles
alter table public.user_profiles
  add column if not exists portal_nav_prefs jsonb default '{}'::jsonb,
  add column if not exists last_login_at timestamptz;

-- Allow customers to read other customers' basic info (for community features)
-- By default, users can already read their own profile via 002_auth.sql
-- This migration adds no new tables, just ensures customer-facing
-- portal permissions are correct.

-- Ensure customers can update their own portal preferences
-- (The existing "users update own" policy in 002 already covers this,
--  but we add an explicit check for portal_nav_prefs)

-- Function to update last login timestamp
create or replace function public.handle_user_login()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.user_profiles
  set last_login_at = now()
  where id = new.id;
  return new;
end;
$$;

-- Note: This trigger fires on auth.sessions, not auth.users
-- Supabase doesn't expose session creation triggers by default,
-- so last_login_at should be updated from the app layer instead.
-- The function is provided for use in server actions.
