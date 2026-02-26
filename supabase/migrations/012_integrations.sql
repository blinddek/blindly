-- ============================================================
-- 012_integrations.sql — External integration credentials
-- Runs when: googleCalendar feature enabled (requires booking)
-- Tables: integration_credentials
-- Also adds google_calendar_event_id to bookings if exists
-- ============================================================

create table if not exists public.integration_credentials (
  id            uuid primary key default gen_random_uuid(),
  provider      text not null unique,
  credentials   jsonb not null default '{}'::jsonb,
  metadata      jsonb not null default '{}'::jsonb,
  connected_by  uuid references public.user_profiles(id) on delete set null,
  connected_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.integration_credentials enable row level security;

-- Admin only — credentials are sensitive
create policy "integration_credentials: admin read"
  on public.integration_credentials for select
  to authenticated
  using (public.is_admin());

create policy "integration_credentials: admin write"
  on public.integration_credentials for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create trigger set_updated_at before update on public.integration_credentials
  for each row execute function public.handle_updated_at();

-- Add google_calendar_event_id to bookings table
-- (007_booking.sql may or may not have been run — use IF NOT EXISTS pattern)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'bookings'
  ) then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'bookings'
        and column_name = 'google_calendar_event_id'
    ) then
      alter table public.bookings
        add column google_calendar_event_id text;
    end if;
  end if;
end;
$$;
