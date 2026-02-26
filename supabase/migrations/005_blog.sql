-- ============================================================
-- 005_blog.sql — Blog posts and categories
-- Runs when: blog feature enabled (business+ or opt-in)
-- ============================================================

-- ─── Blog Categories ─────────────────────────────────────────
create table if not exists public.blog_categories (
  id           uuid primary key default gen_random_uuid(),
  name         jsonb not null default '{"en":"","af":""}'::jsonb,
  slug         text not null unique,
  description  jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.blog_categories enable row level security;

create policy "blog_categories: public read"
  on public.blog_categories for select
  to anon, authenticated
  using (true);

create policy "blog_categories: admin write"
  on public.blog_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─── Blog Posts ──────────────────────────────────────────────
create table if not exists public.blog_posts (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  title               jsonb not null default '{"en":"","af":""}'::jsonb,
  excerpt             jsonb,
  content             jsonb,
  author              text not null default '',
  category_id         uuid references public.blog_categories(id) on delete set null,
  tags                text[] not null default '{}',
  featured_image_url  text,
  is_published        boolean not null default false,
  published_at        timestamptz,
  deleted_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.blog_posts enable row level security;

-- Public can read published, non-deleted posts
create policy "blog_posts: public read published"
  on public.blog_posts for select
  to anon, authenticated
  using (
    (is_published = true and deleted_at is null)
    or public.is_admin()
  );

-- Admin full access
create policy "blog_posts: admin write"
  on public.blog_posts for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_blog_posts_published
  on public.blog_posts (published_at desc)
  where is_published = true and deleted_at is null;

create index if not exists idx_blog_posts_slug on public.blog_posts (slug);
create index if not exists idx_blog_posts_category on public.blog_posts (category_id);

-- Triggers
create trigger set_updated_at before update on public.blog_categories
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.blog_posts
  for each row execute function public.handle_updated_at();
