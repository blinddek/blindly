-- 021_whatsapp.sql
-- Runs when: whatsapp enabled
-- Server-side WhatsApp messaging via Meta Cloud API

create table if not exists public.whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  body text not null,
  variables jsonb not null default '[]'::jsonb,
  category text not null default 'general',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_logs (
  id uuid primary key default gen_random_uuid(),
  recipient text not null,
  template_name text,
  body text,
  status text not null default 'sent'
    check (status in ('sent', 'failed', 'delivered', 'read')),
  message_id text,
  error text,
  sent_at timestamptz not null default now()
);

alter table public.whatsapp_templates enable row level security;
alter table public.whatsapp_logs enable row level security;

create policy "whatsapp_templates: admin only"
  on public.whatsapp_templates for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "whatsapp_logs: admin read"
  on public.whatsapp_logs for select to authenticated
  using (public.is_admin());

create trigger set_updated_at before update on public.whatsapp_templates
  for each row execute function public.handle_updated_at();

-- Seed generic templates
insert into public.whatsapp_templates (name, body, variables, category) values
  ('booking_reminder', 'Hi {{name}}, reminder: your {{service}} is tomorrow at {{time}}.', '["name", "service", "time"]', 'booking'),
  ('booking_confirmation', 'Hi {{name}}, your {{service}} on {{date}} at {{time}} is confirmed.', '["name", "service", "date", "time"]', 'booking'),
  ('order_shipped', 'Hi {{name}}, your order #{{orderNumber}} has been shipped.', '["name", "orderNumber"]', 'commerce')
on conflict (name) do nothing;
