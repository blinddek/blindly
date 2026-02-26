-- ============================================================
-- seed.sql — Blindly site data
-- Run after all migrations.
-- ============================================================

-- ─── Site Settings ───────────────────────────────────────────
insert into public.site_content (section_key, content) values
  ('site_settings', '{
    "logo_text": "Blindly",
    "company_name": "Blindly",
    "company_tagline": {"en": "Your Windows, Your Way.", "af": "Jou Vensters, Jou Manier."},
    "login_label": {"en": "Login", "af": "Teken In"},
    "login_url": "/login",
    "cta_label": {"en": "Configure Your Blinds", "af": "Stel Jou Blindings Op"},
    "cta_url": "/shop",
    "whatsapp_number": "",
    "phone_number": "",
    "email": "",
    "address": "",
    "google_maps_url": "",
    "google_maps_coordinates": null,
    "business_hours": "Mon-Fri 08:00-17:00, Sat 09:00-13:00",
    "social_links": []
  }'::jsonb)
on conflict (section_key) do update set content = excluded.content;

-- ─── Navigation Links ────────────────────────────────────────
delete from public.nav_links;
insert into public.nav_links (label, href, display_order, is_active) values
  ('{"en": "Home", "af": "Tuis"}'::jsonb, '/', 1, true),
  ('{"en": "Configure", "af": "Konfigureer"}'::jsonb, '/configure', 2, true),
  ('{"en": "Products", "af": "Produkte"}'::jsonb, '/shop', 3, true),
  ('{"en": "About", "af": "Oor Ons"}'::jsonb, '/about', 4, true),
  ('{"en": "Contact", "af": "Kontak"}'::jsonb, '/contact', 5, true),
  ('{"en": "FAQ", "af": "Vrae"}'::jsonb, '/faq', 6, true);

-- ─── Footer Sections ─────────────────────────────────────────
delete from public.footer_sections;
insert into public.footer_sections (title, links, display_order, is_active) values
  (
    '{"en": "Shop", "af": "Winkel"}'::jsonb,
    '[
      {"label": {"en": "All Products"}, "href": "/shop"},
      {"label": {"en": "Roller Blinds"}, "href": "/shop?category=roller"},
      {"label": {"en": "Venetian Blinds"}, "href": "/shop?category=venetian"},
      {"label": {"en": "Vertical Blinds"}, "href": "/shop?category=vertical"}
    ]'::jsonb,
    1, true
  ),
  (
    '{"en": "Company", "af": "Maatskappy"}'::jsonb,
    '[
      {"label": {"en": "About Us"}, "href": "/about"},
      {"label": {"en": "Contact"}, "href": "/contact"},
      {"label": {"en": "FAQ"}, "href": "/faq"}
    ]'::jsonb,
    2, true
  ),
  (
    '{"en": "Legal", "af": "Wettig"}'::jsonb,
    '[
      {"label": {"en": "Terms of Service"}, "href": "/terms"},
      {"label": {"en": "Privacy Policy"}, "href": "/privacy"}
    ]'::jsonb,
    3, true
  );

-- ─── Page SEO ────────────────────────────────────────────────
insert into public.page_seo (page_key, title, description) values
  ('home',    '{"en": "Blindly — Premium Custom Window Blinds | Your Windows, Your Way"}'::jsonb,
              '{"en": "Premium custom window blinds — roller, venetian, and vertical — configured to your exact measurements and delivered to your door."}'::jsonb),
  ('about',   '{"en": "About Blindly — A New Way to Buy Blinds"}'::jsonb,
              '{"en": "A fresh approach to buying window blinds in South Africa. Configure online, get instant pricing, and enjoy doorstep delivery."}'::jsonb),
  ('contact', '{"en": "Contact Blindly"}'::jsonb,
              '{"en": "Get in touch with the Blindly team for questions, professional measure requests, or installation enquiries."}'::jsonb),
  ('faq',     '{"en": "FAQ — Blindly"}'::jsonb,
              '{"en": "Frequently asked questions about ordering, measuring, delivery, and installation of custom window blinds."}'::jsonb),
  ('terms',   '{"en": "Terms of Service — Blindly"}'::jsonb,
              '{"en": "Terms and conditions for purchasing custom blinds from Blindly."}'::jsonb),
  ('privacy', '{"en": "Privacy Policy — Blindly"}'::jsonb,
              '{"en": "How Blindly collects, uses, and protects your personal data."}'::jsonb),
  ('shop',    '{"en": "Custom Blinds — Configure & Order Online | Blindly"}'::jsonb,
              '{"en": "Browse and configure premium custom blinds — roller, venetian, and vertical — with instant online pricing."}'::jsonb)
on conflict (page_key) do update set
  title = excluded.title,
  description = excluded.description;

-- ─── Homepage Sections ───────────────────────────────────────
delete from public.homepage_sections;
insert into public.homepage_sections (section_key, content, display_order, is_active) values
  ('hero', '{
    "heading": {"en": "Your Windows, Your Way."},
    "subheading": {"en": "Premium custom blinds — roller, venetian, and vertical — configured to your exact measurements and delivered to your door."},
    "cta_text": {"en": "Configure Your Blinds"},
    "cta_url": "/shop",
    "cta_secondary_text": {"en": "Browse Products"},
    "cta_secondary_url": "/shop",
    "background_image": null
  }'::jsonb, 1, true),

  ('trust_stats', '{
    "items": [
      {"icon": "🚚", "value": "Free", "label": {"en": "Delivery Over R5,000"}},
      {"icon": "📐", "value": "Custom", "label": {"en": "Made to Measure"}},
      {"icon": "🇿🇦", "value": "SA", "label": {"en": "Manufactured Locally"}},
      {"icon": "⚡", "value": "Instant", "label": {"en": "Online Pricing"}}
    ]
  }'::jsonb, 2, true),

  ('how_it_works', '{
    "heading": {"en": "How It Works"},
    "subheading": {"en": "Four simple steps from your screen to your windows."},
    "items": [
      {"step": "1", "title": {"en": "Choose Your Style"}, "description": {"en": "Select from roller, venetian, or vertical blinds in a range of materials and colours."}},
      {"step": "2", "title": {"en": "Enter Measurements"}, "description": {"en": "Measure your windows using our step-by-step guide. We''ll validate everything for you."}},
      {"step": "3", "title": {"en": "Get Instant Pricing"}, "description": {"en": "See your price update live as you configure. No waiting for quotes or callbacks."}},
      {"step": "4", "title": {"en": "Checkout & Relax"}, "description": {"en": "Pay securely online. Your custom blinds are manufactured and delivered to your door."}}
    ]
  }'::jsonb, 3, true),

  ('products', '{
    "heading": {"en": "Our Product Range"},
    "subheading": {"en": "Choose your style, configure your specs, and order online."},
    "items": [
      {
        "icon": "Blinds",
        "title": {"en": "Roller Blinds"},
        "description": {"en": "Clean, modern lines. Choose from blockout, sunscreen, or translucent fabrics in a wide range of colours and patterns."},
        "href": "/shop?category=roller",
        "image": null
      },
      {
        "icon": "AlignJustify",
        "title": {"en": "Venetian Blinds"},
        "description": {"en": "Classic light control with aluminium or real wood slats. Available in 25mm and 50mm widths across dozens of finishes."},
        "href": "/shop?category=venetian",
        "image": null
      },
      {
        "icon": "Columns3",
        "title": {"en": "Vertical Blinds"},
        "description": {"en": "Ideal for sliding doors and wide windows. Fabric or PVC louvres with smooth tilt and draw operation."},
        "href": "/shop?category=vertical",
        "image": null
      }
    ]
  }'::jsonb, 4, true),

  ('about', '{
    "heading": {"en": "Why Blindly?"},
    "body": {"en": "Blindly is a new approach to buying window blinds in South Africa. We believe you shouldn''t have to visit a showroom or wait days for a quote. Our online configurator lets you choose your blind type, select your material and colour, enter your exact measurements, and get an instant price — all from the comfort of your home."}
  }'::jsonb, 5, true),

  ('testimonials', '{
    "heading": {"en": "What Our Customers Say"},
    "items": [
      {"name": "Sarah M.", "role": "Cape Town", "quote": {"en": "I was sceptical about ordering blinds online, but the configurator made it so easy. Perfect fit, beautiful quality."}},
      {"name": "Johan V.", "role": "Stellenbosch", "quote": {"en": "Instant pricing was a game-changer. No more waiting for quotes from three different companies."}},
      {"name": "Lisa K.", "role": "Johannesburg", "quote": {"en": "The measuring guide was really clear. My blinds arrived in 10 days and the installation was quick."}}
    ]
  }'::jsonb, 6, true),

  ('cta', '{
    "heading": {"en": "Not sure what you need?"},
    "body": {"en": "Request a free professional measure, order a colour swatch, or browse our product range to find the perfect blinds for your home."},
    "button_text": {"en": "Configure Your Blinds"},
    "button_url": "/shop"
  }'::jsonb, 7, true);

-- ─── Trust Strip (key-value) ─────────────────────────────────
insert into public.site_content (section_key, content) values
  ('trust_strip', '{"values": ["Free Delivery Over R5,000", "Professional Installation Available", "Quality Materials", "SA Manufactured", "Instant Online Pricing"]}'::jsonb)
on conflict (section_key) do update set content = excluded.content;

