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
  ((select id from blind_categories where slug = 'wood-venetian'), '50mm Wood', '50mm-wood', 50, 'wood', 30, 270, 30, 300, 50, 1),
  ((select id from blind_categories where slug = 'wood-venetian'), '50mm Bamboo', '50mm-bamboo', 50, 'bamboo', 30, 240, 30, 240, 50, 2),
  ((select id from blind_categories where slug = 'wood-venetian'), '50mm PVC (Polywood)', '50mm-pvc', 50, 'pvc', 30, 240, 30, 240, 40, 3),
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

-- ─── Sample Blind Ranges ────────────────────────────────────
insert into public.blind_ranges (blind_type_id, name, slug, description, colour_options, display_order) values
  ((select id from blind_types where slug = 'roller-standard'), 'Beach', 'roller-beach',
   'Light filtering fabric with a coastal, relaxed aesthetic.',
   '[{"name": "White", "hex": "#FFFFFF"}, {"name": "Ivory", "hex": "#FFFFF0"}, {"name": "Linen", "hex": "#E8DFD0"}, {"name": "Stone", "hex": "#C4BEB5"}]'::jsonb, 1),
  ((select id from blind_types where slug = 'roller-standard'), 'Cedar', 'roller-cedar',
   'Textured weave sunscreen fabric with excellent outward visibility.',
   '[{"name": "White", "hex": "#FFFFFF"}, {"name": "Charcoal", "hex": "#36454F"}, {"name": "Mocha", "hex": "#967969"}]'::jsonb, 2),
  ((select id from blind_types where slug = 'roller-standard'), 'Sanctuary Blockout', 'roller-sanctuary-bo',
   'Premium blockout fabric for complete light control.',
   '[{"name": "White", "hex": "#FFFFFF"}, {"name": "Cream", "hex": "#FFFDD0"}, {"name": "Charcoal", "hex": "#36454F"}, {"name": "Navy", "hex": "#1B2A4A"}]'::jsonb, 3),
  ((select id from blind_types where slug = 'roller-standard'), 'Sanctuary Light Filtering', 'roller-sanctuary-lf',
   'Soft light filtering fabric that gently diffuses natural light.',
   '[{"name": "White", "hex": "#FFFFFF"}, {"name": "Linen", "hex": "#E8DFD0"}, {"name": "Blush", "hex": "#DEB5A0"}]'::jsonb, 4),
  ((select id from blind_types where slug = '25mm-aluminium'), 'Plain & Designer', '25mm-plain-designer',
   'Core collection of solid colours and metallic finishes.',
   '[{"name": "White", "hex": "#FFFFFF"}, {"name": "Silver", "hex": "#C0C0C0"}, {"name": "Black", "hex": "#1A1A1A"}, {"name": "Gold", "hex": "#D4AF37"}]'::jsonb, 1),
  ((select id from blind_types where slug = '50mm-aluminium'), 'Plain & Designer', '50mm-plain-designer',
   'Wide-slat aluminium in a curated selection of colours.',
   '[{"name": "White", "hex": "#FFFFFF"}, {"name": "Silver", "hex": "#C0C0C0"}, {"name": "Gunmetal", "hex": "#535355"}]'::jsonb, 1),
  ((select id from blind_types where slug = '50mm-aluminium'), 'Brushed & Perforated', '50mm-brushed-perforated',
   'Premium metallic finishes and perforated slats.',
   '[{"name": "Brushed Silver", "hex": "#B0B0B0"}, {"name": "Brushed Champagne", "hex": "#C9B99A"}]'::jsonb, 2),
  ((select id from blind_types where slug = '50mm-wood'), 'Sherwood', '50mm-sherwood',
   'Real stained timber venetian in rich natural tones.',
   '[{"name": "Natural", "hex": "#D4A76A"}, {"name": "Walnut", "hex": "#5C3A21"}, {"name": "White", "hex": "#F5F5F0"}]'::jsonb, 1),
  ((select id from blind_types where slug = '127mm-vertical'), 'Sabre', 'vertical-sabre',
   'Durable fabric louvres in a textured weave.',
   '[{"name": "White", "hex": "#FFFFFF"}, {"name": "Cream", "hex": "#FFFDD0"}, {"name": "Grey", "hex": "#808080"}]'::jsonb, 1),
  ((select id from blind_types where slug = '127mm-vertical'), 'PVC Smooth', 'vertical-pvc-smooth',
   'Easy-clean PVC louvres for kitchens and bathrooms.',
   '[{"name": "White", "hex": "#FFFFFF"}, {"name": "Cream", "hex": "#FFF8E7"}]'::jsonb, 2)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  colour_options = excluded.colour_options,
  display_order = excluded.display_order;

