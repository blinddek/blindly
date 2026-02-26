-- ============================================================
-- professional.sql — Industry seed: QS, Architect, Accountant
-- Overrides generic seed with professional services content
-- ============================================================

-- Override site settings
update public.site_content
set content = content || '{
  "company_tagline": {"en": "Professional expertise, trusted results", "af": "Professionele kundigheid, vertroude resultate"},
  "business_hours": "Mon-Fri 08:00-17:00"
}'::jsonb
where section_key = 'site_settings';

-- Override homepage hero
update public.homepage_sections
set content = '{
  "heading": {"en": "Professional Services You Can Trust", "af": "Professionele Dienste Waarop U Kan Vertrou"},
  "subheading": {"en": "Delivering excellence across every project", "af": "Lewering van uitnemendheid in elke projek"},
  "cta_text": {"en": "View Our Portfolio", "af": "Bekyk Ons Portefeulje"},
  "cta_url": "/portfolio",
  "background_image": null
}'::jsonb
where section_key = 'hero';

-- Override services section
update public.homepage_sections
set content = '{
  "heading": {"en": "Our Expertise", "af": "Ons Kundigheid"},
  "subheading": {"en": "Comprehensive professional services", "af": "Omvattende professionele dienste"},
  "items": [
    {"icon": "Briefcase", "title": {"en": "Consulting", "af": "Konsultasie"}, "description": {"en": "Expert advice tailored to your specific needs and goals.", "af": "Kundige advies aangepas vir u spesifieke behoeftes en doelwitte."}},
    {"icon": "FileText", "title": {"en": "Project Management", "af": "Projekbestuur"}, "description": {"en": "End-to-end project management for seamless delivery.", "af": "Volledige projekbestuur vir naatlose lewering."}},
    {"icon": "BarChart", "title": {"en": "Reports & Analysis", "af": "Verslae & Analise"}, "description": {"en": "Detailed reports and data-driven insights.", "af": "Gedetailleerde verslae en data-gedrewe insigte."}},
    {"icon": "CheckCircle", "title": {"en": "Compliance", "af": "Nakoming"}, "description": {"en": "Ensuring adherence to all industry standards and regulations.", "af": "Verseker nakoming van alle bedryfstandaarde en regulasies."}}
  ]
}'::jsonb
where section_key = 'services';

-- Professional-specific FAQs
delete from public.faqs;
insert into public.faqs (question, answer, display_order, is_active) values
  ('{"en": "What industries do you serve?", "af": "Watter bedrywe bedien julle?"}'::jsonb,
   '{"en": "We work across residential, commercial, and industrial sectors. Contact us to discuss your specific project.", "af": "Ons werk oor residensiële, kommersiële, en industriële sektore. Kontak ons om u spesifieke projek te bespreek."}'::jsonb,
   1, true),
  ('{"en": "Can I see examples of your work?", "af": "Kan ek voorbeelde van julle werk sien?"}'::jsonb,
   '{"en": "Absolutely! Visit our Portfolio page to see completed projects and case studies.", "af": "Beslis! Besoek ons Portefeulje-bladsy om voltooide projekte en gevallestudies te sien."}'::jsonb,
   2, true),
  ('{"en": "How do you handle project timelines?", "af": "Hoe hanteer julle projektydskedules?"}'::jsonb,
   '{"en": "We provide detailed project schedules upfront and keep you informed at every stage.", "af": "Ons verskaf gedetailleerde projekskedules vooraf en hou u op elke stadium ingelig."}'::jsonb,
   3, true),
  ('{"en": "What are your rates?", "af": "Wat is julle tariewe?"}'::jsonb,
   '{"en": "Rates depend on project scope and complexity. Contact us for a personalised quote.", "af": "Tariewe hang af van projekomvang en kompleksiteit. Kontak ons vir n persoonlike kwotasie."}'::jsonb,
   4, true);
