-- 016_email_templates.sql
-- Runs when: always (core infrastructure)
-- Admin-editable email templates with variable substitution + send logs

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  subject text not null,
  body_html text not null,
  variables jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  recipient text not null,
  subject text not null,
  template_key text,
  status text not null default 'sent'
    check (status in ('sent', 'failed', 'bounced')),
  metadata jsonb,
  sent_at timestamptz not null default now(),

  -- Engagement tracking
  tracking_id text unique,           -- Unique token for open/click tracking pixel
  opened_at timestamptz,             -- First open timestamp
  opens_count int not null default 0,
  clicked_at timestamptz,            -- First click timestamp
  clicks_count int not null default 0
);

alter table public.email_templates enable row level security;
alter table public.email_logs enable row level security;

create policy "email_templates: admin write"
  on public.email_templates for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "email_logs: admin read"
  on public.email_logs for select to authenticated
  using (public.is_admin());

create index if not exists idx_email_logs_recipient on public.email_logs (recipient);
create index if not exists idx_email_logs_template_key on public.email_logs (template_key);
create index if not exists idx_email_logs_sent_at on public.email_logs (sent_at desc);
create index if not exists idx_email_logs_tracking_id on public.email_logs (tracking_id) where tracking_id is not null;

create trigger set_updated_at before update on public.email_templates
  for each row execute function public.handle_updated_at();

-- RPC functions for atomic tracking increments (called from API routes)

create or replace function public.increment_email_opens(p_tracking_id text)
returns void language plpgsql security definer as $$
begin
  update public.email_logs
  set opens_count = opens_count + 1,
      opened_at = coalesce(opened_at, now())
  where tracking_id = p_tracking_id;
end;
$$;

create or replace function public.increment_email_clicks(p_tracking_id text)
returns void language plpgsql security definer as $$
begin
  update public.email_logs
  set clicks_count = clicks_count + 1,
      clicked_at = coalesce(clicked_at, now())
  where tracking_id = p_tracking_id;
end;
$$;

-- Seed default templates
insert into public.email_templates (key, subject, body_html, variables) values
  ('contact_confirmation', 'We received your message', '<p>Hi {{name}},</p><p>Thank you for getting in touch. We''ll respond within 24 hours.</p><p>Best regards,<br>{{businessName}}</p>', '["name", "businessName"]'),
  ('booking_confirmation', 'Booking Confirmed: {{sessionType}}', '<p>Hi {{clientName}},</p><p>Your <strong>{{sessionType}}</strong> has been confirmed for:</p><p><strong>{{date}}</strong> at <strong>{{time}}</strong></p>{{#meetingUrl}}<p><a href="{{meetingUrl}}">Join Meeting</a></p>{{/meetingUrl}}<p>See you then!</p>', '["clientName", "sessionType", "date", "time", "meetingUrl"]'),
  ('booking_cancellation', 'Booking Cancelled: {{sessionType}}', '<p>Hi {{clientName}},</p><p>Your <strong>{{sessionType}}</strong> on <strong>{{date}}</strong> at <strong>{{time}}</strong> has been cancelled.</p><p>To book a new session, visit: <a href="{{bookUrl}}">{{bookUrl}}</a></p>', '["clientName", "sessionType", "date", "time", "bookUrl"]'),
  ('booking_reminder', 'Reminder: {{sessionType}} Tomorrow', '<p>Hi {{clientName}},</p><p>This is a friendly reminder that your <strong>{{sessionType}}</strong> is tomorrow:</p><p><strong>{{date}}</strong> at <strong>{{time}}</strong></p>{{#meetingUrl}}<p><a href="{{meetingUrl}}">Join Meeting</a></p>{{/meetingUrl}}', '["clientName", "sessionType", "date", "time", "meetingUrl"]'),
  ('booking_reschedule', 'Booking Rescheduled: {{sessionType}}', '<p>Hi {{clientName}},</p><p>Your <strong>{{sessionType}}</strong> has been rescheduled:</p><p><s>{{oldDate}} at {{oldTime}}</s></p><p><strong>{{newDate}}</strong> at <strong>{{newTime}}</strong></p>{{#teamsUrl}}<p><a href="{{teamsUrl}}">Join Meeting</a></p>{{/teamsUrl}}', '["clientName", "sessionType", "oldDate", "oldTime", "newDate", "newTime", "teamsUrl"]'),
  ('order_confirmation', 'Order Confirmed: #{{orderNumber}}', '<p>Hi {{clientName}},</p><p>Thank you for your order <strong>#{{orderNumber}}</strong>.</p><p>Total: <strong>{{total}}</strong></p><p>We''ll notify you when your order is ready.</p>', '["clientName", "orderNumber", "total"]'),
  ('welcome', 'Welcome to {{businessName}}', '<p>Hi {{name}},</p><p>Welcome to <strong>{{businessName}}</strong>! Your account has been created.</p><p>You can access your portal at: <a href="{{portalUrl}}">{{portalUrl}}</a></p>', '["name", "businessName", "portalUrl"]'),
  ('password_reset', 'Reset Your Password', '<p>Hi {{name}},</p><p>We received a request to reset your password. Click the link below to set a new one:</p><p><a href="{{resetUrl}}">Reset Password</a></p><p>This link expires in {{expiryMinutes}} minutes. If you didn''t request this, you can safely ignore this email.</p>', '["name", "resetUrl", "expiryMinutes"]')
on conflict (key) do nothing;
