# Blindly — Technical Architecture & Competitor Research

## 1. BLINDLY OVERVIEW

**What it is:** An online blind configurator + e-commerce platform for Nortier (trading as Blindly), selling Crawford's/Shademaster manufactured blinds direct to consumers in South Africa.

**Stack:**
- **Framework:** Next.js 16.1.6 (App Router, Server Components, Server Actions)
- **Database:** Supabase (PostgreSQL) with 39 migrations
- **Auth:** Supabase Auth (students/customers) + custom session (admin)
- **Payments:** Paystack (ZAR only, card + EFT)
- **Email:** Resend (primary) + Nodemailer SMTP (fallback), React Email templates
- **Hosting:** Vercel (serverless)
- **CSS:** Tailwind CSS 4 + shadcn/ui (Radix primitives)
- **Excel:** ExcelJS (supplier order generation), xlsx (price sheet import/parsing)
- **Language:** TypeScript 5 (strict mode)

**Domain:** blindly.co.za

---

## 2. KEY FEATURES

### Blind Configurator (public)
- Multi-step flow: Category → Type/Range → Measurements → Colour → Accessories → Quote
- Real-time pricing from supplier price matrices (~15-20k rows per supplier)
- Markup engine: global, category, type, or range-specific margins
- VAT calculation (15% ZAR)
- Volume discounts (configurable tiers, e.g. 2.5% at R20k+)
- Motorisation options with compatibility checks (tube size, width)
- Extras/accessories with width-based pricing
- Location label per blind (room/window identification for installer)

### Cart & Checkout (guest, no auth required)
- LocalStorage-persisted cart
- Multi-step checkout: Contact → Delivery Address → Installation Type → Notes
- Address autocomplete (Photon/OSM, South Africa bounding box)
- Distance calculation for transport pricing
- Two delivery types: self-install (courier) vs professional install (labour + transport)
- Courier pricing by weight, installation pricing by blind count + distance
- Paystack payment initialization → redirect → webhook confirmation

### Post-Payment Automation (webhook)
1. Order marked as paid in DB
2. Auto-generated invoice record
3. Customer confirmation email (React Email template, item specs, pricing breakdown)
4. Supplier order email with styled XLSX attachment (ExcelJS, Shademaster-format)
5. Admin notification email

### Admin Dashboard (50+ pages)
- Blind product management (categories, types, ranges, colours)
- XLS/XLSX supplier price sheet import with preview & validation
- 5 parser types: standard matrix, extras, mechanisms, motorisation, vertical slatting
- Markup/pricing rules editor
- Order management with status workflow
- Installation/transport/courier pricing tier editor
- Invoice generation
- Email campaign builder with audience segmentation, drip scheduling, open/click tracking
- Blog, portfolio, FAQ, legal document CMS (EN/AF bilingual)
- Booking system with availability, credits, cancellation policies
- LMS (courses, lessons, enrollment, progress tracking)
- SEO management (metadata, structured data, OpenGraph)
- Contact form submissions
- Activity logging

### Customer Portal
- Order history & detail
- Booking management
- Course enrollment & lesson viewer
- Invoice access
- Account settings

---

## 3. DATABASE SCHEMA (key Blindly tables)

### Product Catalogue
- `blind_categories` — Roller, Aluminium Venetian, Wood Venetian, Vertical, etc.
- `blind_types` — 25mm Aluminium, 50mm Aluminium, 127mm Vertical, etc.
- `blind_ranges` — Individual product lines (Plain & Designer, Beach, Cedar, etc.)
- `price_matrices` — Width × Drop → Supplier price lookup
- `vertical_slat_mapping` — Width → slat count for verticals

### Pricing & Extras
- `blind_extras` — Optional add-ons (valance, chain drive, motorisation)
- `extra_price_points` — Width-based extra pricing
- `motorisation_options` — Motor brands/models (rechargeable, tube size)
- `motorisation_prices` — Motor pricing by width
- `mechanism_lookup` — Tube size lookup (width × drop)
- `markup_config` — Supplier markup (global/category/type/range scoping)
- `import_mappings` — XLS sheet → blind range mappings for bulk import

