-- ============================================================
-- 014_cron_runs.sql — Cron job execution log
-- Runs when: always (core infrastructure)
-- Tables: cron_runs
-- ============================================================

create table if not exists public.cron_runs (
  id          uuid primary key default gen_random_uuid(),
  task_name   text not null,
  status      text not null default 'success'
              check (status in ('success', 'error', 'skipped')),
  summary     jsonb not null default '{}'::jsonb,
  duration_ms int,
  created_at  timestamptz not null default now()
);

alter table public.cron_runs enable row level security;

-- Admin read-only
create policy "cron_runs: admin read"
  on public.cron_runs for select
  to authenticated
  using (public.is_admin());

-- Service role inserts via admin client
-- No public insert/update/delete policies needed

-- Index for dashboard query (last run per task)
create index if not exists idx_cron_runs_task_created
  on public.cron_runs (task_name, created_at desc);

-- Keep log clean — auto-delete entries older than 90 days
-- (handled by the cron itself in the cleanup task)
