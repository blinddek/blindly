-- ============================================================
-- hospitality.sql — Industry seed: Restaurant, B&B, Guest House
-- Overrides generic seed with hospitality content
-- ============================================================

-- Override site settings
update public.site_content
set content = content || '{
  "company_tagline": {"en": "Where every guest feels at home", "af": "Waar elke gas tuis voel"},
  "business_hours": "Mon-Sun 07:00-22:00"
}'::jsonb
where section_key = 'site_settings';

-- Add Booking nav link
insert into public.nav_links (label, href, display_order, is_active) values
  ('{"en": "Book Now", "af": "Bespreek Nou"}'::jsonb, '/booking', 3, true)
on conflict do nothing;

-- Override homepage hero
update public.homepage_sections
set content = '{
  "heading": {"en": "Welcome to Our Establishment", "af": "Welkom by Ons Instelling"},
  "subheading": {"en": "Experience exceptional hospitality and warm service", "af": "Ervaar uitsonderlike gasvryheid en warm diens"},
  "cta_text": {"en": "Book Your Stay", "af": "Bespreek U Verblyf"},
  "cta_url": "/booking",
  "background_image": null
}'::jsonb
where section_key = 'hero';

-- Override services → hospitality services section
update public.homepage_sections
set content = '{
  "heading": {"en": "Our Services", "af": "Ons Dienste"},
  "subheading": {"en": "Everything you need for a memorable experience", "af": "Alles wat u nodig het vir n onvergeetlike ervaring"},
  "items": [
    {"icon": "Bed", "title": {"en": "Accommodation", "af": "Akkommodasie"}, "description": {"en": "Comfortable rooms and suites for every budget.", "af": "Gerieflike kamers en suites vir elke begroting."}},
    {"icon": "UtensilsCrossed", "title": {"en": "Dining", "af": "Eet"}, "description": {"en": "Fresh, locally-sourced cuisine prepared with care.", "af": "Vars, plaaslik-verkrygde kos met sorg berei."}},
    {"icon": "PartyPopper", "title": {"en": "Events & Functions", "af": "Geleenthede & Funksies"}, "description": {"en": "Venue hire for weddings, conferences, and celebrations.", "af": "Lokaal te huur vir troues, konferensies en vieringe."}},
    {"icon": "MapPin", "title": {"en": "Local Experiences", "af": "Plaaslike Ervarings"}, "description": {"en": "Curated tours and activities in the surrounding area.", "af": "Gekeurde toere en aktiwiteite in die omgewing."}}
  ]
}'::jsonb
where section_key = 'services';

-- Hospitality-specific FAQs
delete from public.faqs;
insert into public.faqs (question, answer, display_order, is_active) values
  ('{"en": "What are your check-in and check-out times?", "af": "Wat is julle in- en uittektye?"}'::jsonb,
   '{"en": "Check-in is from 14:00 and check-out is by 10:00. Early check-in or late check-out may be arranged on request.", "af": "Inteken is vanaf 14:00 en uitteken is teen 10:00. Vroeë inteken of laat uitteken kan op versoek gereël word."}'::jsonb,
   1, true),
  ('{"en": "Do you cater for dietary requirements?", "af": "Maak julle voorsiening vir dieetbehoeftes?"}'::jsonb,
   '{"en": "Yes, we cater for vegetarian, vegan, halaal, and gluten-free diets. Please inform us of any requirements when booking.", "af": "Ja, ons maak voorsiening vir vegetariese, veganiese, halaal en glutenvry diëte. Lig ons asseblief in by bespreking."}'::jsonb,
   2, true),
  ('{"en": "Is parking available?", "af": "Is parkering beskikbaar?"}'::jsonb,
   '{"en": "Yes, free on-site parking is available for all guests. Secure overnight parking is also provided.", "af": "Ja, gratis parkering op die terrein is beskikbaar vir alle gaste. Veilige oornag-parkering word ook voorsien."}'::jsonb,
   3, true),
  ('{"en": "Can I host a private event at your venue?", "af": "Kan ek n privaat geleentheid by julle lokaal hou?"}'::jsonb,
   '{"en": "Absolutely! We offer function venues for events of 10-200 guests. Contact us for a personalised quote.", "af": "Beslis! Ons bied funksielokale vir geleenthede van 10-200 gaste. Kontak ons vir n persoonlike kwotasie."}'::jsonb,
   4, true);

-- Sample booking services (if table exists)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'booking_services') then
    insert into public.booking_services (name, duration_minutes, buffer_minutes, price_cents, is_active) values
      ('{"en": "Standard Room", "af": "Standaard Kamer"}'::jsonb, 1440, 120, 95000, true),
      ('{"en": "Deluxe Suite", "af": "Luukse Suite"}'::jsonb, 1440, 120, 175000, true),
      ('{"en": "Function Venue (Half Day)", "af": "Funksielokaal (Halfdag)"}'::jsonb, 300, 60, 350000, true)
    on conflict do nothing;
  end if;
end;
$$;