### Orders
- `blindly_orders` — Guest checkout, auto-numbered (BL-2026-0001), delivery type, distance, notes
- `blindly_order_items` — Individual blinds with full pricing breakdown (supplier cost, markup, extras, VAT, line total)
- `saved_quotes` — Abandoned cart recovery (drip email at 24h, 72h, 7d)
- `swatch_requests` — Sample requests
- `measure_requests` — In-home measurement bookings
- `invoices` — Auto-generated from orders

### Auth & Users
- `user_profiles` — Role (admin/customer), extended profile fields
- RLS policies: public read for products, customer read own orders, admin full access

---

## 4. API ROUTES

| Route | Purpose |
|-------|---------|
| `POST /api/blinds/checkout` | Create order in DB, initialize Paystack transaction |
| `POST /api/blinds/price` | Customer-facing price lookup (no supplier cost exposed) |
| `GET /api/blinds/options` | Product options (colours, mechanisms) |
| `GET /api/blinds/extras` | Available extras with pricing for a range |
| `GET /api/blinds/grid` | Available width/drop grid points for a range |
| `GET /api/blinds/motors` | Motorisation options with compatibility & price |
| `GET /api/pricing-rules` | Installation/transport/courier pricing tiers |
| `GET /api/address-search` | Photon/OSM address autocomplete |
| `GET /api/distance` | Distance calculation for transport pricing |
| `POST /api/webhooks/paystack` | Payment confirmation → emails → supplier order |
| `POST /api/admin/import` | XLS/XLSX supplier price sheet import |
| `GET /api/admin/blinds/pricing` | Markup configuration retrieval |
| `GET /api/cron/daily` | Campaigns, drip emails, cleanup |

---

## 5. EMAIL SYSTEM

**Templates (React Email):**
- `blindly-order-confirmation` — Customer: full order breakdown, blind specs, accessories, pricing
- `blindly-supplier-order` — Supplier: customer details, blind specs, manufacture dimensions, accessories
- `admin-new-order` — Admin: order summary with link to admin panel
- Plus: welcome, booking, enrollment, newsletter, contact form templates

**Supplier Order XLSX:**
- Generated with ExcelJS (no template file dependency)
- Styled: navy title bar, blue column headers, alternating rows, Blindly orange accent
- Shademaster-compatible format: NO, LOCATION, QTY, WIDTH, DROP, CTRL L/R, MOUNT, BLIND TYPE, RANGE, COLOUR, SLAT
- Sent as email attachment to SUPPLIER_EMAIL

---

## 6. PRICING ENGINE

```
Supplier price (from matrix)
  + Markup (% configurable per scope)
  = Customer price (ex-VAT)
  + Extras (width-based, ex-VAT)
  + VAT (15%)
  = Line total per blind

Sum of line totals
  - Volume discount (tier-based, e.g. 2.5% at R20k, 5% at R50k)
  + Installation fee (per-blind labour, professional only)
  + Transport fee (distance-based, professional only)
  OR Courier fee (weight-based, self-install)
  = Order total
```

---

## 7. ENVIRONMENT & INTEGRATIONS

| Service | Purpose | Status |
|---------|---------|--------|
| Supabase | Auth + PostgreSQL DB + Storage | Active |
| Paystack | Payment processing (ZAR) | Active (test mode) |
| Resend | Transactional email | Active (blindly.co.za verified) |
| Vercel | Hosting + CI/CD | Active |
| Photon/OSM | Address autocomplete | Active |
| Google Analytics | Site analytics | Configured (not yet active) |
| Facebook Pixel | Ad tracking | Configured (not yet active) |
| WhatsApp Cloud API | Messaging | Configured (not yet active) |
| Microsoft Graph | Calendar sync | Configured (not yet active) |

---

## 8. SITE CONFIG

- **Brand:** Primary `#C4663A` (orange), Secondary `#6B8F71`, Dark `#3A3632`
- **Fonts:** DM Serif Display (headings), DM Sans (body)
- **Locale:** English (default) + Afrikaans
- **Currency:** ZAR
- **Timezone:** Africa/Johannesburg
- **Dark mode:** Enabled
- **Customer auth:** Disabled (guest checkout only)
- **Portal:** Disabled
- **Blog:** Disabled

---