-- ─── Additional Roller Ranges ──────────────────────────────
insert into public.blind_ranges (blind_type_id, name, slug, description, colour_options, display_order) values
  ((select id from blind_types where slug = 'roller-standard'), 'Aspen & Classic', 'roller-aspen',
   'Versatile translucent fabric with a soft weave.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Ivory","hex":"#FFFFF0"},{"name":"Pebble","hex":"#C4BCA8"},{"name":"Charcoal","hex":"#36454F"}]'::jsonb, 5),
  ((select id from blind_types where slug = 'roller-standard'), 'Kleenscreen', 'roller-kleenscreen',
   'Anti-bacterial sunscreen ideal for kitchens, bathrooms, and medical spaces.',
   '[{"name":"White","hex":"#F8F8F8"},{"name":"Cream","hex":"#FFFDD0"},{"name":"Grey","hex":"#A9A9A9"}]'::jsonb, 6),
  ((select id from blind_types where slug = 'roller-standard'), 'Matrix', 'roller-matrix',
   'Bold geometric weave with excellent UV control.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Graphite","hex":"#4A4A4A"},{"name":"Mocha","hex":"#967969"},{"name":"Taupe","hex":"#B8A99A"}]'::jsonb, 7),
  ((select id from blind_types where slug = 'roller-standard'), 'Sable', 'roller-sable',
   'Luxurious textured blockout fabric.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Linen","hex":"#E8DFD0"},{"name":"Dove","hex":"#B0AFA8"},{"name":"Charcoal","hex":"#36454F"},{"name":"Black","hex":"#1A1A1A"}]'::jsonb, 8),
  ((select id from blind_types where slug = 'roller-standard'), 'Smart Screen', 'roller-smartscreen',
   'Performance sunscreen with excellent outward visibility and UV rejection.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Linen","hex":"#E8DFD0"},{"name":"Charcoal","hex":"#4A4A4A"},{"name":"Bronze","hex":"#8C6E4A"}]'::jsonb, 9),
  ((select id from blind_types where slug = 'roller-standard'), 'Solar Cool', 'roller-solarcool',
   'Reflective sunscreen that reduces heat gain — ideal for hot climates.',
   '[{"name":"Silver","hex":"#C0C0C0"},{"name":"White","hex":"#F0F0F0"},{"name":"Pearl","hex":"#E8E4D9"}]'::jsonb, 10),
  ((select id from blind_types where slug = 'roller-standard'), 'Solitaire', 'roller-solitaire',
   'Classic translucent fabric in a wide palette of neutral tones.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Ivory","hex":"#FFFFF0"},{"name":"Sand","hex":"#C2B280"},{"name":"Stone","hex":"#C4BEB5"},{"name":"Charcoal","hex":"#36454F"}]'::jsonb, 11),
  ((select id from blind_types where slug = 'roller-standard'), 'Uniview', 'roller-uniview',
   'Open-weave sunscreen with maximum outward visibility.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Charcoal","hex":"#3A3A3A"},{"name":"Bronze","hex":"#8C6E4A"}]'::jsonb, 12),
  ((select id from blind_types where slug = 'roller-standard'), 'Urban', 'roller-urban',
   'Contemporary textured fabric with a subtle linen aesthetic.',
   '[{"name":"White","hex":"#F5F5F0"},{"name":"Linen","hex":"#E8DFD0"},{"name":"Stone","hex":"#B5B0A8"},{"name":"Charcoal","hex":"#4A4A4A"},{"name":"Navy","hex":"#1B2A4A"}]'::jsonb, 13),
  ((select id from blind_types where slug = 'roller-standard'), 'Vogue', 'roller-vogue',
   'Fashion-forward patterns and metallic sheens for statement windows.',
   '[{"name":"Pearl","hex":"#E8E4D9"},{"name":"Champagne","hex":"#F7E7CE"},{"name":"Graphite","hex":"#4A4A4A"}]'::jsonb, 14)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, colour_options = excluded.colour_options, display_order = excluded.display_order;

