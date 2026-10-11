-- 041: A user cannot make themselves an admin (walk g12-g13 F1, 2026-10-11)
--
-- The one admin rule (G-12: lib/supabase/middleware.ts), ensureAdmin() and the admin layout all trust
-- user_profiles.role. Three routes let a user write it:
--   · 002's "user_profiles: users update own" lets an authenticated user UPDATE their own row with no
--     column restriction (its comment says "non-role fields"; nothing enforced it), so
--     PATCH /rest/v1/user_profiles?id=eq.<self> {"role":"admin"} with the anon key and their own JWT
--     would have made them an admin;
--   · 002's "user_profiles: admin insert" lets a user INSERT their own row (id = auth.uid()) with any
--     role; only the row signup already created stands in the way;
--   · 002's handle_new_user() copied role from raw_user_meta_data, which the person signing up writes
--     (GoTrue /signup data:{role:"admin"}), whether or not the site shows a signup page.
-- In the app, roles change only through updateUserRole (lib/admin/user-actions.ts): the service-role
-- client, behind ensureAdmin(). So a role change is refused unless it comes from the service role or
-- the SQL editor, and a new profile is always a customer.
--
-- Measured before this was written: user_profiles held 2 rows, both admin, both on the operator's own
-- domains (.handoff/admin-roles/01-db-inspector.md, 2026-10-11).
--
-- NOT APPLIED BY THIS FILE. Apply it by hand in the Supabase SQL editor, then record it in
-- brief/EVIDENCE.md (CLAUDE.md §5).

create or replace function public.protect_user_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- PostgREST runs a signed-in user's request as `authenticated` and an anonymous one as `anon`;
  -- the service key runs as `service_role`, the SQL editor as `postgres`.
  if current_user in ('authenticated', 'anon') and (
       (tg_op = 'INSERT' and new.role is distinct from 'customer')
    or (tg_op = 'UPDATE' and new.role is distinct from old.role)
  ) then
    raise exception 'user_profiles.role can only be changed by an administrator'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_user_role on public.user_profiles;
create trigger protect_user_role
  before insert or update of role on public.user_profiles
  for each row execute function public.protect_user_role();

-- A new profile is a customer. An admin is made by updateUserRole, or by hand here.
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
    'customer'
  );
  return new;
end;
$$;

-- Verify after applying (expect: the trigger listed; the function body without raw_user_meta_data ->> 'role'):
--   select tgname from pg_trigger where tgrelid = 'public.user_profiles'::regclass and not tgisinternal;
--   select prosrc from pg_proc where proname = 'handle_new_user';