-- ─── About Page Content ──────────────────────────────────────
insert into public.site_content (section_key, content) values
  ('about', '{
    "heading": {"en": "About Blindly"},
    "mission": {"en": "Making premium custom blinds accessible to everyone — no showroom visits, no waiting for quotes, no guesswork."},
    "body": {"en": "Blindly was born from a simple frustration: buying window blinds in South Africa shouldn''t be so complicated. Traditional retailers require showroom visits, in-home consultations, and days of waiting just to get a price. We knew there had to be a better way.\n\nOur online configurator puts you in control. Choose your blind type — roller, venetian, or vertical — select your material, pick your colour, enter your measurements, and see your price update in real time. No phone calls, no callbacks, no surprises.\n\nWe source directly from trusted South African manufacturers, apply a transparent markup, and pass the savings on to you. Every blind is made to your exact specifications and delivered to your door. Professional installation is available if you need it, but our blinds are designed for easy DIY fitting too.\n\nBlindly is part of the Nortier Group, bringing decades of home improvement experience into the digital age. We combine craftsmanship with technology to give you the best of both worlds."},
    "process": [
      {"step": "1", "title": {"en": "Configure"}, "description": {"en": "Use our guided wizard to choose your blind type, material, colour, and enter your exact measurements."}},
      {"step": "2", "title": {"en": "Price"}, "description": {"en": "See your price update live — no waiting for callbacks or quotes. What you see is what you pay."}},
      {"step": "3", "title": {"en": "Order"}, "description": {"en": "Pay securely via Paystack. Your custom blinds go straight into production."}},
      {"step": "4", "title": {"en": "Enjoy"}, "description": {"en": "Receive your blinds at your door within 7-14 business days. Install yourself or book our team."}}
    ],
    "values": [
      {"title": {"en": "Instant Pricing"}, "description": {"en": "No more waiting for quotes. Our configurator calculates your price in real time based on your exact specifications."}},
      {"title": {"en": "Premium Quality"}, "description": {"en": "We source from trusted SA manufacturers. Every blind is made from quality materials with professional finishes."}},
      {"title": {"en": "Made to Measure"}, "description": {"en": "Every blind is manufactured to your exact window dimensions. No off-the-shelf compromises."}},
      {"title": {"en": "Free Delivery"}, "description": {"en": "Orders over R5,000 ship free anywhere in South Africa. Smaller orders attract a flat-rate fee."}},
      {"title": {"en": "Easy DIY or Pro Install"}, "description": {"en": "Our blinds come with clear fitting instructions. Or add professional installation at checkout."}},
      {"title": {"en": "No Showroom Needed"}, "description": {"en": "Everything happens online — from configuration to checkout. Shop from the comfort of your home."}}
    ]
  }'::jsonb)
on conflict (section_key) do update set content = excluded.content;

-- ─── FAQs ────────────────────────────────────────────────────
delete from public.faqs;
insert into public.faqs (question, answer, display_order, is_active) values
  ('{"en": "How do I measure my windows?"}'::jsonb,
   '{"en": "We provide a detailed step-by-step measuring guide for each blind type. You''ll need a metal tape measure and a few minutes per window. Measure width and drop in three places (top, middle, bottom for width; left, centre, right for drop) and use the smallest measurement. If you''d prefer professional help, we offer a free measure service in select areas."}'::jsonb,
   1, true),

  ('{"en": "What blind types do you offer?"}'::jsonb,
   '{"en": "We offer three main categories: Roller Blinds (blockout, sunscreen, and translucent fabrics), Venetian Blinds (25mm and 50mm in aluminium and real wood), and Vertical Blinds (fabric and PVC louvres). Each type comes in a wide range of materials, colours, and finishes."}'::jsonb,
   2, true),

  ('{"en": "How does online pricing work?"}'::jsonb,
   '{"en": "Our configurator calculates your price in real time as you select your options and enter measurements. The price you see is the price you pay — no hidden fees or surprise add-ons. Pricing is based on your blind type, material, colour range, and exact window dimensions."}'::jsonb,
   3, true),

  ('{"en": "How long does delivery take?"}'::jsonb,
   '{"en": "Custom blinds are manufactured to order and typically delivered within 7-14 business days, depending on your location and the product selected. You''ll receive tracking information once your order ships."}'::jsonb,
   4, true),

  ('{"en": "Is delivery free?"}'::jsonb,
   '{"en": "Delivery is free on orders over R5,000. For smaller orders, a flat delivery fee is calculated at checkout based on your location within South Africa."}'::jsonb,
   5, true),

  ('{"en": "Do you offer installation?"}'::jsonb,
   '{"en": "Yes, professional installation is available in most major metros. You can add installation at checkout or opt to self-install — our blinds come with full fitting instructions, brackets, and screws. Most blinds can be installed in under 15 minutes per window."}'::jsonb,
   6, true),

  ('{"en": "Will the colour match what I see on screen?"}'::jsonb,
   '{"en": "Screen colours can vary depending on your device and display settings. We recommend ordering a free colour swatch before placing a large order. While we do our best to represent colours accurately, slight variations between screen and actual product are normal and not grounds for a return."}'::jsonb,
   7, true),

  ('{"en": "Can I order swatches before buying?"}'::jsonb,
   '{"en": "Yes! We offer free colour swatches for all our materials. Request swatches through our product pages or contact form, and we''ll post them to you within 2-3 business days."}'::jsonb,
   8, true),

  ('{"en": "What is your return policy?"}'::jsonb,
   '{"en": "Because each blind is custom-made to your exact specifications, we cannot accept returns for change of mind. However, if there is a manufacturing defect, incorrect dimensions (our error), or damage during shipping, we will replace your blinds at no cost. Please inspect your order within 48 hours of delivery."}'::jsonb,
   9, true),

  ('{"en": "Can I order blinds for multiple windows at once?"}'::jsonb,
   '{"en": "Absolutely! Our configurator supports multi-window orders. Configure your first blind, then add another window — same type or different. Each blind gets its own measurements and specifications. You''ll see a running total as you add windows."}'::jsonb,
   10, true),

  ('{"en": "What payment methods do you accept?"}'::jsonb,
   '{"en": "We accept all major credit and debit cards via Paystack, including Visa, Mastercard, and American Express. All transactions are processed securely with SSL encryption."}'::jsonb,
   11, true),

  ('{"en": "Do you sell outside South Africa?"}'::jsonb,
   '{"en": "Currently, we only deliver within South Africa. We''re exploring options for neighbouring countries — sign up for our newsletter to be the first to know."}'::jsonb,
   12, true);

-- ─── Legacy Key-Value Content ────────────────────────────────
insert into public.site_content (section_key, content) values
  ('hero_heading',       '{"en": "Your Windows, Your Way."}'::jsonb),
  ('hero_subheading',    '{"en": "Premium custom blinds — roller, venetian, and vertical — configured to your exact measurements and delivered to your door."}'::jsonb),
  ('hero_cta_primary',   '{"en": "Configure Your Blinds"}'::jsonb),
  ('hero_cta_secondary', '{"en": "Browse Products"}'::jsonb),
  ('cta_heading',        '{"en": "Not sure what you need?"}'::jsonb),
  ('cta_text',           '{"en": "Request a free professional measure, order a colour swatch, or browse our product range to find the perfect blinds for your home."}'::jsonb)
on conflict (section_key) do update set content = excluded.content;

-- ─── Blind Categories (from migration 026) ─────────────────
-- Only insert if the blind_categories table exists (run after migrations 026+)
insert into public.blind_categories (name, slug, description, image_url, display_order) values
  ('Roller Blinds', 'roller', 'Clean, modern lines with a wide choice of fabrics — blockout, sunscreen, and translucent.', null, 1),
  ('Aluminium Venetian', 'aluminium-venetian', 'Classic light control with durable aluminium slats in 25mm and 50mm widths.', null, 2),
  ('Wood & Natural Venetian', 'wood-venetian', 'Real wood, bamboo, and PVC venetian blinds for a warm, natural look.', null, 3),
  ('Vertical Blinds', 'vertical', 'Ideal for sliding doors and wide windows — fabric or PVC louvres.', null, 4)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  display_order = excluded.display_order;

-- ─── Blind Types ────────────────────────────────────────────
insert into public.blind_types (category_id, name, slug, slat_size_mm, material, min_width_cm, max_width_cm, min_drop_cm, max_drop_cm, min_frame_depth_mm, display_order) values
  ((select id from blind_categories where slug = 'roller'), 'Roller', 'roller-standard', null, 'fabric', 30, 300, 30, 300, null, 1),
  ((select id from blind_categories where slug = 'aluminium-venetian'), '25mm Aluminium', '25mm-aluminium', 25, 'aluminium', 30, 240, 30, 240, 30, 1),
  ((select id from blind_categories where slug = 'aluminium-venetian'), '50mm Aluminium', '50mm-aluminium', 50, 'aluminium', 30, 270, 30, 300, 40, 2),
  ((select id from blind_categories where slug = 'wood-venetian'), '35mm Wood', '35mm-wood', 35, 'wood', 30, 240, 30, 240, 45, 1),
  ((select id from blind_categories where slug = 'wood-venetian'), '50mm Wood', '50mm-wood', 50, 'wood', 30, 270, 30, 300, 50, 2),
  ((select id from blind_categories where slug = 'wood-venetian'), '50mm Bamboo', '50mm-bamboo', 50, 'bamboo', 30, 240, 30, 240, 50, 3),
  ((select id from blind_categories where slug = 'wood-venetian'), '50mm PVC', '50mm-pvc', 50, 'pvc', 30, 240, 30, 240, 40, 4),
  ((select id from blind_categories where slug = 'wood-venetian'), '50mm Polywood', '50mm-polywood', 50, 'polywood', 30, 240, 30, 240, 40, 5),
  ((select id from blind_categories where slug = 'wood-venetian'), '50mm Swiftwood', '50mm-swiftwood', 50, 'swiftwood', 30, 240, 30, 240, 45, 6),
  ((select id from blind_categories where slug = 'wood-venetian'), '50mm Dreamwood Nougat', '50mm-dreamwood-nougat', 50, 'dreamwood', 30, 240, 30, 240, 45, 7),
  ((select id from blind_categories where slug = 'wood-venetian'), '50mm Dreamwood SM', '50mm-dreamwood-sm', 50, 'dreamwood', 30, 240, 30, 240, 45, 8),
  ((select id from blind_categories where slug = 'wood-venetian'), '63mm Privacy Wood', '63mm-privacy', 63, 'wood', 30, 240, 30, 240, 55, 9),
  ((select id from blind_categories where slug = 'vertical'), '127mm Vertical', '127mm-vertical', 127, 'fabric', 56, 500, 30, 350, null, 1),
  ((select id from blind_categories where slug = 'vertical'), '90mm Vertical', '90mm-vertical', 90, 'fabric', 30, 700, 30, 700, null, 2)
