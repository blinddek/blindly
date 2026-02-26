-- ============================================================
-- seed.sql — Blindly site data
-- Run after all migrations.
-- ============================================================

-- ─── Site Settings ───────────────────────────────────────────
insert into public.site_content (section_key, content) values
  ('site_settings', '{
    "logo_text": "Blindly",
    "company_name": "Blindly",
    "company_tagline": {"en": "Your Windows, Your Way."},
    "login_label": {"en": "Login"},
    "login_url": "/login",
    "cta_label": {"en": "Configure Your Blinds"},
    "cta_url": "/shop",
    "whatsapp_number": "",
    "phone_number": "",
    "email": "",
    "address": "",
    "google_maps_url": "",
    "google_maps_coordinates": null,
    "business_hours": "Mon-Fri 08:00-17:00",
    "social_links": []
  }'::jsonb)
on conflict (section_key) do nothing;

-- ─── Navigation Links ────────────────────────────────────────
insert into public.nav_links (label, href, display_order, is_active) values
  ('{"en": "Home"}'::jsonb, '/', 1, true),
  ('{"en": "Products"}'::jsonb, '/shop', 2, true),
  ('{"en": "About"}'::jsonb, '/about', 3, true),
  ('{"en": "Contact"}'::jsonb, '/contact', 4, true),
  ('{"en": "FAQ"}'::jsonb, '/faq', 5, true)
on conflict do nothing;

-- ─── Footer Sections ─────────────────────────────────────────
insert into public.footer_sections (title, links, display_order, is_active) values
  (
    '{"en": "Shop"}'::jsonb,
    '[
      {"label": {"en": "All Products"}, "href": "/shop"},
      {"label": {"en": "Roller Blinds"}, "href": "/shop?category=roller"},
      {"label": {"en": "Venetian Blinds"}, "href": "/shop?category=venetian"},
      {"label": {"en": "Vertical Blinds"}, "href": "/shop?category=vertical"}
    ]'::jsonb,
    1, true
  ),
  (
    '{"en": "Company"}'::jsonb,
    '[
      {"label": {"en": "About Us"}, "href": "/about"},
      {"label": {"en": "Contact"}, "href": "/contact"},
      {"label": {"en": "FAQ"}, "href": "/faq"}
    ]'::jsonb,
    2, true
  ),
  (
    '{"en": "Legal"}'::jsonb,
    '[
      {"label": {"en": "Terms of Service"}, "href": "/terms"},
      {"label": {"en": "Privacy Policy"}, "href": "/privacy"}
    ]'::jsonb,
    3, true
  )
on conflict do nothing;

-- ─── Page SEO ────────────────────────────────────────────────
insert into public.page_seo (page_key, title, description) values
  ('home',     '{"en": "Blindly — Your Windows, Your Way"}'::jsonb,
               '{"en": "Premium custom window blinds — roller, venetian, and vertical — configured to your exact measurements and delivered to your door."}'::jsonb),
  ('about',    '{"en": "About Blindly"}'::jsonb,
               '{"en": "A new approach to buying window blinds in South Africa. Configure online, get instant pricing, and enjoy doorstep delivery."}'::jsonb),
  ('contact',  '{"en": "Contact Us"}'::jsonb,
               '{"en": "Get in touch with the Blindly team for questions, professional measure requests, or installation enquiries."}'::jsonb),
  ('faq',      '{"en": "FAQ"}'::jsonb,
               '{"en": "Frequently asked questions about ordering, measuring, delivery, and installation of Blindly window blinds."}'::jsonb),
  ('terms',    '{"en": "Terms of Service"}'::jsonb,
               '{"en": "Terms and conditions for purchasing from Blindly."}'::jsonb),
  ('privacy',  '{"en": "Privacy Policy"}'::jsonb,
               '{"en": "How Blindly collects, uses, and protects your personal data."}'::jsonb),
  ('shop',     '{"en": "Products"}'::jsonb,
               '{"en": "Browse and configure premium custom blinds — roller, venetian, and vertical — with instant online pricing."}'::jsonb)
on conflict (page_key) do nothing;

