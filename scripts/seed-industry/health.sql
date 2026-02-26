-- ============================================================
-- health.sql — Industry seed: Salon, Therapy, Dentist, Wellness
-- Overrides generic seed with health & wellness content
-- ============================================================

-- Override site settings
update public.site_content
set content = content || '{
  "company_tagline": {"en": "Your wellness is our priority", "af": "U welstand is ons prioriteit"},
  "business_hours": "Mon-Fri 08:00-17:00, Sat 08:00-13:00"
}'::jsonb
where section_key = 'site_settings';

-- Add Booking nav link
insert into public.nav_links (label, href, display_order, is_active) values
  ('{"en": "Book Appointment", "af": "Bespreek Afspraak"}'::jsonb, '/booking', 3, true)
on conflict do nothing;

-- Override homepage hero
update public.homepage_sections
set content = '{
  "heading": {"en": "Your Journey to Wellness Starts Here", "af": "U Reis na Welstand Begin Hier"},
  "subheading": {"en": "Professional care in a relaxing environment", "af": "Professionele sorg in n ontspannende omgewing"},
  "cta_text": {"en": "Book an Appointment", "af": "Bespreek n Afspraak"},
  "cta_url": "/booking",
  "background_image": null
}'::jsonb
where section_key = 'hero';

-- Override services → treatments section
update public.homepage_sections
set content = '{
  "heading": {"en": "Our Services", "af": "Ons Dienste"},
  "subheading": {"en": "Comprehensive care tailored to your needs", "af": "Omvattende sorg aangepas vir u behoeftes"},
  "items": [
    {"icon": "Heart", "title": {"en": "Consultations", "af": "Konsultasies"}, "description": {"en": "Thorough initial assessments and follow-up appointments.", "af": "Deeglike aanvanklike assesserings en opvolgafsprake."}},
    {"icon": "Sparkles", "title": {"en": "Treatments", "af": "Behandelings"}, "description": {"en": "Professional treatments using the latest techniques.", "af": "Professionele behandelings met die nuutste tegnieke."}},
    {"icon": "Calendar", "title": {"en": "Wellness Programs", "af": "Welstandsprogramme"}, "description": {"en": "Structured programs for long-term health and wellness.", "af": "Gestruktureerde programme vir langtermyn gesondheid en welstand."}},
    {"icon": "ShieldCheck", "title": {"en": "Aftercare", "af": "Nasorg"}, "description": {"en": "Ongoing support and follow-up care for the best results.", "af": "Deurlopende ondersteuning en opvolgsorg vir die beste resultate."}}
  ]
}'::jsonb
where section_key = 'services';

-- Health & wellness specific FAQs
delete from public.faqs;
insert into public.faqs (question, answer, display_order, is_active) values
  ('{"en": "How do I book an appointment?", "af": "Hoe bespreek ek n afspraak?"}'::jsonb,
   '{"en": "You can book online through our website, call us during business hours, or send a WhatsApp message. We will confirm your appointment within 24 hours.", "af": "U kan aanlyn bespreek deur ons webwerf, ons bel tydens besigheidsure, of n WhatsApp-boodskap stuur. Ons sal u afspraak binne 24 uur bevestig."}'::jsonb,
   1, true),
  ('{"en": "What is your cancellation policy?", "af": "Wat is julle kanselleringsbeleid?"}'::jsonb,
   '{"en": "We require 24 hours notice for cancellations. Late cancellations or no-shows may incur a fee.", "af": "Ons vereis 24 uur kennis vir kansellerings. Laat kansellerings of nie-opdagings kan n fooi meebring."}'::jsonb,
   2, true),
  ('{"en": "Do you accept medical aid?", "af": "Aanvaar julle mediese fonds?"}'::jsonb,
   '{"en": "We accept most major medical aids. Please bring your medical aid card and ID to your appointment. We can also provide invoices for out-of-pocket claims.", "af": "Ons aanvaar die meeste groot mediese fondse. Bring asseblief u mediese fondskaart en ID na u afspraak. Ons kan ook fakture verskaf vir uit-die-sak-eise."}'::jsonb,
   3, true),
  ('{"en": "Is there parking available?", "af": "Is daar parkering beskikbaar?"}'::jsonb,
   '{"en": "Yes, we have dedicated parking available for clients directly outside our practice.", "af": "Ja, ons het toegewyde parkering beskikbaar vir kliënte direk buite ons praktyk."}'::jsonb,
   4, true),
  ('{"en": "What should I bring to my first appointment?", "af": "Wat moet ek saambring na my eerste afspraak?"}'::jsonb,
   '{"en": "Please bring your ID, medical aid details, and any relevant medical history or referral letters.", "af": "Bring asseblief u ID, mediese fondsbesonderhede, en enige relevante mediese geskiedenis of verwysingsbriewe."}'::jsonb,
   5, true);

-- Sample booking services with buffer times (if table exists)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'booking_services') then
    insert into public.booking_services (name, duration_minutes, buffer_minutes, price_cents, cancellation_cutoff_hours, is_active) values
      ('{"en": "Initial Consultation", "af": "Aanvanklike Konsultasie"}'::jsonb, 60, 15, 65000, 24, true),
      ('{"en": "Follow-up Appointment", "af": "Opvolgafspraak"}'::jsonb, 30, 10, 45000, 24, true),
      ('{"en": "Treatment Session", "af": "Behandelingsessie"}'::jsonb, 45, 15, 55000, 24, true),
      ('{"en": "Extended Treatment", "af": "Verlengde Behandeling"}'::jsonb, 90, 20, 95000, 48, true)
    on conflict do nothing;

    -- Default availability (Mon-Fri 08:00-17:00, Sat 08:00-13:00)
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'availability_rules') then
      insert into public.availability_rules (service_id, day_of_week, start_time, end_time) values
        (null, 1, '08:00', '17:00'),
        (null, 2, '08:00', '17:00'),
        (null, 3, '08:00', '17:00'),
        (null, 4, '08:00', '17:00'),
        (null, 5, '08:00', '17:00'),
        (null, 6, '08:00', '13:00')
      on conflict do nothing;
    end if;
  end if;
end;
$$;
