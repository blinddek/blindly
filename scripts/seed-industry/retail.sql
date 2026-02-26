-- ============================================================
-- retail.sql — Industry seed: Shop, Bakery, Retail
-- Overrides generic seed with retail/commerce content
-- ============================================================

-- Override site settings
update public.site_content
set content = content || '{
  "company_tagline": {"en": "Quality products, exceptional service", "af": "Kwaliteit produkte, uitsonderlike diens"},
  "business_hours": "Mon-Fri 09:00-18:00, Sat 09:00-14:00"
}'::jsonb
where section_key = 'site_settings';

-- Add Shop nav link
insert into public.nav_links (label, href, display_order, is_active) values
  ('{"en": "Shop", "af": "Winkel"}'::jsonb, '/shop', 3, true)
on conflict do nothing;

-- Override homepage hero
update public.homepage_sections
set content = '{
  "heading": {"en": "Welcome to Our Store", "af": "Welkom by Ons Winkel"},
  "subheading": {"en": "Discover our curated collection", "af": "Ontdek ons gekeurde versameling"},
  "cta_text": {"en": "Shop Now", "af": "Koop Nou"},
  "cta_url": "/shop",
  "background_image": null
}'::jsonb
where section_key = 'hero';

-- Override services → products section
update public.homepage_sections
set content = '{
  "heading": {"en": "Featured Products", "af": "Voorgestelde Produkte"},
  "subheading": {"en": "Our best sellers and new arrivals", "af": "Ons topverkopers en nuwe aankomstes"},
  "items": [
    {"icon": "Package", "title": {"en": "New Arrivals", "af": "Nuwe Aankomstes"}, "description": {"en": "Check out our latest additions to the store.", "af": "Kyk na ons nuutste toevoegings tot die winkel."}},
    {"icon": "Star", "title": {"en": "Best Sellers", "af": "Topverkopers"}, "description": {"en": "Our most popular products loved by customers.", "af": "Ons gewildste produkte geliefd deur kliënte."}},
    {"icon": "Truck", "title": {"en": "Fast Delivery", "af": "Vinnige Aflewering"}, "description": {"en": "Quick and reliable delivery to your door.", "af": "Vinnige en betroubare aflewering na u deur."}},
    {"icon": "CreditCard", "title": {"en": "Secure Payment", "af": "Veilige Betaling"}, "description": {"en": "Safe and secure online payment options.", "af": "Veilige aanlyn betaalopsies."}}
  ]
}'::jsonb
where section_key = 'services';

-- Retail-specific FAQs
delete from public.faqs;
insert into public.faqs (question, answer, display_order, is_active) values
  ('{"en": "How long does delivery take?", "af": "Hoe lank neem aflewering?"}'::jsonb,
   '{"en": "Standard delivery takes 3-5 business days. Express delivery is available for an additional fee.", "af": "Standaard aflewering neem 3-5 werksdae. Spoedaflewering is beskikbaar teen n bykomende fooi."}'::jsonb,
   1, true),
  ('{"en": "What is your return policy?", "af": "Wat is julle terugkeerbeleid?"}'::jsonb,
   '{"en": "We accept returns within 14 days of purchase. Items must be unused and in original packaging.", "af": "Ons aanvaar terugsendings binne 14 dae na aankoop. Items moet ongebruik en in oorspronklike verpakking wees."}'::jsonb,
   2, true),
  ('{"en": "Do you offer gift wrapping?", "af": "Bied julle geskenkpapier aan?"}'::jsonb,
   '{"en": "Yes! Gift wrapping is available at checkout for a small fee.", "af": "Ja! Geskenkpapier is beskikbaar by die betaalpunt teen n klein fooi."}'::jsonb,
   3, true),
  ('{"en": "Can I collect my order in-store?", "af": "Kan ek my bestelling in die winkel afhaal?"}'::jsonb,
   '{"en": "Yes, click-and-collect is available. Your order will be ready within 24 hours of placing it.", "af": "Ja, klik-en-haal is beskikbaar. U bestelling sal binne 24 uur na plasing gereed wees."}'::jsonb,
   4, true);

-- Sample product categories (if shop table exists)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'product_categories') then
    insert into public.product_categories (name, slug, display_order, is_active) values
      ('{"en": "New Arrivals", "af": "Nuwe Aankomstes"}'::jsonb, 'new-arrivals', 1, true),
      ('{"en": "Best Sellers", "af": "Topverkopers"}'::jsonb, 'best-sellers', 2, true),
      ('{"en": "Sale", "af": "Uitverkoping"}'::jsonb, 'sale', 3, true)
    on conflict (slug) do nothing;
  end if;
end;
$$;
