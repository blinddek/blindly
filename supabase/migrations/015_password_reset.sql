-- 015_password_reset.sql
-- Runs when: customerAuth enabled
-- Custom password reset flow bypassing Supabase SMTP

create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_prt_token_hash on public.password_reset_tokens(token_hash);
create index if not exists idx_prt_user_id on public.password_reset_tokens(user_id);

alter table public.password_reset_tokens enable row level security;

-- Only server-side (admin client) can manage tokens
create policy "password_reset_tokens: admin only"
  on public.password_reset_tokens for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
