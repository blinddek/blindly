-- 019_session_credits.sql
-- Runs when: sessionCredits enabled
-- Prepaid session credit system with balance tracking + transaction ledger

create table if not exists public.session_credit_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  balance int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.session_credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount int not null,
  type text not null check (type in ('purchase', 'refund', 'forfeit', 'debit', 'manual')),
  description text,
  booking_id uuid references public.bookings(id),
  created_at timestamptz not null default now()
);

alter table public.session_credit_balances enable row level security;
alter table public.session_credit_transactions enable row level security;

create policy "credits_balance: users read own"
  on public.session_credit_balances for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "credits_balance: admin write"
  on public.session_credit_balances for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "credits_tx: users read own"
  on public.session_credit_transactions for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "credits_tx: admin write"
  on public.session_credit_transactions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create trigger set_updated_at before update on public.session_credit_balances
  for each row execute function public.handle_updated_at();
