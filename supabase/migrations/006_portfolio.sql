-- ============================================================
-- 006_portfolio.sql — Portfolio / Our Work items
-- Runs when: portfolio feature enabled (business+ or opt-in)
-- ============================================================

create table if not exists public.portfolio_items (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           jsonb not null default '{"en":"","af":""}'::jsonb,
  description     jsonb,
  hero_image_url  text,
  images          jsonb not null default '[]'::jsonb,
  alt_text        jsonb,
  industry        text,
  features        jsonb not null default '[]'::jsonb,
  tech_stack      text[] not null default '{}',
  live_url        text,
  is_featured     boolean not null default false,
  is_published    boolean not null default false,
  display_order   int not null default 0,
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.portfolio_items enable row level security;

-- Public can read published, non-deleted items
create policy "portfolio_items: public read published"
  on public.portfolio_items for select
  to anon, authenticated
  using (
    (is_published = true and deleted_at is null)
    or public.is_admin()
  );

-- Admin full access
create policy "portfolio_items: admin write"
  on public.portfolio_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_portfolio_items_published
  on public.portfolio_items (display_order)
  where is_published = true and deleted_at is null;

create index if not exists idx_portfolio_items_slug on public.portfolio_items (slug);

create trigger set_updated_at before update on public.portfolio_items
  for each row execute function public.handle_updated_at();
