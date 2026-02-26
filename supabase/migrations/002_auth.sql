-- ============================================================
-- 002_auth.sql — User profiles, activity log, triggers
-- Always runs for every tier.
-- ============================================================

-- ============================================================
-- user_profiles — extends auth.users with app-level data
-- ============================================================
create table if not exists public.user_profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  role                text not null default 'customer' check (role in ('admin', 'customer')),
  full_name           text not null default '',
  email               text,
  phone               text not null default '',
  business_name       text not null default '',
  avatar_url          text,
  notification_prefs  jsonb not null default '{"email": true, "sms": false}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

-- Users can read their own profile
create policy "user_profiles: users read own"
  on public.user_profiles for select
  to authenticated
  using (
    id = auth.uid()
    or public.is_admin()
  );

-- Users can update their own profile (non-role fields)
create policy "user_profiles: users update own"
  on public.user_profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Admin can insert (for user management)
create policy "user_profiles: admin insert"
  on public.user_profiles for insert
  to authenticated
  with check (public.is_admin() or id = auth.uid());

-- Admin can delete
create policy "user_profiles: admin delete"
  on public.user_profiles for delete
  to authenticated
  using (public.is_admin());

create index if not exists idx_user_profiles_role on public.user_profiles (role);
create index if not exists idx_user_profiles_email on public.user_profiles (email);

-- ============================================================
-- Auto-create profile on auth.users insert
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'customer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Custom access token hook — inject role into JWT
-- ============================================================
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  claims jsonb;
  user_role text;
begin
  select role into user_role
  from public.user_profiles
  where id = (event ->> 'user_id')::uuid;

  claims := event -> 'claims';

  if user_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  else
    claims := jsonb_set(claims, '{user_role}', '"customer"');
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- Grant execute to supabase_auth_admin for the hook
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;
grant select on public.user_profiles to supabase_auth_admin;

-- Revoke from public for security
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

-- ============================================================
-- activity_log — audit trail for admin actions
-- ============================================================
create table if not exists public.activity_log (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.user_profiles(id) on delete set null,
  action       text not null,
  entity_type  text not null,
  entity_id    text,
  old_data     jsonb,
  new_data     jsonb,
  created_at   timestamptz not null default now()
);

alter table public.activity_log enable row level security;

create policy "activity_log: admin read"
  on public.activity_log for select
  to authenticated
  using (public.is_admin());

create policy "activity_log: admin insert"
  on public.activity_log for insert
  to authenticated
  with check (public.is_admin());

create index if not exists idx_activity_log_actor on public.activity_log (actor_id);
create index if not exists idx_activity_log_entity on public.activity_log (entity_type, entity_id);
create index if not exists idx_activity_log_created on public.activity_log (created_at desc);

-- updated_at trigger for user_profiles
create trigger set_updated_at before update on public.user_profiles
  for each row execute function public.handle_updated_at();
