-- 023_legal_documents.sql
-- Runs when: legalDocs enabled
-- Versioned legal documents with client acceptance tracking

create table if not exists public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  content text not null,
  version int not null default 1,
  required boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references public.legal_documents(id) on delete cascade,
  version int not null,
  accepted_at timestamptz not null default now(),
  unique(user_id, document_id)
);

alter table public.legal_documents enable row level security;
alter table public.document_acceptances enable row level security;

-- Public can read active documents (for display on public pages)
create policy "legal_documents: public read active"
  on public.legal_documents for select to anon, authenticated
  using (active = true);

create policy "legal_documents: admin write"
  on public.legal_documents for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "document_acceptances: users read own"
  on public.document_acceptances for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "document_acceptances: users insert own"
  on public.document_acceptances for insert to authenticated
  with check (user_id = auth.uid());

create trigger set_updated_at before update on public.legal_documents
  for each row execute function public.handle_updated_at();