on conflict (slug) do update set
  name = excluded.name,
  material = excluded.material,
  min_width_cm = excluded.min_width_cm,
  max_width_cm = excluded.max_width_cm,
  min_drop_cm = excluded.min_drop_cm,
  max_drop_cm = excluded.max_drop_cm,
  display_order = excluded.display_order;

-- ─── Blind Ranges — Roller (16 ranges) ──────────────────────
insert into public.blind_ranges (blind_type_id, name, slug, description, colour_options, display_order) values
  ((select id from blind_types where slug = 'roller-standard'), 'Beach', 'roller-beach',
   'Light filtering fabric with a coastal, relaxed aesthetic.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Ivory","hex":"#FFFFF0"},{"name":"Linen","hex":"#E8DFD0"},{"name":"Stone","hex":"#C4BEB5"},{"name":"Parchment","hex":"#F1E9D2"},{"name":"Driftwood","hex":"#B8A88A"}]'::jsonb, 1),
  ((select id from blind_types where slug = 'roller-standard'), 'Cedar', 'roller-cedar',
   'Textured weave sunscreen fabric with excellent outward visibility.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Charcoal","hex":"#36454F"},{"name":"Mocha","hex":"#967969"},{"name":"Latte","hex":"#C8AD8F"},{"name":"Ash","hex":"#B2BEB5"},{"name":"Pewter","hex":"#8E8E8E"}]'::jsonb, 2),
  ((select id from blind_types where slug = 'roller-standard'), 'Sanctuary Blockout', 'roller-sanctuary-bo',
   'Premium blockout fabric for complete light control.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Cream","hex":"#FFFDD0"},{"name":"Charcoal","hex":"#36454F"},{"name":"Navy","hex":"#1B2A4A"},{"name":"Linen","hex":"#E8DFD0"},{"name":"Dove","hex":"#B0AFA8"},{"name":"Black","hex":"#1A1A1A"}]'::jsonb, 3),
  ((select id from blind_types where slug = 'roller-standard'), 'Sanctuary Light Filtering', 'roller-sanctuary-lf',
   'Soft light filtering fabric that gently diffuses natural light.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Linen","hex":"#E8DFD0"},{"name":"Blush","hex":"#DEB5A0"},{"name":"Dove","hex":"#B0AFA8"},{"name":"Ivory","hex":"#FFFFF0"},{"name":"Stone","hex":"#C4BEB5"}]'::jsonb, 4),
  ((select id from blind_types where slug = 'roller-standard'), 'Aspen & Classic', 'roller-aspen',
   'Versatile translucent fabric with a soft weave.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Ivory","hex":"#FFFFF0"},{"name":"Pebble","hex":"#C4BCA8"},{"name":"Charcoal","hex":"#36454F"},{"name":"Linen","hex":"#E8DFD0"},{"name":"Stone","hex":"#C4BEB5"},{"name":"Oatmeal","hex":"#D3C8A8"}]'::jsonb, 5),
  ((select id from blind_types where slug = 'roller-standard'), 'Kleenscreen', 'roller-kleenscreen',
   'Anti-bacterial sunscreen ideal for kitchens, bathrooms, and medical spaces.',
   '[{"name":"White","hex":"#F8F8F8"},{"name":"Cream","hex":"#FFFDD0"},{"name":"Grey","hex":"#A9A9A9"},{"name":"Charcoal","hex":"#4A4A4A"},{"name":"Stone","hex":"#C4BEB5"}]'::jsonb, 6),
  ((select id from blind_types where slug = 'roller-standard'), 'Matrix', 'roller-matrix',
   'Bold geometric weave with excellent UV control.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Graphite","hex":"#4A4A4A"},{"name":"Mocha","hex":"#967969"},{"name":"Taupe","hex":"#B8A99A"},{"name":"Charcoal","hex":"#36454F"},{"name":"Stone","hex":"#C4BEB5"}]'::jsonb, 7),
  ((select id from blind_types where slug = 'roller-standard'), 'Natural', 'roller-natural',
   'Woven natural fibre fabric with an organic, earthy feel.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Linen","hex":"#E8DFD0"},{"name":"Sand","hex":"#C2B280"},{"name":"Pebble","hex":"#C4BCA8"},{"name":"Mocha","hex":"#967969"},{"name":"Charcoal","hex":"#4A4A4A"}]'::jsonb, 8),
  ((select id from blind_types where slug = 'roller-standard'), 'Sable', 'roller-sable',
   'Luxurious textured blockout fabric.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Linen","hex":"#E8DFD0"},{"name":"Dove","hex":"#B0AFA8"},{"name":"Charcoal","hex":"#36454F"},{"name":"Black","hex":"#1A1A1A"},{"name":"Navy","hex":"#1B2A4A"},{"name":"Stone","hex":"#C4BEB5"}]'::jsonb, 9),
  ((select id from blind_types where slug = 'roller-standard'), 'Smart Screen', 'roller-smartscreen',
   'Performance sunscreen with excellent outward visibility and UV rejection.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Linen","hex":"#E8DFD0"},{"name":"Charcoal","hex":"#4A4A4A"},{"name":"Bronze","hex":"#8C6E4A"},{"name":"Silver","hex":"#C0C0C0"},{"name":"Mocha","hex":"#967969"}]'::jsonb, 10),
  ((select id from blind_types where slug = 'roller-standard'), 'Solar Cool', 'roller-solarcool',
   'Reflective sunscreen that reduces heat gain — ideal for hot climates.',
   '[{"name":"Silver","hex":"#C0C0C0"},{"name":"White","hex":"#F0F0F0"},{"name":"Pearl","hex":"#E8E4D9"},{"name":"Platinum","hex":"#D8D8D8"},{"name":"Bronze","hex":"#8C6E4A"}]'::jsonb, 11),
  ((select id from blind_types where slug = 'roller-standard'), 'Solitaire', 'roller-solitaire',
   'Classic translucent fabric in a wide palette of neutral tones.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Ivory","hex":"#FFFFF0"},{"name":"Sand","hex":"#C2B280"},{"name":"Stone","hex":"#C4BEB5"},{"name":"Charcoal","hex":"#36454F"},{"name":"Linen","hex":"#E8DFD0"},{"name":"Oatmeal","hex":"#D3C8A8"},{"name":"Dove","hex":"#B0AFA8"}]'::jsonb, 12),
  ((select id from blind_types where slug = 'roller-standard'), 'Uniview', 'roller-uniview',
   'Open-weave sunscreen with maximum outward visibility.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Charcoal","hex":"#3A3A3A"},{"name":"Bronze","hex":"#8C6E4A"},{"name":"Linen","hex":"#E8DFD0"},{"name":"Mocha","hex":"#967969"}]'::jsonb, 13),
  ((select id from blind_types where slug = 'roller-standard'), 'Uniview External', 'roller-uniview-ext',
   'Heavy-duty outdoor sunscreen for external roller applications.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Charcoal","hex":"#3A3A3A"},{"name":"Bronze","hex":"#8C6E4A"},{"name":"Silver","hex":"#C0C0C0"}]'::jsonb, 14),
  ((select id from blind_types where slug = 'roller-standard'), 'Urban', 'roller-urban',
   'Contemporary textured fabric with a subtle linen aesthetic.',
   '[{"name":"White","hex":"#F5F5F0"},{"name":"Linen","hex":"#E8DFD0"},{"name":"Stone","hex":"#B5B0A8"},{"name":"Charcoal","hex":"#4A4A4A"},{"name":"Navy","hex":"#1B2A4A"},{"name":"Graphite","hex":"#3A3A3A"},{"name":"Blush","hex":"#DEB5A0"}]'::jsonb, 15),
  ((select id from blind_types where slug = 'roller-standard'), 'Vogue', 'roller-vogue',
   'Fashion-forward patterns and metallic sheens for statement windows.',
   '[{"name":"Pearl","hex":"#E8E4D9"},{"name":"Champagne","hex":"#F7E7CE"},{"name":"Graphite","hex":"#4A4A4A"},{"name":"Gold","hex":"#D4AF37"},{"name":"Silver","hex":"#C0C0C0"}]'::jsonb, 16)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, colour_options = excluded.colour_options, display_order = excluded.display_order;