-- ─── Site Content (hero, about, trust, CTA) ─────────────────
insert into public.site_content (section_key, content) values
  ('hero_heading',       '{"en": "Your Windows, Your Way."}'::jsonb),
  ('hero_subheading',    '{"en": "Premium custom blinds — roller, venetian, and vertical — configured to your exact measurements and delivered to your door."}'::jsonb),
  ('hero_cta_primary',   '{"en": "Start Configuring"}'::jsonb),
  ('hero_cta_secondary', '{"en": "Browse Products"}'::jsonb),
  ('about_story',        '{"en": "Blindly is a new approach to buying window blinds in South Africa. We believe you shouldn''t have to visit a showroom or wait days for a quote. Our online configurator lets you choose your blind type, select your material and colour, enter your exact measurements, and get an instant price — all from the comfort of your home."}'::jsonb),
  ('trust_strip',        '{"en": "Free Delivery Over R5,000 · Professional Installation Available · Quality Materials · SA Manufactured"}'::jsonb),
  ('cta_heading',        '{"en": "Not sure what you need?"}'::jsonb),
  ('cta_text',           '{"en": "Request a free professional measure or browse our product range to find the perfect blinds for your home."}'::jsonb)
on conflict (section_key) do nothing;

-- ─── Homepage Sections ───────────────────────────────────────
insert into public.homepage_sections (section_key, content, display_order, is_active) values
  ('hero', '{
    "heading": {"en": "Your Windows, Your Way."},
    "subheading": {"en": "Premium custom blinds — roller, venetian, and vertical — configured to your exact measurements and delivered to your door."},
    "cta_text": {"en": "Start Configuring"},
    "cta_url": "/shop",
    "cta_secondary_text": {"en": "Browse Products"},
    "cta_secondary_url": "/shop",
    "background_image": null
  }'::jsonb, 1, true),

  ('trust_strip', '{
    "text": {"en": "Free Delivery Over R5,000 · Professional Installation Available · Quality Materials · SA Manufactured"}
  }'::jsonb, 2, true),

  ('products', '{
    "heading": {"en": "Our Product Range"},
    "subheading": {"en": "Choose your style, configure your specs, and order online."},
    "items": []
  }'::jsonb, 3, true),

  ('about', '{
    "heading": {"en": "Why Blindly?"},
    "body": {"en": "Blindly is a new approach to buying window blinds in South Africa. We believe you shouldn''t have to visit a showroom or wait days for a quote. Our online configurator lets you choose your blind type, select your material and colour, enter your exact measurements, and get an instant price — all from the comfort of your home."},
    "image": null
  }'::jsonb, 4, true),

  ('testimonials', '{
    "heading": {"en": "What Our Customers Say"},
    "items": []
  }'::jsonb, 5, true),

  ('cta', '{
    "heading": {"en": "Not sure what you need?"},
    "body": {"en": "Request a free professional measure or browse our product range to find the perfect blinds for your home."},
    "button_text": {"en": "Configure Your Blinds"},
    "button_url": "/shop"
  }'::jsonb, 6, true)
on conflict (section_key) do nothing;

-- ─── FAQs ────────────────────────────────────────────────────
insert into public.faqs (question, answer, display_order, is_active) values
  ('{"en": "How do I measure my windows?"}'::jsonb,
   '{"en": "We provide a detailed measuring guide with every product page. You''ll need a tape measure and a few minutes per window. If you''d prefer professional help, we also offer a free measure service in select areas."}'::jsonb,
   1, true),
  ('{"en": "What blind types do you offer?"}'::jsonb,
   '{"en": "We currently offer roller blinds, venetian blinds (aluminium and wood), and vertical blinds. Each type is available in a wide range of materials and colours."}'::jsonb,
   2, true),
  ('{"en": "How long does delivery take?"}'::jsonb,
   '{"en": "Custom blinds are manufactured to order and typically delivered within 7-14 business days, depending on your location and the product selected."}'::jsonb,
   3, true),
  ('{"en": "Do you offer installation?"}'::jsonb,
   '{"en": "Yes, professional installation is available in most major metros. You can add installation at checkout or opt to self-install — our blinds come with full fitting instructions."}'::jsonb,
   4, true),
  ('{"en": "Is delivery free?"}'::jsonb,
   '{"en": "Delivery is free on orders over R5,000. For smaller orders, a flat delivery fee is calculated at checkout based on your location."}'::jsonb,
   5, true),
  ('{"en": "Can I return or exchange my blinds?"}'::jsonb,
   '{"en": "Because each blind is custom-made to your specifications, we cannot accept returns for change of mind. However, if there is a manufacturing defect or error, we will replace your blinds at no cost."}'::jsonb,
   6, true)
on conflict do nothing;

-- ─── Admin User Note ─────────────────────────────────────────
-- To create an admin user:
-- 1. Sign up via the Supabase Auth dashboard or the app's register page
-- 2. Then update the role in user_profiles:
--    UPDATE public.user_profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
-- 3. The custom_access_token_hook will pick up the role on next login.
