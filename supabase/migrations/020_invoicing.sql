-- 020_invoicing.sql
-- Runs when: billing enabled
-- Invoice generation with billing entities, sequences, and VAT

create table if not exists public.billing_entities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  registration_no text,
  vat_no text,
  address text,
  email text,
  phone text,
  logo_url text,
  bank_name text,
  bank_account text,
  bank_branch text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  user_id uuid references auth.users(id),
  client_name text not null,
  client_email text not null,
  line_items jsonb not null default '[]'::jsonb,
  subtotal_cents int not null default 0,
  vat_rate numeric(5,4) not null default 0.15,
  vat_amount_cents int not null default 0,
  total_cents int not null default 0,
  currency text not null default 'ZAR',
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'paid', 'void')),
  pdf_url text,
  issued_at timestamptz,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_sequences (
  id text primary key default 'default',
  prefix text not null default 'INV',
  next_num int not null default 1
);

-- Seed default sequence
insert into public.invoice_sequences (id, prefix, next_num)
  values ('default', 'INV', 1) on conflict do nothing;

alter table public.billing_entities enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_sequences enable row level security;

create policy "billing_entities: admin only"
  on public.billing_entities for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "invoices: users read own"
  on public.invoices for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "invoices: admin write"
  on public.invoices for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "invoice_sequences: admin only"
  on public.invoice_sequences for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create trigger set_updated_at before update on public.billing_entities
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.invoices
  for each row execute function public.handle_updated_at();