-- ─── Blind Ranges — Aluminium (5 ranges) ────────────────────
insert into public.blind_ranges (blind_type_id, name, slug, description, colour_options, display_order) values
  ((select id from blind_types where slug = '25mm-aluminium'), 'Plain & Designer', '25mm-plain-designer',
   'Core collection of solid colours and metallic finishes.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Silver","hex":"#C0C0C0"},{"name":"Black","hex":"#1A1A1A"},{"name":"Gold","hex":"#D4AF37"},{"name":"Cream","hex":"#FFFDD0"},{"name":"Charcoal","hex":"#36454F"},{"name":"Burgundy","hex":"#800020"},{"name":"Bronze","hex":"#8C6E4A"}]'::jsonb, 1),
  ((select id from blind_types where slug = '25mm-aluminium'), 'Licorice & Mushroom', '25mm-licorice-mushroom',
   'Rich charcoal and warm mushroom tones in 25mm slats.',
   '[{"name":"Licorice","hex":"#2D2D2D"},{"name":"Mushroom","hex":"#B5A89A"},{"name":"Graphite","hex":"#4A4A4A"},{"name":"Pewter","hex":"#8E8E8E"},{"name":"Charcoal","hex":"#555555"}]'::jsonb, 2),
  ((select id from blind_types where slug = '50mm-aluminium'), 'Plain & Designer', '50mm-plain-designer',
   'Wide-slat aluminium in a curated selection of colours.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Silver","hex":"#C0C0C0"},{"name":"Gunmetal","hex":"#535355"},{"name":"Black","hex":"#1A1A1A"},{"name":"Cream","hex":"#FFFDD0"},{"name":"Gold","hex":"#D4AF37"}]'::jsonb, 1),
  ((select id from blind_types where slug = '50mm-aluminium'), 'Brushed & Perforated', '50mm-brushed-perforated',
   'Premium metallic finishes and perforated slats.',
   '[{"name":"Brushed Silver","hex":"#B0B0B0"},{"name":"Brushed Champagne","hex":"#C9B99A"},{"name":"Brushed Pewter","hex":"#8A8A8A"},{"name":"Perforated White","hex":"#F0F0F0"},{"name":"Perforated Silver","hex":"#BEBEBE"}]'::jsonb, 2),
  ((select id from blind_types where slug = '50mm-aluminium'), 'Décor', '50mm-decor',
   'Premium wood-look and metallic finishes on durable aluminium.',
   '[{"name":"Oak","hex":"#C4963A"},{"name":"Walnut","hex":"#5C3A21"},{"name":"Cherry","hex":"#8B2500"},{"name":"White","hex":"#FFFFFF"},{"name":"Maple","hex":"#D9B566"},{"name":"Mahogany","hex":"#4E0707"}]'::jsonb, 3)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, colour_options = excluded.colour_options, display_order = excluded.display_order;

-- ─── Blind Ranges — Wood & Natural (10 ranges) ─────────────
insert into public.blind_ranges (blind_type_id, name, slug, description, colour_options, display_order) values
  ((select id from blind_types where slug = '35mm-wood'), '35mm Wood', '35mm-wood-natural',
   'Narrow 35mm real wood venetian for a refined, classic look.',
   '[{"name":"Natural","hex":"#D4A76A"},{"name":"White","hex":"#F5F5F0"},{"name":"Walnut","hex":"#5C3A21"},{"name":"Espresso","hex":"#3C1F0A"},{"name":"Honey","hex":"#EB9605"}]'::jsonb, 1),
  ((select id from blind_types where slug = '50mm-wood'), 'Sherwood', '50mm-sherwood',
   'Real stained timber venetian in rich natural tones.',
   '[{"name":"Natural","hex":"#D4A76A"},{"name":"Walnut","hex":"#5C3A21"},{"name":"White","hex":"#F5F5F0"},{"name":"Espresso","hex":"#3C1F0A"},{"name":"Honey","hex":"#EB9605"}]'::jsonb, 1),
  ((select id from blind_types where slug = '50mm-wood'), 'Wood 50mm', '50mm-wood-natural',
   'Classic 50mm real wood venetian in natural grain finishes.',
   '[{"name":"Natural","hex":"#D4A76A"},{"name":"White","hex":"#F5F5F0"},{"name":"Walnut","hex":"#5C3A21"},{"name":"Espresso","hex":"#3C1F0A"},{"name":"Honey","hex":"#EB9605"},{"name":"Mahogany","hex":"#4E0707"}]'::jsonb, 2),
  ((select id from blind_types where slug = '50mm-bamboo'), 'Bamboo 50mm', '50mm-bamboo-natural',
   'Eco-friendly bamboo slats with a natural woven texture.',
   '[{"name":"Natural","hex":"#D4B896"},{"name":"Carbonised","hex":"#8B6B3D"},{"name":"Walnut","hex":"#5C3A21"},{"name":"Espresso","hex":"#3C1F0A"}]'::jsonb, 1),
  ((select id from blind_types where slug = '50mm-pvc'), 'PVC Smooth 50mm', '50mm-pvc-smooth',
   'Moisture-resistant PVC venetian — perfect for kitchens and bathrooms.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Cream","hex":"#FFF8E7"},{"name":"Grey","hex":"#B0B0B0"},{"name":"Stone","hex":"#C4BEB5"}]'::jsonb, 1),
  ((select id from blind_types where slug = '50mm-polywood'), 'Polywood 50mm', '50mm-polywood-natural',
   'Engineered polymer wood-look slats — lightweight, durable, moisture-resistant.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Cream","hex":"#FFF8E7"},{"name":"Grey","hex":"#B0B0B0"},{"name":"Stone","hex":"#C4BEB5"},{"name":"Walnut","hex":"#5C3A21"}]'::jsonb, 1),
  ((select id from blind_types where slug = '50mm-swiftwood'), 'Swiftwood 50mm', '50mm-swiftwood-natural',
   'Quick-ship 50mm faux-wood venetian with a natural timber grain.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Natural","hex":"#D4A76A"},{"name":"Walnut","hex":"#5C3A21"},{"name":"Espresso","hex":"#3C1F0A"},{"name":"Charcoal","hex":"#4A4A4A"}]'::jsonb, 1),
  ((select id from blind_types where slug = '50mm-dreamwood-nougat'), 'Dreamwood Nougat', '50mm-dreamwood-nougat-range',
   'Warm nougat tones in a premium composite wood finish.',
   '[{"name":"Natural","hex":"#D4A76A"},{"name":"White","hex":"#F5F5F0"},{"name":"Walnut","hex":"#5C3A21"},{"name":"Espresso","hex":"#3C1F0A"},{"name":"Nougat","hex":"#C8A882"}]'::jsonb, 1),
  ((select id from blind_types where slug = '50mm-dreamwood-sm'), 'Dreamwood SM', '50mm-dreamwood-sm-range',
   'Smooth matte composite wood finish with a contemporary aesthetic.',
   '[{"name":"Natural","hex":"#D4A76A"},{"name":"Walnut","hex":"#5C3A21"},{"name":"Charcoal","hex":"#4A4A4A"},{"name":"Stone","hex":"#C4BEB5"},{"name":"Driftwood","hex":"#B8A88A"}]'::jsonb, 1),
  ((select id from blind_types where slug = '63mm-privacy'), '63mm Privacy Wood', '63mm-privacy-natural',
   'Extra-wide 63mm real wood slats for maximum privacy and light control.',
   '[{"name":"Natural","hex":"#D4A76A"},{"name":"White","hex":"#F5F5F0"},{"name":"Walnut","hex":"#5C3A21"}]'::jsonb, 1)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, colour_options = excluded.colour_options, display_order = excluded.display_order;

-- ─── Blind Ranges — Vertical (8 ranges) ────────────────────
insert into public.blind_ranges (blind_type_id, name, slug, description, colour_options, display_order) values
  ((select id from blind_types where slug = '127mm-vertical'), 'Sabre', 'vertical-sabre',
   'Durable fabric louvres in a textured weave.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Cream","hex":"#FFFDD0"},{"name":"Grey","hex":"#808080"},{"name":"Charcoal","hex":"#4A4A4A"},{"name":"Stone","hex":"#C4BEB5"}]'::jsonb, 1),
  ((select id from blind_types where slug = '127mm-vertical'), 'PVC Smooth', 'vertical-pvc-smooth',
   'Easy-clean PVC louvres for kitchens and bathrooms.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Cream","hex":"#FFF8E7"},{"name":"Grey","hex":"#B0B0B0"}]'::jsonb, 2),
  ((select id from blind_types where slug = '127mm-vertical'), 'Aspen 127mm', 'vertical-aspen-127',
   'Classic translucent 127mm louvres.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Ivory","hex":"#FFFFF0"},{"name":"Stone","hex":"#C4BEB5"},{"name":"Charcoal","hex":"#4A4A4A"},{"name":"Linen","hex":"#E8DFD0"}]'::jsonb, 3),
  ((select id from blind_types where slug = '127mm-vertical'), 'Beach 127mm', 'vertical-beach-127',
   'Coastal-inspired 127mm fabric louvres.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Linen","hex":"#E8DFD0"},{"name":"Sand","hex":"#C2B280"},{"name":"Stone","hex":"#C4BEB5"},{"name":"Ivory","hex":"#FFFFF0"}]'::jsonb, 4),
  ((select id from blind_types where slug = '127mm-vertical'), 'Solitaire 127mm', 'vertical-solitaire-127',
   'Classic 127mm louvres in neutral tones.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Ivory","hex":"#FFFFF0"},{"name":"Sand","hex":"#C2B280"},{"name":"Grey","hex":"#808080"},{"name":"Charcoal","hex":"#4A4A4A"}]'::jsonb, 5),
  ((select id from blind_types where slug = '90mm-vertical'), 'Aspen 90mm', 'vertical-aspen-90',
   'Classic translucent 90mm louvres in a soft weave.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Ivory","hex":"#FFFFF0"},{"name":"Stone","hex":"#C4BEB5"},{"name":"Charcoal","hex":"#4A4A4A"}]'::jsonb, 1),
  ((select id from blind_types where slug = '90mm-vertical'), 'Beach 90mm', 'vertical-beach-90',
   'Coastal-inspired 90mm louvres with a relaxed texture.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Linen","hex":"#E8DFD0"},{"name":"Sand","hex":"#C2B280"},{"name":"Ivory","hex":"#FFFFF0"}]'::jsonb, 2),
  ((select id from blind_types where slug = '90mm-vertical'), 'Solitaire 90mm', 'vertical-solitaire-90',
   'Classic fabric louvres in a wide palette of neutral tones.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Cream","hex":"#FFFDD0"},{"name":"Grey","hex":"#808080"},{"name":"Charcoal","hex":"#4A4A4A"}]'::jsonb, 3)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, colour_options = excluded.colour_options, display_order = excluded.display_order;

