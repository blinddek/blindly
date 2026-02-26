-- ============================================================
-- 003_contact.sql — Contact form submissions
-- Always runs for every tier.
-- ============================================================

create table if not exists public.contact_submissions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text not null default '',
  message     text not null,
  read        boolean not null default false,
  archived    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.contact_submissions enable row level security;

-- Anyone can submit a contact form (including anonymous visitors)
create policy "contact_submissions: anon insert"
  on public.contact_submissions for insert
  to anon, authenticated
  with check (true);

-- Admin can read all submissions
create policy "contact_submissions: admin read"
  on public.contact_submissions for select
  to authenticated
  using (public.is_admin());

-- Admin can update (mark read, archive)
create policy "contact_submissions: admin update"
  on public.contact_submissions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Admin can delete
create policy "contact_submissions: admin delete"
  on public.contact_submissions for delete
  to authenticated
  using (public.is_admin());

create index if not exists idx_contact_submissions_read on public.contact_submissions (read) where not archived;
create index if not exists idx_contact_submissions_created on public.contact_submissions (created_at desc);

create trigger set_updated_at before update on public.contact_submissions
  for each row execute function public.handle_updated_at();
