-- 018_booking_enhancements.sql
-- Runs when: booking enabled
-- Adds cancel/reschedule tracking, client/admin notes, recurring series, meeting URLs

alter table public.bookings
  add column if not exists client_notes text,
  add column if not exists admin_notes text,
  add column if not exists reschedule_count int not null default 0,
  add column if not exists rescheduled_at timestamptz,
  add column if not exists original_date date,
  add column if not exists original_start_time text,
  add column if not exists cancelled_by text
    check (cancelled_by in ('client', 'admin')),
  add column if not exists cancellation_reason text,
  add column if not exists credit_refunded boolean not null default false,
  add column if not exists is_late_cancel boolean not null default false,
  add column if not exists cancelled_at timestamptz,
  add column if not exists billing_note text,
  add column if not exists graph_event_id text,
  add column if not exists meeting_url text,
  add column if not exists recurring_series_id uuid,
  add column if not exists recurring_pattern text
    check (recurring_pattern in ('weekly', 'bimonthly', 'monthly'));

-- Index for recurring series lookups
create index if not exists idx_bookings_series
  on public.bookings(recurring_series_id) where recurring_series_id is not null;

-- Customers can read their own bookings
do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'bookings: customers read own'
  ) then
    create policy "bookings: customers read own"
      on public.bookings for select to authenticated
      using (user_id = auth.uid() or public.is_admin());
  end if;
end $$;

-- Customers can update their own client_notes
do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'bookings: customers update notes'
  ) then
    create policy "bookings: customers update notes"
      on public.bookings for update to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;
