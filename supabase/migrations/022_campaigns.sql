-- 022_campaigns.sql
-- Runs when: emailCampaigns or dripEmails enabled
-- Full campaign system: single-email broadcasts, multi-step sequences,
-- birthday campaigns, drip sequences, audience filtering, engagement tracking.

-- ============================================================
-- Email preferences on user_profiles (campaign opt-out/pause)
-- ============================================================

alter table public.user_profiles
  add column if not exists email_opt_out boolean not null default false,
  add column if not exists email_paused boolean not null default false,
  add column if not exists email_paused_at timestamptz,
  add column if not exists email_pause_reason text,
  add column if not exists unsubscribe_token text unique default encode(gen_random_bytes(32), 'hex'),
  add column if not exists consent_given boolean not null default true,
  add column if not exists source text not null default 'website';

-- ============================================================
-- campaigns — single-email broadcasts + multi-step sequences
-- ============================================================

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,

  -- Single-email campaigns store content directly
  subject text,
  body_html text,

  -- Status lifecycle: draft → scheduled → active → sending/sent/completed/paused/failed
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'active', 'sending', 'sent', 'completed', 'paused', 'failed')),

  -- Campaign structure
  is_multi_step boolean not null default false,
  campaign_type text not null default 'standard'
    check (campaign_type in ('standard', 'birthday')),

  -- Audience targeting (replaces legacy target_query)
  audience_filters jsonb,

  -- Stats
  total_recipients int not null default 0,
  sent_count int not null default 0,
  failed_count int not null default 0,

  -- Lifecycle timestamps
  start_date timestamptz,             -- When cron should activate (multi-step)
  activated_at timestamptz,           -- When cron flipped to active
  completed_at timestamptz,           -- When all steps finished
  sent_at timestamptz,                -- When single-send completed
  sent_by_id uuid references auth.users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_campaigns_status on public.campaigns (status);
create index if not exists idx_campaigns_start_date on public.campaigns (start_date)
  where status = 'scheduled';
create index if not exists idx_campaigns_type on public.campaigns (campaign_type);

-- ============================================================
-- campaign_emails — individual emails within a campaign
-- ============================================================

create table if not exists public.campaign_emails (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,

  step int not null,                  -- 0-indexed step number
  day_offset int not null default 0,  -- Days after campaign activation to send
  subject text not null,
  preview_text text,                  -- Inbox preview snippet
  body_html text not null,
  cta_text text,                      -- Optional CTA button label
  cta_url text,                       -- Optional CTA button URL (supports {{variables}})

  -- Birthday campaigns: gender-based template targeting
  gender_target text                  -- 'female' | 'male' | 'unknown' (null = all)
    check (gender_target is null or gender_target in ('female', 'male', 'unknown')),

  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(campaign_id, step)
);

create index if not exists idx_campaign_emails_campaign on public.campaign_emails (campaign_id);

-- ============================================================
-- campaign_progress — per-user progress through multi-step campaigns
-- ============================================================

create table if not exists public.campaign_progress (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  current_step int not null default 0,
  last_sent_at timestamptz,
  completed_at timestamptz,
  is_paused boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(campaign_id, user_id)
);

create index if not exists idx_campaign_progress_campaign on public.campaign_progress (campaign_id, completed_at);
create index if not exists idx_campaign_progress_user on public.campaign_progress (user_id);

-- ============================================================
-- drip_emails — phase-based nurture sequences
--
-- Two phases:
--   onboarding  — sent to new signups (day 0, 1, 2, 3, ...)
--   newsletter  — long-term engagement after onboarding completes
--
-- Admin edits content via campaign editor UI.
-- ============================================================

create table if not exists public.drip_emails (
  id uuid primary key default gen_random_uuid(),
  phase text not null default 'onboarding'
    check (phase in ('onboarding', 'newsletter')),

  step int not null,                  -- 0-indexed within phase
  day_offset int not null default 0,  -- Days since phase start
  subject text not null,
  preview_text text,
  body_html text not null,
  cta_text text,
  cta_url text,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(phase, step)
);

create index if not exists idx_drip_emails_phase on public.drip_emails (phase, step);

-- ============================================================
-- drip_progress — per-user progress through drip sequences
-- One row per user (progresses through onboarding → newsletter)
-- ============================================================

create table if not exists public.drip_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,

  current_phase text not null default 'onboarding'
    check (current_phase in ('onboarding', 'newsletter')),
  current_step int not null default 0,
  last_sent_at timestamptz,
  completed_at timestamptz,
  is_paused boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_drip_progress_phase on public.drip_progress (current_phase, current_step);
create index if not exists idx_drip_progress_paused on public.drip_progress (is_paused)
  where is_paused = false;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.campaigns enable row level security;
alter table public.campaign_emails enable row level security;
alter table public.campaign_progress enable row level security;
alter table public.drip_emails enable row level security;
alter table public.drip_progress enable row level security;

create policy "campaigns: admin only"
  on public.campaigns for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "campaign_emails: admin only"
  on public.campaign_emails for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "campaign_progress: admin only"
  on public.campaign_progress for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "drip_emails: admin only"
  on public.drip_emails for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "drip_progress: admin only"
  on public.drip_progress for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- Updated-at triggers
-- ============================================================

create trigger set_updated_at before update on public.campaigns
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.campaign_emails
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.campaign_progress
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.drip_emails
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.drip_progress
  for each row execute function public.handle_updated_at();