-- ─── Additional Aluminium Ranges ──────────────────────────
insert into public.blind_ranges (blind_type_id, name, slug, description, colour_options, display_order) values
  ((select id from blind_types where slug = '25mm-aluminium'), 'Licorice & Mushroom', '25mm-licorice-mushroom',
   'Rich charcoal and warm mushroom tones in 25mm slats.',
   '[{"name":"Licorice","hex":"#2D2D2D"},{"name":"Mushroom","hex":"#B5A89A"},{"name":"Graphite","hex":"#4A4A4A"}]'::jsonb, 2),
  ((select id from blind_types where slug = '50mm-aluminium'), 'Décor', '50mm-decor',
   'Premium wood-look and metallic finishes on durable aluminium.',
   '[{"name":"Oak","hex":"#C4963A"},{"name":"Walnut","hex":"#5C3A21"},{"name":"Cherry","hex":"#8B2500"},{"name":"White","hex":"#FFFFFF"}]'::jsonb, 3)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, colour_options = excluded.colour_options, display_order = excluded.display_order;

-- ─── Additional Wood & Natural Ranges ─────────────────────
insert into public.blind_ranges (blind_type_id, name, slug, description, colour_options, display_order) values
  ((select id from blind_types where slug = '50mm-wood'), 'Wood 50mm', '50mm-wood-natural',
   'Classic 50mm real wood venetian in natural grain finishes.',
   '[{"name":"Natural","hex":"#D4A76A"},{"name":"White","hex":"#F5F5F0"},{"name":"Walnut","hex":"#5C3A21"},{"name":"Espresso","hex":"#3C1F0A"}]'::jsonb, 2),
  ((select id from blind_types where slug = '50mm-bamboo'), 'Bamboo 50mm', '50mm-bamboo-natural',
   'Eco-friendly bamboo slats with a natural woven texture.',
   '[{"name":"Natural","hex":"#D4B896"},{"name":"Carbonised","hex":"#8B6B3D"},{"name":"Walnut","hex":"#5C3A21"}]'::jsonb, 1),
  ((select id from blind_types where slug = '50mm-pvc'), 'PVC Smooth 50mm', '50mm-pvc-smooth',
   'Moisture-resistant PVC venetian — perfect for kitchens and bathrooms.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Cream","hex":"#FFF8E7"},{"name":"Grey","hex":"#B0B0B0"}]'::jsonb, 1)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, colour_options = excluded.colour_options, display_order = excluded.display_order;