-- ─── Blind Extras (accessories) ───────────────────────────
insert into public.blind_extras (name, slug, description, pricing_type, category_filter, type_filter, max_width_mm, display_order) values
  ('Stainless Steel Ball Chain', 'ss-ball-chain', 'Upgrade to a durable stainless steel control chain.', 'fixed', '{roller}', null, null, 1),
  ('Metal Ball Chain', 'metal-ball-chain', 'Standard metal ball chain upgrade.', 'fixed', '{roller}', null, null, 2),
  ('Wood Valance (106mm)', 'wood-valance', 'Decorative wood pelmet to conceal the roller mechanism.', 'width_based', '{roller}', null, null, 3),
  ('Cassette with Full Fascia', 'cassette-fascia', 'Enclosed aluminium cassette for a clean, modern look.', 'width_based', '{roller}', null, null, 4),
  ('Side Guides', 'side-guides', 'Aluminium edge guides to eliminate light gaps.', 'fixed', '{roller}', null, null, 5),
  ('40mm Roller Upgrade', '40mm-roller', 'Upgrade to a 40mm diameter roller tube.', 'width_based', '{roller}', null, 200, 6),
  ('45mm Roller Upgrade', '45mm-roller', 'Upgrade to a 45mm diameter roller tube for wider blinds.', 'width_based', '{roller}', null, null, 7),
  ('Duo Link', 'duo-link', 'Link two roller blinds on a single bracket.', 'width_based', '{roller}', null, 200, 8)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, pricing_type = excluded.pricing_type, display_order = excluded.display_order;

-- ─── Product Categories (template shop — expanded) ────────
insert into public.product_categories (name, slug, image, display_order, is_active) values
  ('{"en": "Roller Blinds"}'::jsonb, 'roller', null, 1, true),
  ('{"en": "Aluminium Venetian"}'::jsonb, 'aluminium-venetian', null, 2, true),
  ('{"en": "Wood & Natural Venetian"}'::jsonb, 'wood-venetian', null, 3, true),
  ('{"en": "Vertical Blinds"}'::jsonb, 'vertical', null, 4, true),
  ('{"en": "Accessories"}'::jsonb, 'accessories', null, 5, true)
on conflict (slug) do update set
  name = excluded.name,
  display_order = excluded.display_order;

