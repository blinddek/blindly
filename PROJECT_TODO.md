# Blindly — Project TODO

> Last updated: 2026-02-26

## Status: ~95% Complete (29/29 builds done)

Build specs: `project_brief/build plan/build_XX_*.md`

---

### Phase 1: Database & Schema — COMPLETE

- [x] Build 01: Project Scaffold (`build_01_scaffold.md`)
- [x] Build 02: Universal Database Foundation (migrations 001–025)
- [x] Build 03: Blinds Product Schema (`build_03_blinds_product_schema.md` → migration 026)
- [x] Build 04: Pricing & Markup Schema (`build_04_pricing_extras_schema.md` → migration 027)
- [x] Build 05: Orders & Checkout Schema (`build_05_orders_schema.md` → migration 028)
- [x] Build 06: Quotes & Leads Schema (`build_06_quotes_leads.md` → migration 029)
- [x] Build 07: RLS Policies & Indexes (`build_07_rls.md` → migration 030)

### Phase 2: Parser & Import Engine — COMPLETE

- [x] Build 08: XLS Parser Engine (`build_08_xls_parser.md` → lib/parsers/)
- [x] Build 09: Seed Data Import (`build_09_seed_data.md` → seed.sql, 212 products)
- [x] Build 10: Price Lookup Engine (`build_10_price_lookup.md` → lib/pricing/)

### Phase 3: Admin Dashboard — COMPLETE

- [x] Build 11: Admin Auth & Layout (`build_11_admin_auth.md`)
- [x] Build 12: Admin Price Import UI (`build_12_admin_import_ui.md` → /admin/blinds/import)
- [x] Build 13: Admin Product Management (`build_13_admin_products.md`)
- [x] Build 14: Admin Markup & Pricing Config (`build_14_markup_config.md`)

### Phase 4: Configurator — COMPLETE

- [x] Build 15: Configurator Steps 1–5 (`build_15_configurator_1_5.md`)
- [x] Build 16: Configurator Steps 6–7 (`build_16_configurator_6_7.md`)
- [x] Build 17: Cart & Accessories Upsell (`build_17_cart.md`)
- [x] Build 18: Quote Save & Share (`build_18_quotes.md`)

### Phase 5: Checkout & Orders — COMPLETE

- [x] Build 19: Checkout & Paystack (`build_19_checkout.md`)
- [x] Build 20: Order Emails & Confirmation (`build_20_emails.md`)
- [x] Build 21: Admin Order Management (`build_21_admin_orders.md`)
- [x] Build 22: Supplier PDF Generation (`build_22_supplier_pdf.md`)
- [x] Build 23: Admin Quotes & Leads (`build_23_admin_quotes.md`)

### Phase 6: Public Pages & Launch — COMPLETE

- [x] Build 24: Homepage & Layout (`build_24_homepage.md`)
- [x] Build 25: Product Browse (`build_25_product_browse.md`)
- [x] Build 26: About, Contact, FAQ, Gallery (`build_26_pages.md`)
- [x] Build 27: SEO, Sitemap, Structured Data (`build_27_seo.md`)
- [x] Build 28: Room Preview (Stretch Goal) (`build_28_room_preview.md`)
- [x] Build 29: Final Polish & Launch Prep (`build_29_launch.md`)

### Post-Launch Enhancements (NEW)

- [x] Migration 031: Supplier management + import mapping enhancements
- [x] Supplier-agnostic configurable import system (client self-service)
- [x] SonarLint compliance — all parsers refactored (complexity <15)
- [ ] Real product photography (client-supplied)
- [ ] WhatsApp order notifications
- [ ] Customer portal: order tracking
- [ ] Swatch request fulfilment workflow
- [ ] Multi-supplier PDF order forms