-- ─── Additional Vertical Ranges ───────────────────────────
insert into public.blind_ranges (blind_type_id, name, slug, description, colour_options, display_order) values
  ((select id from blind_types where slug = '90mm-vertical'), 'Aspen 90mm', 'vertical-aspen-90',
   'Classic translucent 90mm louvres in a soft weave.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Ivory","hex":"#FFFFF0"},{"name":"Stone","hex":"#C4BEB5"}]'::jsonb, 1),
  ((select id from blind_types where slug = '90mm-vertical'), 'Beach 90mm', 'vertical-beach-90',
   'Coastal-inspired 90mm louvres with a relaxed texture.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Linen","hex":"#E8DFD0"},{"name":"Sand","hex":"#C2B280"}]'::jsonb, 2),
  ((select id from blind_types where slug = '90mm-vertical'), 'Solitaire 90mm', 'vertical-solitaire-90',
   'Classic fabric louvres in a wide palette of neutral tones.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Cream","hex":"#FFFDD0"},{"name":"Grey","hex":"#808080"}]'::jsonb, 3),
  ((select id from blind_types where slug = '127mm-vertical'), 'Aspen 127mm', 'vertical-aspen-127',
   'Classic translucent 127mm louvres.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Ivory","hex":"#FFFFF0"},{"name":"Stone","hex":"#C4BEB5"},{"name":"Charcoal","hex":"#4A4A4A"}]'::jsonb, 3),
  ((select id from blind_types where slug = '127mm-vertical'), 'Beach 127mm', 'vertical-beach-127',
   'Coastal-inspired 127mm fabric louvres.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Linen","hex":"#E8DFD0"},{"name":"Sand","hex":"#C2B280"},{"name":"Stone","hex":"#C4BEB5"}]'::jsonb, 4),
  ((select id from blind_types where slug = '127mm-vertical'), 'Solitaire 127mm', 'vertical-solitaire-127',
   'Classic 127mm louvres in neutral tones.',
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Ivory","hex":"#FFFFF0"},{"name":"Sand","hex":"#C2B280"},{"name":"Grey","hex":"#808080"}]'::jsonb, 5)
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

-- ─── Products (one per range as browsable items) ──────────
-- "From" prices shown; actual price depends on dimensions via configurator
insert into public.products (name, slug, description, price_cents, images, category_id, stock_quantity, is_active) values
  -- Roller Blinds
  ('{"en":"Beach Roller Blind"}'::jsonb, 'roller-beach', '{"en":"Light filtering fabric with a coastal, relaxed aesthetic. Available in White, Ivory, Linen, and Stone."}'::jsonb, 49000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Cedar Roller Blind"}'::jsonb, 'roller-cedar', '{"en":"Textured weave sunscreen fabric with excellent outward visibility."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Sanctuary Blockout Roller"}'::jsonb, 'roller-sanctuary-bo', '{"en":"Premium blockout fabric for complete light control — bedrooms, nurseries, media rooms."}'::jsonb, 59000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Sanctuary Light Filtering"}'::jsonb, 'roller-sanctuary-lf', '{"en":"Soft light filtering fabric that gently diffuses natural light."}'::jsonb, 55000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Aspen & Classic Roller"}'::jsonb, 'roller-aspen', '{"en":"Versatile translucent fabric with a soft weave for living areas."}'::jsonb, 46000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Smart Screen Roller"}'::jsonb, 'roller-smartscreen', '{"en":"Performance sunscreen with excellent outward visibility and UV rejection."}'::jsonb, 62000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Solar Cool Roller"}'::jsonb, 'roller-solarcool', '{"en":"Reflective sunscreen that reduces heat gain — ideal for hot climates."}'::jsonb, 68000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Sable Blockout Roller"}'::jsonb, 'roller-sable', '{"en":"Luxurious textured blockout fabric in rich, sophisticated tones."}'::jsonb, 61000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Urban Roller Blind"}'::jsonb, 'roller-urban', '{"en":"Contemporary textured fabric with a subtle linen aesthetic."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  ('{"en":"Vogue Roller Blind"}'::jsonb, 'roller-vogue', '{"en":"Fashion-forward patterns and metallic sheens for statement windows."}'::jsonb, 72000, '{}', (select id from product_categories where slug = 'roller'), 999, true),
  -- Aluminium Venetian
  ('{"en":"25mm Plain & Designer Venetian"}'::jsonb, '25mm-plain-designer', '{"en":"Classic 25mm aluminium slats in solid and metallic finishes."}'::jsonb, 44000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"25mm Licorice & Mushroom Venetian"}'::jsonb, '25mm-licorice-mushroom', '{"en":"Rich charcoal and warm mushroom tones in 25mm aluminium."}'::jsonb, 48000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"50mm Plain & Designer Venetian"}'::jsonb, '50mm-plain-designer', '{"en":"Wide-slat aluminium venetian in contemporary colours."}'::jsonb, 56000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"50mm Brushed & Perforated Venetian"}'::jsonb, '50mm-brushed-perforated', '{"en":"Premium metallic finishes and perforated slats."}'::jsonb, 64000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  ('{"en":"50mm Décor Venetian"}'::jsonb, '50mm-decor', '{"en":"Wood-look and metallic finishes on durable aluminium."}'::jsonb, 62000, '{}', (select id from product_categories where slug = 'aluminium-venetian'), 999, true),
  -- Wood & Natural
  ('{"en":"50mm Sherwood Venetian"}'::jsonb, '50mm-sherwood', '{"en":"Real stained timber venetian in rich natural tones."}'::jsonb, 78000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"50mm Wood Venetian"}'::jsonb, '50mm-wood-natural', '{"en":"Classic 50mm real wood venetian in natural grain finishes."}'::jsonb, 82000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"50mm Bamboo Venetian"}'::jsonb, '50mm-bamboo-natural', '{"en":"Eco-friendly bamboo slats with a natural woven texture."}'::jsonb, 72000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  ('{"en":"50mm PVC Venetian"}'::jsonb, '50mm-pvc-smooth', '{"en":"Moisture-resistant PVC — perfect for kitchens and bathrooms."}'::jsonb, 48000, '{}', (select id from product_categories where slug = 'wood-venetian'), 999, true),
  -- Vertical
  ('{"en":"Sabre 127mm Vertical"}'::jsonb, 'vertical-sabre', '{"en":"Durable fabric louvres in a textured weave — ideal for sliding doors."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"PVC Smooth 127mm Vertical"}'::jsonb, 'vertical-pvc-smooth', '{"en":"Easy-clean PVC louvres for kitchens and bathrooms."}'::jsonb, 46000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Aspen 127mm Vertical"}'::jsonb, 'vertical-aspen-127', '{"en":"Classic translucent 127mm louvres."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"Beach 127mm Vertical"}'::jsonb, 'vertical-beach-127', '{"en":"Coastal-inspired 127mm fabric louvres."}'::jsonb, 56000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"90mm Aspen Vertical"}'::jsonb, 'vertical-aspen-90', '{"en":"Classic translucent 90mm louvres — a slimmer, contemporary profile."}'::jsonb, 52000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  ('{"en":"90mm Beach Vertical"}'::jsonb, 'vertical-beach-90', '{"en":"Coastal-inspired 90mm louvres with a relaxed texture."}'::jsonb, 54000, '{}', (select id from product_categories where slug = 'vertical'), 999, true),
  -- Accessories
  ('{"en":"Stainless Steel Ball Chain"}'::jsonb, 'ss-ball-chain', '{"en":"Upgrade to a durable stainless steel control chain for roller blinds."}'::jsonb, 17000, '{}', (select id from product_categories where slug = 'accessories'), 999, true),
  ('{"en":"Wood Valance (106mm)"}'::jsonb, 'wood-valance', '{"en":"Decorative wood pelmet to conceal the roller mechanism."}'::jsonb, 25900, '{}', (select id from product_categories where slug = 'accessories'), 999, true),
  ('{"en":"Cassette with Full Fascia"}'::jsonb, 'cassette-fascia', '{"en":"Enclosed aluminium cassette for a clean, modern look."}'::jsonb, 44200, '{}', (select id from product_categories where slug = 'accessories'), 999, true),
  ('{"en":"Side Guides"}'::jsonb, 'side-guides', '{"en":"Aluminium edge guides to eliminate light gaps."}'::jsonb, 38400, '{}', (select id from product_categories where slug = 'accessories'), 999, true)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, price_cents = excluded.price_cents, category_id = excluded.category_id;

-- ─── Admin User Note ─────────────────────────────────────────
-- To create an admin user:
-- 1. Sign up via the Supabase Auth dashboard or the app's register page
-- 2. Then update the role in user_profiles:
--    UPDATE public.user_profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
-- 3. The custom_access_token_hook will pick up the role on next login.
