-- ============================================================
-- 009_payments.sql — Payment event logs
-- Runs when: shop OR booking with paid services
-- ============================================================

create table if not exists public.payment_logs (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid,
  booking_id  uuid,
  event       text not null,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

alter table public.payment_logs enable row level security;

-- Admin only
create policy "payment_logs: admin read"
  on public.payment_logs for select
  to authenticated
  using (public.is_admin());

create policy "payment_logs: admin insert"
  on public.payment_logs for insert
  to authenticated
  with check (public.is_admin());

-- Service role can also insert (for webhook handlers)
-- This is handled by the service role key, not RLS

create index if not exists idx_payment_logs_order on public.payment_logs (order_id) where order_id is not null;
create index if not exists idx_payment_logs_booking on public.payment_logs (booking_id) where booking_id is not null;
create index if not exists idx_payment_logs_created on public.payment_logs (created_at desc);
