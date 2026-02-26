-- 024_client_intake.sql
-- Runs when: clientOnboarding enabled
-- Configurable intake forms with JSON responses

create table if not exists public.client_intakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  responses jsonb not null default '{}'::jsonb,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.client_intakes enable row level security;

create policy "client_intakes: users read/write own"
  on public.client_intakes for all to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create trigger set_updated_at before update on public.client_intakes
  for each row execute function public.handle_updated_at();
