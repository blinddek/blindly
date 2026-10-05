# Build

> **follow** — how the thing is made. Bands are reserved, not required — an absent band means never applicable, not forgotten.

| File | What it settles |
|---|---|
| `INDEX.md` | What is built, in what order. ≤ 40 KB. |
| `00-BUILD_INDEX.md` | The original 29-build plan: order, dependencies, estimates (61 KB, historical; specs say Paystack, the code uses PayFast). |
| `01-build_01_project_scaffold.md` | Build 01 — Project Scaffold (original build spec, Feb 2026). |
| `02-build_02_universal_foundation.md` | Build 02 — Universal Database Foundation (original build spec, Feb 2026). |
| `03-build_03_blinds_product_schema.md` | Build 03 — Blinds Product Schema (original build spec, Feb 2026). |
| `04-build_04_pricing_extras_schema.md` | Build 04 — Pricing & Extras Schema (original build spec, Feb 2026). |
| `05-build_05_orders_schema.md` | Build 05 — Orders & Checkout Schema (original build spec, Feb 2026). |
| `06-build_06_quotes_leads_schema.md` | Build 06 — Quotes & Leads Schema (original build spec, Feb 2026). |
| `07-build_07_rls_policies.md` | Build 07 — RLS Policies & Indexes (original build spec, Feb 2026). |
| `08-build_08_xls_parser.md` | Build 08 — XLS Parser Engine (original build spec, Feb 2026). |
| `09-build_09_seed_data.md` | Build 09 — Seed Data Import (original build spec, Feb 2026). |
| `10-build_10_price_lookup.md` | Build 10 — Price Lookup Engine (original build spec, Feb 2026). |
| `11-build_11_admin_auth_layout.md` | Build 11 — Admin: Auth & Layout (original build spec, Feb 2026). |
| `12-build_12_admin_import_ui.md` | Build 12 — Admin: Price Import UI (original build spec, Feb 2026). |
| `13-build_13_admin_products.md` | Build 13 — Admin: Product Management (original build spec, Feb 2026). |
| `14-build_14_admin_pricing.md` | Build 14 — Admin: Markup & Pricing Config (original build spec, Feb 2026). |
| `15-build_15_configurator_steps_1_5.md` | Build 15 — Configurator: Steps 1–5 (original build spec, Feb 2026). |
| `16-build_16_configurator_steps_6_7.md` | Build 16 — Configurator: Steps 6–7 (Measurements + Multi-Window) (original build spec, Feb 2026). |
| `17-build_17_cart_accessories.md` | Build 17 — Cart & Accessories Upsell (original build spec, Feb 2026). |
| `18-build_18_quote_save_share.md` | Build 18 — Quote Save & Share (original build spec, Feb 2026). |
| `19-build_19_checkout_paystack.md` | Build 19 — Checkout & Paystack Integration (original build spec, Feb 2026). |
| `20-build_20_order_emails.md` | Build 20 — Order Emails & Confirmation (original build spec, Feb 2026). |
| `21-build_21_admin_orders.md` | Build 21 — Admin: Order Management (original build spec, Feb 2026). |
| `22-build_22_supplier_pdf.md` | Build 22 — Admin: Supplier PDF Generation (original build spec, Feb 2026). |
| `23-build_23_admin_quotes_leads.md` | Build 23 — Admin: Quotes & Leads Management (original build spec, Feb 2026). |
| `24-build_24_homepage_layout.md` | Build 24 — Public Pages: Homepage & Layout (original build spec, Feb 2026). |
| `25-build_25_product_browse.md` | Build 25 — Public Pages: Product Browse (original build spec, Feb 2026). |
| `26-build_26_public_pages.md` | Build 26 — Public Pages: About, Contact, FAQ, Gallery (original build spec, Feb 2026). |
| `27-build_27_seo.md` | Build 27 — SEO, Sitemap, Structured Data (original build spec, Feb 2026). |
| `28-build_28_room_preview.md` | Build 28 — Room Preview (Stretch Goal) (original build spec, Feb 2026). |
| `29-build_29_final_polish.md` | Build 29 — Final Polish, Performance Audit, Launch Prep (original build spec, Feb 2026). |
| `30-TECHNICAL_DESIGN.md` | Shademaster price-file analysis, schema and pricing design. |

## Reserved bands

`00` cross-cutting · `10` foundation · `20` SSOT · `30` data · `40` auth · `50` surfaces ·
`60` content · `70` integrations · `80` operations · `90` release

`90-release.md` has a grammar when someone pays for the work: milestones, budget, delivery date and
a change log, which `scripts/delivery-report.mjs` turns into the payer's report (dev-standards
DELIVERY-STANDARD §2).

Amendments number under what they amend — `20.1-ssot-cutover.md` sorts beneath `20-ssot.md`.
No two documents may claim the same number.
