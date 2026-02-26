-- ============================================================
-- 008_shop.sql — Webshop: products, categories, orders
-- Runs when: shop feature enabled (commerce tier)
-- Slim v1: no coupons, no compare_at_price, no digital delivery
-- ============================================================

-- ─── Product Categories ──────────────────────────────────────
create table if not exists public.product_categories (
  id          uuid primary key default gen_random_uuid(),
  name        jsonb not null default '{"en":"","af":""}'::jsonb,
  slug        text not null unique,
  image       text,
  display_order int not null default 0,
  is_active   boolean not null default true,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.product_categories enable row level security;

create policy "product_categories: public read active"
  on public.product_categories for select
  to anon, authenticated
  using (
    (is_active = true and deleted_at is null)
    or public.is_admin()
  );

create policy "product_categories: admin write"
  on public.product_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─── Products ────────────────────────────────────────────────
create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  name            jsonb not null default '{"en":"","af":""}'::jsonb,
  slug            text not null unique,
  description     jsonb,
  price_cents     int not null default 0,
  images          jsonb not null default '[]'::jsonb,
  category_id     uuid references public.product_categories(id) on delete set null,
  stock_quantity  int not null default 0,
  is_active       boolean not null default true,
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "products: public read active"
  on public.products for select
  to anon, authenticated
  using (
    (is_active = true and deleted_at is null)
    or public.is_admin()
  );

create policy "products: admin write"
  on public.products for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_products_category on public.products (category_id);
create index if not exists idx_products_slug on public.products (slug);
create index if not exists idx_products_active
  on public.products (created_at desc)
  where is_active = true and deleted_at is null;

-- ─── Orders ──────────────────────────────────────────────────
create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references public.user_profiles(id) on delete set null,
  email              text not null,
  status             text not null default 'pending'
                     check (status in ('pending', 'paid', 'fulfilled', 'cancelled')),
  total_cents        int not null default 0,
  subtotal_cents     int not null default 0,
  shipping_cents     int not null default 0,
  tax_cents          int not null default 0,
  items              jsonb not null default '[]'::jsonb,
  shipping           jsonb not null default '{}'::jsonb,
  payment_reference  text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.orders enable row level security;

-- Authenticated users can create orders
create policy "orders: authenticated insert"
  on public.orders for insert
  to authenticated
  with check (true);

-- Anon can also create orders (guest checkout)
create policy "orders: anon insert"
  on public.orders for insert
  to anon
  with check (true);

-- Users can read their own orders
create policy "orders: users read own"
  on public.orders for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
  );

-- Admin full access
create policy "orders: admin write"
  on public.orders for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_orders_user on public.orders (user_id) where user_id is not null;
create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_orders_created on public.orders (created_at desc);

-- ─── Shop Settings ───────────────────────────────────────────
create table if not exists public.shop_settings (
  key    text primary key,
  value  jsonb not null default '{}'::jsonb
);

alter table public.shop_settings enable row level security;

create policy "shop_settings: public read"
  on public.shop_settings for select
  to anon, authenticated
  using (true);

create policy "shop_settings: admin write"
  on public.shop_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Default shop settings
insert into public.shop_settings (key, value) values
  ('shipping_rate_cents', '5000'::jsonb),
  ('free_shipping_threshold_cents', '50000'::jsonb),
  ('tax_rate_percent', '15'::jsonb)
on conflict (key) do nothing;

-- Triggers
create trigger set_updated_at before update on public.product_categories
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.products
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.orders
  for each row execute function public.handle_updated_at();