-- ─── Products (range × colour = 210+ browsable items) ──────
-- "From" prices shown; actual price depends on dimensions via configurator.
-- Products are made-to-order (stock_quantity = 999).
insert into public.products (name, slug, description, price_cents, images, category_id, stock_quantity, is_active) values
  -- ── Roller: Beach (6 colours) ──
  ('{"en":"Beach Roller — White"}'::jsonb, 'roller-beach-white', '{"en":"Light filtering coastal fabric in White."}'::jsonb, 49000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Beach Roller — Ivory"}'::jsonb, 'roller-beach-ivory', '{"en":"Light filtering coastal fabric in Ivory."}'::jsonb, 49000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Beach Roller — Linen"}'::jsonb, 'roller-beach-linen', '{"en":"Light filtering coastal fabric in Linen."}'::jsonb, 49000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Beach Roller — Stone"}'::jsonb, 'roller-beach-stone', '{"en":"Light filtering coastal fabric in Stone."}'::jsonb, 49000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Beach Roller — Parchment"}'::jsonb, 'roller-beach-parchment', '{"en":"Light filtering coastal fabric in Parchment."}'::jsonb, 49000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Beach Roller — Driftwood"}'::jsonb, 'roller-beach-driftwood', '{"en":"Light filtering coastal fabric in Driftwood."}'::jsonb, 49000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  -- ── Roller: Cedar (6 colours) ──
  ('{"en":"Cedar Roller — White"}'::jsonb, 'roller-cedar-white', '{"en":"Textured weave sunscreen in White."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Cedar Roller — Charcoal"}'::jsonb, 'roller-cedar-charcoal', '{"en":"Textured weave sunscreen in Charcoal."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Cedar Roller — Mocha"}'::jsonb, 'roller-cedar-mocha', '{"en":"Textured weave sunscreen in Mocha."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Cedar Roller — Latte"}'::jsonb, 'roller-cedar-latte', '{"en":"Textured weave sunscreen in Latte."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Cedar Roller — Ash"}'::jsonb, 'roller-cedar-ash', '{"en":"Textured weave sunscreen in Ash."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Cedar Roller — Pewter"}'::jsonb, 'roller-cedar-pewter', '{"en":"Textured weave sunscreen in Pewter."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  -- ── Roller: Sanctuary Blockout (7 colours) ──
  ('{"en":"Sanctuary Blockout — White"}'::jsonb, 'roller-sanctuary-bo-white', '{"en":"Premium blockout fabric in White."}'::jsonb, 59000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Sanctuary Blockout — Cream"}'::jsonb, 'roller-sanctuary-bo-cream', '{"en":"Premium blockout fabric in Cream."}'::jsonb, 59000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Sanctuary Blockout — Charcoal"}'::jsonb, 'roller-sanctuary-bo-charcoal', '{"en":"Premium blockout fabric in Charcoal."}'::jsonb, 59000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Sanctuary Blockout — Navy"}'::jsonb, 'roller-sanctuary-bo-navy', '{"en":"Premium blockout fabric in Navy."}'::jsonb, 59000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Sanctuary Blockout — Linen"}'::jsonb, 'roller-sanctuary-bo-linen', '{"en":"Premium blockout fabric in Linen."}'::jsonb, 59000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Sanctuary Blockout — Dove"}'::jsonb, 'roller-sanctuary-bo-dove', '{"en":"Premium blockout fabric in Dove."}'::jsonb, 59000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Sanctuary Blockout — Black"}'::jsonb, 'roller-sanctuary-bo-black', '{"en":"Premium blockout fabric in Black."}'::jsonb, 59000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  -- ── Roller: Sanctuary LF (6 colours) ──
  ('{"en":"Sanctuary LF — White"}'::jsonb, 'roller-sanctuary-lf-white', '{"en":"Soft light filtering fabric in White."}'::jsonb, 55000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Sanctuary LF — Linen"}'::jsonb, 'roller-sanctuary-lf-linen', '{"en":"Soft light filtering fabric in Linen."}'::jsonb, 55000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Sanctuary LF — Blush"}'::jsonb, 'roller-sanctuary-lf-blush', '{"en":"Soft light filtering fabric in Blush."}'::jsonb, 55000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Sanctuary LF — Dove"}'::jsonb, 'roller-sanctuary-lf-dove', '{"en":"Soft light filtering fabric in Dove."}'::jsonb, 55000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Sanctuary LF — Ivory"}'::jsonb, 'roller-sanctuary-lf-ivory', '{"en":"Soft light filtering fabric in Ivory."}'::jsonb, 55000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Sanctuary LF — Stone"}'::jsonb, 'roller-sanctuary-lf-stone', '{"en":"Soft light filtering fabric in Stone."}'::jsonb, 55000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  -- ── Roller: Aspen & Classic (7 colours) ──
  ('{"en":"Aspen Roller — White"}'::jsonb, 'roller-aspen-white', '{"en":"Versatile translucent fabric in White."}'::jsonb, 46000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Aspen Roller — Ivory"}'::jsonb, 'roller-aspen-ivory', '{"en":"Versatile translucent fabric in Ivory."}'::jsonb, 46000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Aspen Roller — Pebble"}'::jsonb, 'roller-aspen-pebble', '{"en":"Versatile translucent fabric in Pebble."}'::jsonb, 46000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Aspen Roller — Charcoal"}'::jsonb, 'roller-aspen-charcoal', '{"en":"Versatile translucent fabric in Charcoal."}'::jsonb, 46000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Aspen Roller — Linen"}'::jsonb, 'roller-aspen-linen', '{"en":"Versatile translucent fabric in Linen."}'::jsonb, 46000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Aspen Roller — Stone"}'::jsonb, 'roller-aspen-stone', '{"en":"Versatile translucent fabric in Stone."}'::jsonb, 46000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Aspen Roller — Oatmeal"}'::jsonb, 'roller-aspen-oatmeal', '{"en":"Versatile translucent fabric in Oatmeal."}'::jsonb, 46000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  -- ── Roller: Kleenscreen (5 colours) ──
  ('{"en":"Kleenscreen Roller — White"}'::jsonb, 'roller-kleenscreen-white', '{"en":"Anti-bacterial sunscreen in White."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Kleenscreen Roller — Cream"}'::jsonb, 'roller-kleenscreen-cream', '{"en":"Anti-bacterial sunscreen in Cream."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Kleenscreen Roller — Grey"}'::jsonb, 'roller-kleenscreen-grey', '{"en":"Anti-bacterial sunscreen in Grey."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Kleenscreen Roller — Charcoal"}'::jsonb, 'roller-kleenscreen-charcoal', '{"en":"Anti-bacterial sunscreen in Charcoal."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Kleenscreen Roller — Stone"}'::jsonb, 'roller-kleenscreen-stone', '{"en":"Anti-bacterial sunscreen in Stone."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  -- ── Roller: Matrix (6 colours) ──
  ('{"en":"Matrix Roller — White"}'::jsonb, 'roller-matrix-white', '{"en":"Geometric weave UV control in White."}'::jsonb, 56000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Matrix Roller — Graphite"}'::jsonb, 'roller-matrix-graphite', '{"en":"Geometric weave UV control in Graphite."}'::jsonb, 56000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Matrix Roller — Mocha"}'::jsonb, 'roller-matrix-mocha', '{"en":"Geometric weave UV control in Mocha."}'::jsonb, 56000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Matrix Roller — Taupe"}'::jsonb, 'roller-matrix-taupe', '{"en":"Geometric weave UV control in Taupe."}'::jsonb, 56000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Matrix Roller — Charcoal"}'::jsonb, 'roller-matrix-charcoal', '{"en":"Geometric weave UV control in Charcoal."}'::jsonb, 56000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Matrix Roller — Stone"}'::jsonb, 'roller-matrix-stone', '{"en":"Geometric weave UV control in Stone."}'::jsonb, 56000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  -- ── Roller: Natural (6 colours) ──
  ('{"en":"Natural Roller — White"}'::jsonb, 'roller-natural-white', '{"en":"Woven natural fibre in White."}'::jsonb, 50000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Natural Roller — Linen"}'::jsonb, 'roller-natural-linen', '{"en":"Woven natural fibre in Linen."}'::jsonb, 50000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Natural Roller — Sand"}'::jsonb, 'roller-natural-sand', '{"en":"Woven natural fibre in Sand."}'::jsonb, 50000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Natural Roller — Pebble"}'::jsonb, 'roller-natural-pebble', '{"en":"Woven natural fibre in Pebble."}'::jsonb, 50000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Natural Roller — Mocha"}'::jsonb, 'roller-natural-mocha', '{"en":"Woven natural fibre in Mocha."}'::jsonb, 50000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Natural Roller — Charcoal"}'::jsonb, 'roller-natural-charcoal', '{"en":"Woven natural fibre in Charcoal."}'::jsonb, 50000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  -- ── Roller: Sable (7 colours) ──
  ('{"en":"Sable Roller — White"}'::jsonb, 'roller-sable-white', '{"en":"Luxurious textured blockout in White."}'::jsonb, 61000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Sable Roller — Linen"}'::jsonb, 'roller-sable-linen', '{"en":"Luxurious textured blockout in Linen."}'::jsonb, 61000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Sable Roller — Dove"}'::jsonb, 'roller-sable-dove', '{"en":"Luxurious textured blockout in Dove."}'::jsonb, 61000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Sable Roller — Charcoal"}'::jsonb, 'roller-sable-charcoal', '{"en":"Luxurious textured blockout in Charcoal."}'::jsonb, 61000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Sable Roller — Black"}'::jsonb, 'roller-sable-black', '{"en":"Luxurious textured blockout in Black."}'::jsonb, 61000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Sable Roller — Navy"}'::jsonb, 'roller-sable-navy', '{"en":"Luxurious textured blockout in Navy."}'::jsonb, 61000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Sable Roller — Stone"}'::jsonb, 'roller-sable-stone', '{"en":"Luxurious textured blockout in Stone."}'::jsonb, 61000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  -- ── Roller: Smart Screen (6 colours) ──
  ('{"en":"Smart Screen — White"}'::jsonb, 'roller-smartscreen-white', '{"en":"Performance sunscreen in White."}'::jsonb, 62000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Smart Screen — Linen"}'::jsonb, 'roller-smartscreen-linen', '{"en":"Performance sunscreen in Linen."}'::jsonb, 62000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Smart Screen — Charcoal"}'::jsonb, 'roller-smartscreen-charcoal', '{"en":"Performance sunscreen in Charcoal."}'::jsonb, 62000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Smart Screen — Bronze"}'::jsonb, 'roller-smartscreen-bronze', '{"en":"Performance sunscreen in Bronze."}'::jsonb, 62000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Smart Screen — Silver"}'::jsonb, 'roller-smartscreen-silver', '{"en":"Performance sunscreen in Silver."}'::jsonb, 62000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Smart Screen — Mocha"}'::jsonb, 'roller-smartscreen-mocha', '{"en":"Performance sunscreen in Mocha."}'::jsonb, 62000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  -- ── Roller: Solar Cool (5 colours) ──
  ('{"en":"Solar Cool — Silver"}'::jsonb, 'roller-solarcool-silver', '{"en":"Reflective heat-reducing sunscreen in Silver."}'::jsonb, 68000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Solar Cool — White"}'::jsonb, 'roller-solarcool-white', '{"en":"Reflective heat-reducing sunscreen in White."}'::jsonb, 68000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Solar Cool — Pearl"}'::jsonb, 'roller-solarcool-pearl', '{"en":"Reflective heat-reducing sunscreen in Pearl."}'::jsonb, 68000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Solar Cool — Platinum"}'::jsonb, 'roller-solarcool-platinum', '{"en":"Reflective heat-reducing sunscreen in Platinum."}'::jsonb, 68000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Solar Cool — Bronze"}'::jsonb, 'roller-solarcool-bronze', '{"en":"Reflective heat-reducing sunscreen in Bronze."}'::jsonb, 68000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  -- ── Roller: Solitaire (8 colours) ──
  ('{"en":"Solitaire Roller — White"}'::jsonb, 'roller-solitaire-white', '{"en":"Classic translucent fabric in White."}'::jsonb, 48000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Solitaire Roller — Ivory"}'::jsonb, 'roller-solitaire-ivory', '{"en":"Classic translucent fabric in Ivory."}'::jsonb, 48000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Solitaire Roller — Sand"}'::jsonb, 'roller-solitaire-sand', '{"en":"Classic translucent fabric in Sand."}'::jsonb, 48000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Solitaire Roller — Stone"}'::jsonb, 'roller-solitaire-stone', '{"en":"Classic translucent fabric in Stone."}'::jsonb, 48000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Solitaire Roller — Charcoal"}'::jsonb, 'roller-solitaire-charcoal', '{"en":"Classic translucent fabric in Charcoal."}'::jsonb, 48000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Solitaire Roller — Linen"}'::jsonb, 'roller-solitaire-linen', '{"en":"Classic translucent fabric in Linen."}'::jsonb, 48000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Solitaire Roller — Oatmeal"}'::jsonb, 'roller-solitaire-oatmeal', '{"en":"Classic translucent fabric in Oatmeal."}'::jsonb, 48000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Solitaire Roller — Dove"}'::jsonb, 'roller-solitaire-dove', '{"en":"Classic translucent fabric in Dove."}'::jsonb, 48000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  -- ── Roller: Uniview (5 colours) ──
  ('{"en":"Uniview Roller — White"}'::jsonb, 'roller-uniview-white', '{"en":"Open-weave sunscreen in White."}'::jsonb, 58000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Uniview Roller — Charcoal"}'::jsonb, 'roller-uniview-charcoal', '{"en":"Open-weave sunscreen in Charcoal."}'::jsonb, 58000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Uniview Roller — Bronze"}'::jsonb, 'roller-uniview-bronze', '{"en":"Open-weave sunscreen in Bronze."}'::jsonb, 58000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Uniview Roller — Linen"}'::jsonb, 'roller-uniview-linen', '{"en":"Open-weave sunscreen in Linen."}'::jsonb, 58000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Uniview Roller — Mocha"}'::jsonb, 'roller-uniview-mocha', '{"en":"Open-weave sunscreen in Mocha."}'::jsonb, 58000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  -- ── Roller: Uniview External (4 colours) ──
  ('{"en":"Uniview External — White"}'::jsonb, 'roller-uniview-ext-white', '{"en":"Outdoor sunscreen in White."}'::jsonb, 72000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Uniview External — Charcoal"}'::jsonb, 'roller-uniview-ext-charcoal', '{"en":"Outdoor sunscreen in Charcoal."}'::jsonb, 72000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Uniview External — Bronze"}'::jsonb, 'roller-uniview-ext-bronze', '{"en":"Outdoor sunscreen in Bronze."}'::jsonb, 72000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Uniview External — Silver"}'::jsonb, 'roller-uniview-ext-silver', '{"en":"Outdoor sunscreen in Silver."}'::jsonb, 72000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  -- ── Roller: Urban (7 colours) ──
  ('{"en":"Urban Roller — White"}'::jsonb, 'roller-urban-white', '{"en":"Contemporary textured fabric in White."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Urban Roller — Linen"}'::jsonb, 'roller-urban-linen', '{"en":"Contemporary textured fabric in Linen."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Urban Roller — Stone"}'::jsonb, 'roller-urban-stone', '{"en":"Contemporary textured fabric in Stone."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Urban Roller — Charcoal"}'::jsonb, 'roller-urban-charcoal', '{"en":"Contemporary textured fabric in Charcoal."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Urban Roller — Navy"}'::jsonb, 'roller-urban-navy', '{"en":"Contemporary textured fabric in Navy."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Urban Roller — Graphite"}'::jsonb, 'roller-urban-graphite', '{"en":"Contemporary textured fabric in Graphite."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Urban Roller — Blush"}'::jsonb, 'roller-urban-blush', '{"en":"Contemporary textured fabric in Blush."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  -- ── Roller: Vogue (5 colours) ──
  ('{"en":"Vogue Roller — Pearl"}'::jsonb, 'roller-vogue-pearl', '{"en":"Fashion-forward metallic sheen in Pearl."}'::jsonb, 72000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Vogue Roller — Champagne"}'::jsonb, 'roller-vogue-champagne', '{"en":"Fashion-forward metallic sheen in Champagne."}'::jsonb, 72000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Vogue Roller — Graphite"}'::jsonb, 'roller-vogue-graphite', '{"en":"Fashion-forward metallic sheen in Graphite."}'::jsonb, 72000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Vogue Roller — Gold"}'::jsonb, 'roller-vogue-gold', '{"en":"Fashion-forward metallic sheen in Gold."}'::jsonb, 72000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Vogue Roller — Silver"}'::jsonb, 'roller-vogue-silver', '{"en":"Fashion-forward metallic sheen in Silver."}'::jsonb, 72000, '{}', (select id from product_categories where slug = 'roller'), 999, true),

  -- ── 25mm Aluminium: Plain & Designer (8 colours) ──
  ('{"en":"25mm Plain — White"}'::jsonb, '25mm-plain-white', '{"en":"25mm aluminium slat in White."}'::jsonb, 44000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"25mm Plain — Silver"}'::jsonb, '25mm-plain-silver', '{"en":"25mm aluminium slat in Silver."}'::jsonb, 44000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"25mm Plain — Black"}'::jsonb, '25mm-plain-black', '{"en":"25mm aluminium slat in Black."}'::jsonb, 44000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"25mm Plain — Gold"}'::jsonb, '25mm-plain-gold', '{"en":"25mm aluminium slat in Gold."}'::jsonb, 44000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"25mm Plain — Cream"}'::jsonb, '25mm-plain-cream', '{"en":"25mm aluminium slat in Cream."}'::jsonb, 44000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"25mm Plain — Charcoal"}'::jsonb, '25mm-plain-charcoal', '{"en":"25mm aluminium slat in Charcoal."}'::jsonb, 44000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"25mm Plain — Burgundy"}'::jsonb, '25mm-plain-burgundy', '{"en":"25mm aluminium slat in Burgundy."}'::jsonb, 44000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"25mm Plain — Bronze"}'::jsonb, '25mm-plain-bronze', '{"en":"25mm aluminium slat in Bronze."}'::jsonb, 44000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  -- ── 25mm Aluminium: Licorice & Mushroom (5 colours) ──
  ('{"en":"25mm Licorice"}'::jsonb, '25mm-licorice', '{"en":"25mm aluminium in Licorice."}'::jsonb, 48000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"25mm Mushroom"}'::jsonb, '25mm-mushroom', '{"en":"25mm aluminium in Mushroom."}'::jsonb, 48000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"25mm Graphite"}'::jsonb, '25mm-lm-graphite', '{"en":"25mm aluminium in Graphite."}'::jsonb, 48000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"25mm Pewter"}'::jsonb, '25mm-lm-pewter', '{"en":"25mm aluminium in Pewter."}'::jsonb, 48000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"25mm Charcoal"}'::jsonb, '25mm-lm-charcoal', '{"en":"25mm aluminium in Charcoal."}'::jsonb, 48000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  -- ── 50mm Aluminium: Plain & Designer (6 colours) ──
  ('{"en":"50mm Venetian — White"}'::jsonb, '50mm-ven-white', '{"en":"50mm aluminium slat in White."}'::jsonb, 56000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"50mm Venetian — Silver"}'::jsonb, '50mm-ven-silver', '{"en":"50mm aluminium slat in Silver."}'::jsonb, 56000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"50mm Venetian — Gunmetal"}'::jsonb, '50mm-ven-gunmetal', '{"en":"50mm aluminium slat in Gunmetal."}'::jsonb, 56000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"50mm Venetian — Black"}'::jsonb, '50mm-ven-black', '{"en":"50mm aluminium slat in Black."}'::jsonb, 56000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"50mm Venetian — Cream"}'::jsonb, '50mm-ven-cream', '{"en":"50mm aluminium slat in Cream."}'::jsonb, 56000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"50mm Venetian — Gold"}'::jsonb, '50mm-ven-gold', '{"en":"50mm aluminium slat in Gold."}'::jsonb, 56000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  -- ── 50mm Aluminium: Brushed & Perforated (5 colours) ──
  ('{"en":"50mm Brushed Silver"}'::jsonb, '50mm-brushed-silver', '{"en":"Premium brushed silver aluminium."}'::jsonb, 64000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"50mm Brushed Champagne"}'::jsonb, '50mm-brushed-champagne', '{"en":"Premium brushed champagne aluminium."}'::jsonb, 64000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"50mm Brushed Pewter"}'::jsonb, '50mm-brushed-pewter', '{"en":"Premium brushed pewter aluminium."}'::jsonb, 64000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"50mm Perforated White"}'::jsonb, '50mm-perf-white', '{"en":"50mm perforated aluminium in White."}'::jsonb, 64000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"50mm Perforated Silver"}'::jsonb, '50mm-perf-silver', '{"en":"50mm perforated aluminium in Silver."}'::jsonb, 64000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  -- ── 50mm Aluminium: Décor (6 colours) ──
  ('{"en":"50mm Décor — Oak"}'::jsonb, '50mm-decor-oak', '{"en":"Wood-look aluminium in Oak."}'::jsonb, 62000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"50mm Décor — Walnut"}'::jsonb, '50mm-decor-walnut', '{"en":"Wood-look aluminium in Walnut."}'::jsonb, 62000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"50mm Décor — Cherry"}'::jsonb, '50mm-decor-cherry', '{"en":"Wood-look aluminium in Cherry."}'::jsonb, 62000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"50mm Décor — White"}'::jsonb, '50mm-decor-white', '{"en":"Wood-look aluminium in White."}'::jsonb, 62000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"50mm Décor — Maple"}'::jsonb, '50mm-decor-maple', '{"en":"Wood-look aluminium in Maple."}'::jsonb, 62000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"50mm Décor — Mahogany"}'::jsonb, '50mm-decor-mahogany', '{"en":"Wood-look aluminium in Mahogany."}'::jsonb, 62000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),

  -- ── Wood: 35mm Wood (5 colours) ──
  ('{"en":"35mm Wood — Natural"}'::jsonb, '35mm-wood-natural', '{"en":"Narrow 35mm real wood in Natural."}'::jsonb, 76000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"35mm Wood — White"}'::jsonb, '35mm-wood-white', '{"en":"Narrow 35mm real wood in White."}'::jsonb, 76000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"35mm Wood — Walnut"}'::jsonb, '35mm-wood-walnut', '{"en":"Narrow 35mm real wood in Walnut."}'::jsonb, 76000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"35mm Wood — Espresso"}'::jsonb, '35mm-wood-espresso', '{"en":"Narrow 35mm real wood in Espresso."}'::jsonb, 76000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"35mm Wood — Honey"}'::jsonb, '35mm-wood-honey', '{"en":"Narrow 35mm real wood in Honey."}'::jsonb, 76000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  -- ── Wood: Sherwood (5 colours) ──
  ('{"en":"Sherwood — Natural"}'::jsonb, '50mm-sherwood-natural', '{"en":"Real stained timber in Natural."}'::jsonb, 78000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"Sherwood — Walnut"}'::jsonb, '50mm-sherwood-walnut', '{"en":"Real stained timber in Walnut."}'::jsonb, 78000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"Sherwood — White"}'::jsonb, '50mm-sherwood-white', '{"en":"Real stained timber in White."}'::jsonb, 78000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"Sherwood — Espresso"}'::jsonb, '50mm-sherwood-espresso', '{"en":"Real stained timber in Espresso."}'::jsonb, 78000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"Sherwood — Honey"}'::jsonb, '50mm-sherwood-honey', '{"en":"Real stained timber in Honey."}'::jsonb, 78000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  -- ── Wood: Wood 50mm (6 colours) ──
  ('{"en":"50mm Wood — Natural"}'::jsonb, '50mm-wood-natural-col', '{"en":"Classic 50mm real wood in Natural."}'::jsonb, 82000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"50mm Wood — White"}'::jsonb, '50mm-wood-white', '{"en":"Classic 50mm real wood in White."}'::jsonb, 82000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"50mm Wood — Walnut"}'::jsonb, '50mm-wood-walnut', '{"en":"Classic 50mm real wood in Walnut."}'::jsonb, 82000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"50mm Wood — Espresso"}'::jsonb, '50mm-wood-espresso', '{"en":"Classic 50mm real wood in Espresso."}'::jsonb, 82000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"50mm Wood — Honey"}'::jsonb, '50mm-wood-honey', '{"en":"Classic 50mm real wood in Honey."}'::jsonb, 82000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"50mm Wood — Mahogany"}'::jsonb, '50mm-wood-mahogany', '{"en":"Classic 50mm real wood in Mahogany."}'::jsonb, 82000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  -- ── Wood: Bamboo (4 colours) ──
  ('{"en":"Bamboo — Natural"}'::jsonb, '50mm-bamboo-natural-col', '{"en":"Eco-friendly bamboo in Natural."}'::jsonb, 72000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"Bamboo — Carbonised"}'::jsonb, '50mm-bamboo-carbonised', '{"en":"Eco-friendly bamboo in Carbonised."}'::jsonb, 72000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"Bamboo — Walnut"}'::jsonb, '50mm-bamboo-walnut', '{"en":"Eco-friendly bamboo in Walnut."}'::jsonb, 72000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"Bamboo — Espresso"}'::jsonb, '50mm-bamboo-espresso', '{"en":"Eco-friendly bamboo in Espresso."}'::jsonb, 72000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  -- ── Wood: PVC Smooth (4 colours) ──
  ('{"en":"PVC Smooth — White"}'::jsonb, '50mm-pvc-white', '{"en":"Moisture-resistant PVC in White."}'::jsonb, 48000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"PVC Smooth — Cream"}'::jsonb, '50mm-pvc-cream', '{"en":"Moisture-resistant PVC in Cream."}'::jsonb, 48000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"PVC Smooth — Grey"}'::jsonb, '50mm-pvc-grey', '{"en":"Moisture-resistant PVC in Grey."}'::jsonb, 48000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"PVC Smooth — Stone"}'::jsonb, '50mm-pvc-stone', '{"en":"Moisture-resistant PVC in Stone."}'::jsonb, 48000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  -- ── Wood: Polywood (5 colours) ──
  ('{"en":"Polywood — White"}'::jsonb, '50mm-polywood-white', '{"en":"Engineered polymer wood-look in White."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"Polywood — Cream"}'::jsonb, '50mm-polywood-cream', '{"en":"Engineered polymer wood-look in Cream."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"Polywood — Grey"}'::jsonb, '50mm-polywood-grey', '{"en":"Engineered polymer wood-look in Grey."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"Polywood — Stone"}'::jsonb, '50mm-polywood-stone', '{"en":"Engineered polymer wood-look in Stone."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"Polywood — Walnut"}'::jsonb, '50mm-polywood-walnut', '{"en":"Engineered polymer wood-look in Walnut."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  -- ── Wood: Swiftwood (5 colours) ──
  ('{"en":"Swiftwood — White"}'::jsonb, '50mm-swiftwood-white', '{"en":"Quick-ship faux-wood in White."}'::jsonb, 56000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"Swiftwood — Natural"}'::jsonb, '50mm-swiftwood-natural', '{"en":"Quick-ship faux-wood in Natural."}'::jsonb, 56000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"Swiftwood — Walnut"}'::jsonb, '50mm-swiftwood-walnut', '{"en":"Quick-ship faux-wood in Walnut."}'::jsonb, 56000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"Swiftwood — Espresso"}'::jsonb, '50mm-swiftwood-espresso', '{"en":"Quick-ship faux-wood in Espresso."}'::jsonb, 56000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"Swiftwood — Charcoal"}'::jsonb, '50mm-swiftwood-charcoal', '{"en":"Quick-ship faux-wood in Charcoal."}'::jsonb, 56000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  -- ── Wood: Dreamwood Nougat (5 colours) ──
  ('{"en":"Dreamwood Nougat — Natural"}'::jsonb, 'dreamwood-nougat-natural', '{"en":"Warm composite wood in Natural."}'::jsonb, 68000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"Dreamwood Nougat — White"}'::jsonb, 'dreamwood-nougat-white', '{"en":"Warm composite wood in White."}'::jsonb, 68000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"Dreamwood Nougat — Walnut"}'::jsonb, 'dreamwood-nougat-walnut', '{"en":"Warm composite wood in Walnut."}'::jsonb, 68000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"Dreamwood Nougat — Espresso"}'::jsonb, 'dreamwood-nougat-espresso', '{"en":"Warm composite wood in Espresso."}'::jsonb, 68000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"Dreamwood Nougat — Nougat"}'::jsonb, 'dreamwood-nougat-nougat', '{"en":"Warm composite wood in Nougat."}'::jsonb, 68000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  -- ── Wood: Dreamwood SM (5 colours) ──
  ('{"en":"Dreamwood SM — Natural"}'::jsonb, 'dreamwood-sm-natural', '{"en":"Smooth matte composite in Natural."}'::jsonb, 68000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"Dreamwood SM — Walnut"}'::jsonb, 'dreamwood-sm-walnut', '{"en":"Smooth matte composite in Walnut."}'::jsonb, 68000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"Dreamwood SM — Charcoal"}'::jsonb, 'dreamwood-sm-charcoal', '{"en":"Smooth matte composite in Charcoal."}'::jsonb, 68000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"Dreamwood SM — Stone"}'::jsonb, 'dreamwood-sm-stone', '{"en":"Smooth matte composite in Stone."}'::jsonb, 68000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"Dreamwood SM — Driftwood"}'::jsonb, 'dreamwood-sm-driftwood', '{"en":"Smooth matte composite in Driftwood."}'::jsonb, 68000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  -- ── Wood: 63mm Privacy (3 colours) ──
  ('{"en":"63mm Privacy — Natural"}'::jsonb, '63mm-privacy-natural', '{"en":"Extra-wide 63mm real wood in Natural."}'::jsonb, 92000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"63mm Privacy — White"}'::jsonb, '63mm-privacy-white', '{"en":"Extra-wide 63mm real wood in White."}'::jsonb, 92000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"63mm Privacy — Walnut"}'::jsonb, '63mm-privacy-walnut', '{"en":"Extra-wide 63mm real wood in Walnut."}'::jsonb, 92000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),

  -- ── Vertical: Sabre 127mm (5 colours) ──
  ('{"en":"Sabre 127mm — White"}'::jsonb, 'vert-sabre-white', '{"en":"Textured fabric louvres in White."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Sabre 127mm — Cream"}'::jsonb, 'vert-sabre-cream', '{"en":"Textured fabric louvres in Cream."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Sabre 127mm — Grey"}'::jsonb, 'vert-sabre-grey', '{"en":"Textured fabric louvres in Grey."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Sabre 127mm — Charcoal"}'::jsonb, 'vert-sabre-charcoal', '{"en":"Textured fabric louvres in Charcoal."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Sabre 127mm — Stone"}'::jsonb, 'vert-sabre-stone', '{"en":"Textured fabric louvres in Stone."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  -- ── Vertical: PVC Smooth 127mm (3 colours) ──
  ('{"en":"PVC Vertical — White"}'::jsonb, 'vert-pvc-white', '{"en":"Easy-clean PVC louvres in White."}'::jsonb, 46000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"PVC Vertical — Cream"}'::jsonb, 'vert-pvc-cream', '{"en":"Easy-clean PVC louvres in Cream."}'::jsonb, 46000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"PVC Vertical — Grey"}'::jsonb, 'vert-pvc-grey', '{"en":"Easy-clean PVC louvres in Grey."}'::jsonb, 46000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  -- ── Vertical: Aspen 127mm (5 colours) ──
  ('{"en":"Aspen 127mm — White"}'::jsonb, 'vert-aspen127-white', '{"en":"Translucent 127mm louvres in White."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Aspen 127mm — Ivory"}'::jsonb, 'vert-aspen127-ivory', '{"en":"Translucent 127mm louvres in Ivory."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Aspen 127mm — Stone"}'::jsonb, 'vert-aspen127-stone', '{"en":"Translucent 127mm louvres in Stone."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Aspen 127mm — Charcoal"}'::jsonb, 'vert-aspen127-charcoal', '{"en":"Translucent 127mm louvres in Charcoal."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Aspen 127mm — Linen"}'::jsonb, 'vert-aspen127-linen', '{"en":"Translucent 127mm louvres in Linen."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  -- ── Vertical: Beach 127mm (5 colours) ──
  ('{"en":"Beach 127mm — White"}'::jsonb, 'vert-beach127-white', '{"en":"Coastal 127mm louvres in White."}'::jsonb, 56000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Beach 127mm — Linen"}'::jsonb, 'vert-beach127-linen', '{"en":"Coastal 127mm louvres in Linen."}'::jsonb, 56000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Beach 127mm — Sand"}'::jsonb, 'vert-beach127-sand', '{"en":"Coastal 127mm louvres in Sand."}'::jsonb, 56000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Beach 127mm — Stone"}'::jsonb, 'vert-beach127-stone', '{"en":"Coastal 127mm louvres in Stone."}'::jsonb, 56000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Beach 127mm — Ivory"}'::jsonb, 'vert-beach127-ivory', '{"en":"Coastal 127mm louvres in Ivory."}'::jsonb, 56000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  -- ── Vertical: Solitaire 127mm (5 colours) ──
  ('{"en":"Solitaire 127mm — White"}'::jsonb, 'vert-solitaire127-white', '{"en":"Classic 127mm louvres in White."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Solitaire 127mm — Ivory"}'::jsonb, 'vert-solitaire127-ivory', '{"en":"Classic 127mm louvres in Ivory."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Solitaire 127mm — Sand"}'::jsonb, 'vert-solitaire127-sand', '{"en":"Classic 127mm louvres in Sand."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Solitaire 127mm — Grey"}'::jsonb, 'vert-solitaire127-grey', '{"en":"Classic 127mm louvres in Grey."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Solitaire 127mm — Charcoal"}'::jsonb, 'vert-solitaire127-charcoal', '{"en":"Classic 127mm louvres in Charcoal."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  -- ── Vertical: Aspen 90mm (4 colours) ──
  ('{"en":"Aspen 90mm — White"}'::jsonb, 'vert-aspen90-white', '{"en":"Translucent 90mm louvres in White."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Aspen 90mm — Ivory"}'::jsonb, 'vert-aspen90-ivory', '{"en":"Translucent 90mm louvres in Ivory."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Aspen 90mm — Stone"}'::jsonb, 'vert-aspen90-stone', '{"en":"Translucent 90mm louvres in Stone."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Aspen 90mm — Charcoal"}'::jsonb, 'vert-aspen90-charcoal', '{"en":"Translucent 90mm louvres in Charcoal."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  -- ── Vertical: Beach 90mm (4 colours) ──
  ('{"en":"Beach 90mm — White"}'::jsonb, 'vert-beach90-white', '{"en":"Coastal 90mm louvres in White."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Beach 90mm — Linen"}'::jsonb, 'vert-beach90-linen', '{"en":"Coastal 90mm louvres in Linen."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Beach 90mm — Sand"}'::jsonb, 'vert-beach90-sand', '{"en":"Coastal 90mm louvres in Sand."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Beach 90mm — Ivory"}'::jsonb, 'vert-beach90-ivory', '{"en":"Coastal 90mm louvres in Ivory."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  -- ── Vertical: Solitaire 90mm (4 colours) ──
  ('{"en":"Solitaire 90mm — White"}'::jsonb, 'vert-solitaire90-white', '{"en":"Classic 90mm louvres in White."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Solitaire 90mm — Cream"}'::jsonb, 'vert-solitaire90-cream', '{"en":"Classic 90mm louvres in Cream."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Solitaire 90mm — Grey"}'::jsonb, 'vert-solitaire90-grey', '{"en":"Classic 90mm louvres in Grey."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Solitaire 90mm — Charcoal"}'::jsonb, 'vert-solitaire90-charcoal', '{"en":"Classic 90mm louvres in Charcoal."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),

  -- ── Accessories ──
  ('{"en":"Stainless Steel Ball Chain"}'::jsonb, 'acc-ss-ball-chain', '{"en":"Upgrade to a durable stainless steel control chain for roller blinds."}'::jsonb, 17000, '{}', (select id from product_categories where slug = 'accessories'), 999, true),
  ('{"en":"Wood Valance (106mm)"}'::jsonb, 'acc-wood-valance', '{"en":"Decorative wood pelmet to conceal the roller mechanism."}'::jsonb, 25900, '{}', (select id from product_categories where slug = 'accessories'), 999, true),
  ('{"en":"Cassette with Full Fascia"}'::jsonb, 'acc-cassette-fascia', '{"en":"Enclosed aluminium cassette for a clean, modern look."}'::jsonb, 44200, '{}', (select id from product_categories where slug = 'accessories'), 999, true),
  ('{"en":"Side Guides"}'::jsonb, 'acc-side-guides', '{"en":"Aluminium edge guides to eliminate light gaps."}'::jsonb, 38400, '{}', (select id from product_categories where slug = 'accessories'), 999, true)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, price_cents = excluded.price_cents, category_id = excluded.category_id;

-- ─── Admin User Note ─────────────────────────────────────────
-- To create an admin user:
-- 1. Sign up via the Supabase Auth dashboard or the app's register page
-- 2. Then update the role in user_profiles:
--    UPDATE public.user_profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
-- 3. The custom_access_token_hook will pick up the role on next login.
