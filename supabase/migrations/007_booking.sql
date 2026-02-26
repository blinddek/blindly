-- ============================================================
-- 007_booking.sql — Booking system
-- Runs when: booking feature enabled (opt-in any tier)
-- Tables: booking_services, availability_rules, bookings,
--         blocked_dates
-- ============================================================

-- ─── Booking Services ────────────────────────────────────────
create table if not exists public.booking_services (
  id                       uuid primary key default gen_random_uuid(),
  name                     jsonb not null default '{"en":"","af":""}'::jsonb,
  description              jsonb,
  duration_minutes         int not null default 60,
  buffer_minutes           int not null default 15,
  price_cents              int not null default 0,
  cancellation_cutoff_hours int not null default 24,
  max_advance_days         int not null default 30,
  is_active                boolean not null default true,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

alter table public.booking_services enable row level security;

create policy "booking_services: public read active"
  on public.booking_services for select
  to anon, authenticated
  using (is_active = true or public.is_admin());

create policy "booking_services: admin write"
  on public.booking_services for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─── Availability Rules ──────────────────────────────────────
-- service_id NULL = applies to all services (global hours)
create table if not exists public.availability_rules (
  id            uuid primary key default gen_random_uuid(),
  service_id    uuid references public.booking_services(id) on delete cascade,
  day_of_week   int not null check (day_of_week between 0 and 6),  -- 0=Sunday
  start_time    time not null,
  end_time      time not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.availability_rules enable row level security;

create policy "availability_rules: public read"
  on public.availability_rules for select
  to anon, authenticated
  using (true);

create policy "availability_rules: admin write"
  on public.availability_rules for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_availability_rules_service
  on public.availability_rules (service_id, day_of_week);

-- ─── Bookings ────────────────────────────────────────────────
create table if not exists public.bookings (
  id                  uuid primary key default gen_random_uuid(),
  service_id          uuid not null references public.booking_services(id) on delete restrict,
  user_id             uuid references public.user_profiles(id) on delete set null,
  client_name         text not null,
  client_email        text not null,
  client_phone        text not null default '',
  date                date not null,
  start_time          time not null,
  end_time            time not null,
  status              text not null default 'pending'
                      check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes               text,
  admin_notes         text,
  confirmation_token  text not null default encode(gen_random_bytes(16), 'hex'),
  reminder_sent_at    timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.bookings enable row level security;

-- Public can insert (book appointments)
create policy "bookings: public insert"
  on public.bookings for insert
  to anon, authenticated
  with check (true);

-- Users can read their own bookings
create policy "bookings: users read own"
  on public.bookings for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
  );

-- Anon can read by confirmation token (for booking confirmation page)
create policy "bookings: anon read by token"
  on public.bookings for select
  to anon
  using (false);  -- Override in app via service role for token lookups

-- Admin full access
create policy "bookings: admin write"
  on public.bookings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_bookings_date on public.bookings (date, start_time);
create index if not exists idx_bookings_service on public.bookings (service_id);
create index if not exists idx_bookings_user on public.bookings (user_id) where user_id is not null;
create index if not exists idx_bookings_status on public.bookings (status) where status in ('pending', 'confirmed');

-- ─── Blocked Dates ───────────────────────────────────────────
-- source: 'manual' = admin blocked, 'google_calendar' = synced from GCal
create table if not exists public.blocked_dates (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  reason      jsonb default '{"en":"","af":""}'::jsonb,
  all_day     boolean not null default true,
  start_time  time,
  end_time    time,
  source      text not null default 'manual',
  created_at  timestamptz not null default now()
);

alter table public.blocked_dates enable row level security;

create policy "blocked_dates: public read"
  on public.blocked_dates for select
  to anon, authenticated
  using (true);

create policy "blocked_dates: admin write"
  on public.blocked_dates for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_blocked_dates_date on public.blocked_dates (date);

-- Triggers
create trigger set_updated_at before update on public.booking_services
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.availability_rules
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.bookings
  for each row execute function public.handle_updated_at();
