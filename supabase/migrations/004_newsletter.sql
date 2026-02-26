-- ============================================================
-- 004_newsletter.sql — Newsletter subscribers
-- Runs when: newsletter feature enabled (business+ or opt-in)
-- ============================================================

create table if not exists public.newsletter_subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  name        text,
  source      text not null default 'website',
  unsubscribe_token text not null default encode(gen_random_bytes(32), 'hex'),
  deleted_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- Unique on email only for non-deleted rows
create unique index if not exists idx_newsletter_subscribers_email
  on public.newsletter_subscribers (email) where deleted_at is null;

alter table public.newsletter_subscribers enable row level security;

-- Anyone can subscribe (insert)
create policy "newsletter_subscribers: anon insert"
  on public.newsletter_subscribers for insert
  to anon, authenticated
  with check (true);

-- Admin can read all subscribers
create policy "newsletter_subscribers: admin read"
  on public.newsletter_subscribers for select
  to authenticated
  using (public.is_admin());

-- Admin can update/delete
create policy "newsletter_subscribers: admin update"
  on public.newsletter_subscribers for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "newsletter_subscribers: admin delete"
  on public.newsletter_subscribers for delete
  to authenticated
  using (public.is_admin());

-- Allow anon to update for unsubscribe (via token)
create policy "newsletter_subscribers: anon unsubscribe"
  on public.newsletter_subscribers for update
  to anon
  using (true)
  with check (true);

create index if not exists idx_newsletter_subscribers_created
  on public.newsletter_subscribers (created_at desc) where deleted_at is null;
