-- 017_extended_profiles.sql
-- Runs when: customerAuth enabled
-- Adds optional profile columns (visibility controlled by config/site.ts clientFields)

alter table public.user_profiles
  add column if not exists date_of_birth date,
  add column if not exists gender text,
  add column if not exists address text,
  add column if not exists relationship_status text,
  add column if not exists emergency_contact text,
  add column if not exists referral_source text,
  add column if not exists referral_detail text,
  add column if not exists medical_info text,
  add column if not exists company_name text,
  add column if not exists password_changed boolean not null default false,
  add column if not exists billing_type text not null default 'prepaid'
    check (billing_type in ('prepaid', 'postpaid')),
  add column if not exists status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  add column if not exists onboarding_complete boolean not null default false;