## 9. CRAWFORD'S / SHADEMASTER — SUPPLIER RESEARCH

### Company Profile
- **Name:** Crawford's (manufacturer/distributor brand: Shademaster)
- **HQ:** 29-31 Estmil Road, Green Park, Diep River, Cape Town, 7800
- **CT Phone:** +27 (0)21 712 7790
- **CT Email:** blindsct@crawfords.co.za
- **Gauteng:** Co.Space, President Park, Midrand, 1685
- **GP Phone:** +27 (0)82 323 6524
- **GP Email:** blindsjhb@crawfords.co.za

### Product Range
- Roller blinds (standard, dual/duo, motorised, multiple)
- Vertical blinds (127mm)
- Aluminium venetian (25mm, 50mm)
- Wood & bamboo venetian
- Outdoor screen blinds
- Shutters
- Curtain tracks
- Somfy motorisation
- Fabrics

### Their Website (crawfords.co.za) — Technical Analysis

**Platform:** WordPress + Brizy page builder + WooCommerce (minimal use)

**Critical Issues:**
1. **SEO is terrible** — No meta descriptions, no Open Graph tags, no structured data/JSON-LD. Google gets nothing useful.
2. **Client-side rendered via Brizy** — HTML body is mostly empty CSS. Crawlers can't read content. Social media previews are broken.
3. **Duplicate pages everywhere** — `distributors` & `distributors2`, `blinds` & `blinds2`, `fabrics` & `fabrics-2`, `contact-us` & `contact`. Messy URL structure from repeated rebuilds.
4. **WooCommerce installed but dead** — Shop, basket, checkout pages exist but no products. Dead weight.
5. **No analytics** beyond basic Jetpack stats — No Google Analytics, no Facebook Pixel.
6. **Wrong homepage content** — Welcome text mentions "classes and courses at beginner and advanced levels" — leftover from a completely different business (art studio?). Unchanged since Feb 2023.
7. **No social media presence** detected.
8. **No mobile app/PWA capability.**
9. **Application passwords endpoint exposed** — Minor security concern.
10. **Site age:** Oldest pages from November 2022 (~3.5 years), but content suggests multiple rebuilds.

**Plugins:** Jetpack, Akismet, Contact Form 7, WooCommerce, VideoPress

**What this means for Blindly:**
- Crawford's cannot sell online effectively — their site is a brochure at best
- Blindly fills the gap as a modern online storefront for their products
- Server-rendered Next.js with proper SEO, structured data, and real e-commerce
- Mobile-first, fast, no page-builder bloat
- Automated supplier ordering reduces manual work for both parties

### Supplier Order Email
- **Current test:** stean@yoros.co.za
- **Production:** ctorders@crawfords.co.za (Crawford's CT order intake)

---

## 10. CURRENT STATUS & KNOWN ISSUES

### Working
- Full blind configurator flow
- Cart with location labels, accessories, pricing
- Checkout with address autocomplete, distance calculation, installation options
- Paystack payment (test mode)
- Webhook → customer email ✓, admin email ✓, supplier email with XLSX ✓
- Invoice auto-generation
- Admin order management
- XLS supplier price sheet import (5 parser types)

### Recently Fixed
- Cart subtotal now includes accessories (was blind-only)
- Cart clears after order creation (was only on success page)
- Email footer directs to info@nortier.co.za (was "reply to noreply@")
- Supplier XLSX switched from template-based to code-generated (Vercel compatibility)
- Supplier XLSX switched from xlsx to ExcelJS for proper styling
- RESEND_FROM and ADMIN_EMAIL added to Vercel env vars
- NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY corrected (was set to secret key)

### Pending
- Paystack dashboard: update support email from info@yoros.co.za → info@nortier.co.za
- Switch SUPPLIER_EMAIL to ctorders@crawfords.co.za for production
- Switch Paystack to live keys for production
- Google Analytics integration (ID configured, not active)
- Facebook Pixel integration (configured, not active)
- Customer order form PDF (currently only supplier gets XLSX, customer gets HTML email)
- Saved quotes / abandoned cart drip emails (DB tables exist, logic not wired)
- Swatch request flow (DB table exists, UI not built)
- Measure request flow (DB table exists, UI not built)
