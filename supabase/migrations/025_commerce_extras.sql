-- 025_commerce_extras.sql
-- Runs when: hybridPackages, coupons, or gifts enabled
-- Hybrid packages, discount codes, and gift redemption

-- Hybrid packages (course + session + product bundles)
create table if not exists public.hybrid_packages (
  id uuid primary key default gen_random_uuid(),
  name jsonb not null default '{"en":"","af":""}'::jsonb,
  slug text unique not null,
  description jsonb,
  courses jsonb not null default '[]'::jsonb,
  session_credits int not null default 0,
  products jsonb not null default '[]'::jsonb,
  price_cents int not null default 0,
  price_usd_cents int,
  price_eur_cents int,
  price_gbp_cents int,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Discount codes
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value int not null,
  max_uses int,
  used_count int not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Gift codes
create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  gift_type text not null check (gift_type in ('course', 'product', 'credits')),
  target_id uuid,
  amount int,
  redeemed_by uuid references auth.users(id),
  redeemed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.hybrid_packages enable row level security;
alter table public.coupons enable row level security;
alter table public.gifts enable row level security;

-- Packages: public reads active, admin writes
create policy "hybrid_packages: public read active"
  on public.hybrid_packages for select to anon, authenticated
  using (is_active = true);
create policy "hybrid_packages: admin write"
  on public.hybrid_packages for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Coupons: admin only
create policy "coupons: admin only"
  on public.coupons for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Gifts: admin writes, public reads (for code redemption)
create policy "gifts: admin write"
  on public.gifts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "gifts: public read by code"
  on public.gifts for select to anon, authenticated
  using (true);

create trigger set_updated_at before update on public.hybrid_packages
  for each row execute function public.handle_updated_at();
