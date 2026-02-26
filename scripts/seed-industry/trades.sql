-- ============================================================
-- trades.sql — Industry seed: Plumber, Electrician, Carpenter
-- Overrides generic seed with trade-specific content
-- ============================================================

-- Override site settings
update public.site_content
set content = content || '{
  "company_tagline": {"en": "Quality workmanship you can trust", "af": "Kwaliteit vakmanskap waarop u kan vertrou"},
  "business_hours": "Mon-Fri 07:00-17:00, Sat 08:00-13:00"
}'::jsonb
where section_key = 'site_settings';

-- Override homepage hero
update public.homepage_sections
set content = '{
  "heading": {"en": "Expert Trade Services", "af": "Kundige Handelsdienste"},
  "subheading": {"en": "Reliable, professional, and affordable", "af": "Betroubaar, professioneel, en bekostigbaar"},
  "cta_text": {"en": "Get a Free Quote", "af": "Kry n Gratis Kwotasie"},
  "cta_url": "/contact",
  "background_image": null
}'::jsonb
where section_key = 'hero';

-- Override services section
update public.homepage_sections
set content = '{
  "heading": {"en": "Our Services", "af": "Ons Dienste"},
  "subheading": {"en": "From repairs to full installations", "af": "Van herstelwerk tot volledige installasies"},
  "items": [
    {"icon": "Wrench", "title": {"en": "Repairs & Maintenance", "af": "Herstel & Onderhoud"}, "description": {"en": "Quick and reliable repair services for your home or business.", "af": "Vinnige en betroubare hersteldienste vir u huis of besigheid."}},
    {"icon": "Home", "title": {"en": "New Installations", "af": "Nuwe Installasies"}, "description": {"en": "Professional installation of new systems and fixtures.", "af": "Professionele installasie van nuwe stelsels en toebehore."}},
    {"icon": "Shield", "title": {"en": "Inspections", "af": "Inspeksies"}, "description": {"en": "Thorough inspections and compliance certificates.", "af": "Deeglike inspeksies en nakomingsertifikate."}},
    {"icon": "Clock", "title": {"en": "Emergency Call-outs", "af": "Noodoproepe"}, "description": {"en": "Available for urgent jobs when you need us most.", "af": "Beskikbaar vir dringende werk wanneer u ons die meeste nodig het."}}
  ]
}'::jsonb
where section_key = 'services';

-- Trade-specific FAQs
delete from public.faqs;
insert into public.faqs (question, answer, display_order, is_active) values
  ('{"en": "Do you offer free quotes?", "af": "Bied julle gratis kwotasies aan?"}'::jsonb,
   '{"en": "Yes! Contact us for a free, no-obligation quote. We will assess your needs and provide a detailed estimate.", "af": "Ja! Kontak ons vir n gratis, nie-bindende kwotasie. Ons sal u behoeftes assesseer en n gedetailleerde skatting verskaf."}'::jsonb,
   1, true),
  ('{"en": "What areas do you service?", "af": "Watter areas bedien julle?"}'::jsonb,
   '{"en": "We serve the greater metropolitan area and surrounding suburbs. Contact us to check if we cover your area.", "af": "Ons bedien die groter metropolitaanse gebied en omliggende voorstede. Kontak ons om te kyk of ons u area dek."}'::jsonb,
   2, true),
  ('{"en": "Are you licensed and insured?", "af": "Is julle gelisensieer en verseker?"}'::jsonb,
   '{"en": "Yes, we are fully licensed, insured, and compliant with all relevant regulations.", "af": "Ja, ons is ten volle gelisensieer, verseker, en voldoen aan alle relevante regulasies."}'::jsonb,
   3, true),
  ('{"en": "Do you handle emergency jobs?", "af": "Hanteer julle noodwerk?"}'::jsonb,
   '{"en": "We offer emergency call-out services during business hours. Contact us directly for urgent matters.", "af": "Ons bied noodoproepdienste aan gedurende besigheidsure. Kontak ons direk vir dringende sake."}'::jsonb,
   4, true),
  ('{"en": "What payment methods do you accept?", "af": "Watter betaalmetodes aanvaar julle?"}'::jsonb,
   '{"en": "We accept EFT, cash, and card payments. Payment terms are discussed before work begins.", "af": "Ons aanvaar EFT, kontant, en kaartbetalings. Betalingsvoorwaardes word bespreek voordat werk begin."}'::jsonb,
   5, true);
