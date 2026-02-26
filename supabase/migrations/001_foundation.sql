-- ============================================================
-- 001_foundation.sql — Core site infrastructure
-- Always runs for every tier.
-- Tables: site_content, nav_links, footer_sections, faqs,
--         page_seo, homepage_sections
-- ============================================================

-- ─── Helper: admin check via JWT claim (no table recursion) ──
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
as $$
  select coalesce(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'user_role') = 'admin',
    false
  );
$$;

-- ============================================================
-- site_content — generic key/value JSON content store
-- ============================================================
create table if not exists public.site_content (
  id            uuid primary key default gen_random_uuid(),
  section_key   text not null unique,
  content       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.site_content enable row level security;

create policy "site_content: public read"
  on public.site_content for select
  to anon, authenticated
  using (true);

create policy "site_content: admin write"
  on public.site_content for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- nav_links — top navigation links
-- ============================================================
create table if not exists public.nav_links (
  id             uuid primary key default gen_random_uuid(),
  label          jsonb not null default '{"en":"","af":""}'::jsonb,
  href           text not null,
  display_order  int not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.nav_links enable row level security;

create policy "nav_links: public read"
  on public.nav_links for select
  to anon, authenticated
  using (true);

create policy "nav_links: admin write"
  on public.nav_links for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_nav_links_order on public.nav_links (display_order);

-- ============================================================
-- footer_sections — footer columns with nested links
-- ============================================================
create table if not exists public.footer_sections (
  id             uuid primary key default gen_random_uuid(),
  title          jsonb not null default '{"en":"","af":""}'::jsonb,
  links          jsonb not null default '[]'::jsonb,
  display_order  int not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.footer_sections enable row level security;

create policy "footer_sections: public read"
  on public.footer_sections for select
  to anon, authenticated
  using (true);

create policy "footer_sections: admin write"
  on public.footer_sections for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_footer_sections_order on public.footer_sections (display_order);

-- ============================================================
-- faqs — frequently asked questions
-- ============================================================
create table if not exists public.faqs (
  id             uuid primary key default gen_random_uuid(),
  question       jsonb not null default '{"en":"","af":""}'::jsonb,
  answer         jsonb not null default '{"en":"","af":""}'::jsonb,
  display_order  int not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.faqs enable row level security;

create policy "faqs: public read"
  on public.faqs for select
  to anon, authenticated
  using (true);

create policy "faqs: admin write"
  on public.faqs for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_faqs_order on public.faqs (display_order);

-- ============================================================
-- page_seo — per-page SEO metadata
-- ============================================================
create table if not exists public.page_seo (
  id             uuid primary key default gen_random_uuid(),
  page_key       text not null unique,
  title          jsonb not null default '{"en":"","af":""}'::jsonb,
  description    jsonb not null default '{"en":"","af":""}'::jsonb,
  og_image_url   text,
  keywords       text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.page_seo enable row level security;

create policy "page_seo: public read"
  on public.page_seo for select
  to anon, authenticated
  using (true);

create policy "page_seo: admin write"
  on public.page_seo for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- homepage_sections — flexible homepage content blocks
-- Replaces Yoros-specific how_it_works_steps + homepage_services
-- ============================================================
create table if not exists public.homepage_sections (
  id             uuid primary key default gen_random_uuid(),
  section_key    text not null unique,
  content        jsonb not null default '{}'::jsonb,
  display_order  int not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.homepage_sections enable row level security;

create policy "homepage_sections: public read"
  on public.homepage_sections for select
  to anon, authenticated
  using (true);

create policy "homepage_sections: admin write"
  on public.homepage_sections for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_homepage_sections_order on public.homepage_sections (display_order);

-- ============================================================
-- updated_at trigger function (reused across all tables)
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at triggers
create trigger set_updated_at before update on public.site_content
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.nav_links
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.footer_sections
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.faqs
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.page_seo
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.homepage_sections
  for each row execute function public.handle_updated_at();
