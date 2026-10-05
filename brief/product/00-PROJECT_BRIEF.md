# BLINDLY — Project Brief

> **Client:** Nortier Group
> **Project:** Blindly — Custom Blinds E-Commerce Platform
> **Price:** R5,000 (flat rate pilot)
> **Status:** Scoping Complete — Ready for Build
> **Last Updated:** 19 February 2026

---

## 1. Project Overview

Blindly is a custom e-commerce platform for selling window blinds online. It is NOT a standard webshop — it's a **product configurator** that handles complex variant pricing based on blind type, material, thickness, colour, width, and drop measurements.

The core supplier is **Shademaster**, whose pricing uses width × drop lookup matrices across 40+ Excel sheets. The platform must import these price lists, apply the client's markup, and present them through a seamless customer-facing configurator.

### Business Context

- Part of 4 pilot websites for Nortier Group (Blindly, TheDeckLab, Nortier Cupboards, LMS)
- Blinds is the client's highest-margin business and biggest priority
- Installation service creates foot-in-the-door for Nortier Cupboards cross-selling
- Client will provide 5-star review and beta-test full Yoros backend

---

## 2. Brand Identity — "Blindly"

### Concept
Fresh brand, no existing references. Full creative freedom.

### Logo Concept
**"See-through window" concept** — an SVG logo where the background shines through, evoking transparency, light, and blinds themselves. The logo should feel like looking through slats or a window treatment.

**Design Direction:**
- Clean, modern, premium feel
- The logo mark should incorporate a window/blind motif where negative space creates the "see-through" effect
- Background-transparent SVG so it works on any surface/colour
- Must NOT look like Microsoft Windows logo (avoid 4-pane grid)
- Think more: overlapping horizontal lines with gaps, or an abstract window frame with slat-like elements where light passes through
- Could play with the letter "B" incorporating blind slats

### Typography
- To be designed — modern, clean, slightly premium
- Needs to work at small sizes (favicon, mobile nav) and large (hero sections)
- Consider a sans-serif with geometric qualities

### Colour Palette
- To be designed from scratch
- Direction: sophisticated, residential, warm-but-modern
- Consider neutrals with a single accent colour
- Must work well against lifestyle/room photography
- Dark mode NOT required (this is a consumer shop, not a SaaS dashboard)

### Overall Brand Mood
- Premium but approachable (not luxury, not budget)
- Residential warmth — homes, comfort, light
- Professional and trustworthy (people are spending R10k+ on blinds)
- Clean and uncluttered (the configurator is complex enough)

---

## 3. Customer Journey — Configurator Flow

The entire purchase flow is a guided, step-by-step configurator. This is the heart of the platform.

### Step 1: Blind Type
**Question:** "What type of blind are you looking for?"

Visual cards showing the major categories:
- Roller Blinds
- Aluminium Venetian Blinds
- Wood / Bamboo / PVC Venetian Blinds
- Vertical Blinds

Each card: lifestyle photo + 1-line description + "X ranges available"

### Step 2: Mounting Type
**Question:** "Where will your blind be fitted?"

Two options with clear visual diagrams:
- **Inside mount** (within the window frame) — Width and drop must be ≤ window opening. System will validate and warn if oversized.
- **Outside mount** (over the window frame) — Width and drop must be ≥ window opening. System recommends overlap (e.g. +5cm each side).

This determines validation rules for measurements in Step 5.

### Step 3: Thickness / Slat Size
**Question:** "Choose your slat size"

Options depend on Step 1 selection:
- Aluminium Venetian: 25mm, 50mm
- Wood Venetian: 35mm, 50mm, 63mm
- Roller: N/A (skip this step)
- Vertical: 90mm, 127mm

**If inside mount selected:** Display warning:
> ⚠️ "A [X]mm blind requires at least [Y]mm of depth inside your window frame. Please check your frame depth before continuing."
>
> ☑️ "I confirm my window frame depth is sufficient for this blind."

### Step 4: Range / Material
**Question:** "Choose your range"

Shows available ranges for the selected type + thickness. This maps directly to Shademaster price list sheets.

Example for Roller Blinds:
- Beach, Cedar, Aspen & Classic, Kleenscreen, Matrix, Natural, Sable, Sanctuary (Light Filtering), Sanctuary (Block Out), Smart Screen, Solar Cool, Solitaire, Uniview, Urban, Vogue

Each card: fabric/material swatch + range name + starting price + brief description

### Step 5: Colour
**Question:** "Choose your colour"

Colour swatches for the selected range. Source from Shademaster product info or client-provided swatches.

**Colour disclaimer (mandatory checkbox):**
> ⚠️ "Colours displayed on screen are representative only. Actual colours may vary due to screen calibration, natural lighting, and shade conditions. We recommend requesting a free sample swatch before ordering for large orders."
>
> ☑️ "I understand colours may vary slightly from what is shown on screen."

**Optional:** "Request a free swatch" button → captures name, email, address, selected colour. Creates a lead in admin.

### Step 6: Measurements
**Question:** "Enter your window measurements"

Input fields:
- Width (mm)
- Drop / Height (mm)
- Location label (e.g. "Kitchen", "Main Bedroom") — for tracking multiple blinds

**Validation rules based on Step 2 (mount type):**
- Inside mount: system finds the nearest price matrix size that is ≤ entered dimensions. Warns if dimensions exceed max available size.
- Outside mount: system rounds UP to next available price matrix size. Warns if dimensions are below minimum.

**Live price display:** As measurements are entered, price updates in real time by looking up the price matrix.

**Self-measurement disclaimer (mandatory checkbox):**
> ☑️ "I confirm I have measured my windows myself and accept responsibility for measurement accuracy. Incorrectly measured blinds cannot be returned or exchanged."
>
> 💡 "Prefer peace of mind? [Request a free professional measure] — we'll visit you in [service area] or arrange a virtual measuring session."

This is also a lead capture opportunity.

### Step 7: Add to Cart + Multi-Window Flow

After configuring a blind, customer sees a summary and three options:

1. **"Add same blind, different size"** → Returns to Step 6 ONLY. All other selections (type, mount, thickness, range, colour) carry over. This is the fast path for doing 10 windows with the same blind.

2. **"Add different blind"** → Returns to Step 1 for a completely new configuration.

3. **"View Cart"** → Proceed to cart/checkout.

Cart shows a table of all configured blinds:
| # | Location | Type | Range | Colour | Size (W×D) | Price |
|---|----------|------|-------|--------|------------|-------|
| 1 | Kitchen | Roller | Cedar | White | 1200×800 | R2,450 |
| 2 | Bedroom 1 | Roller | Cedar | White | 900×600 | R1,890 |
| 3 | Lounge | Aluminium 50mm | Plain | Silver | 1800×1200 | R3,200 |

### Step 8: Accessories & Upgrades (Upsell)
**Shown on cart page before checkout.**

Per-blind upgrade options based on blind type and size:
- Chain upgrade (plastic → metal → stainless steel)
- Valance / pelmet options
- Cassette with full fascia
- Roller tube upgrade (where applicable based on size)
- Side guides
- **Motorisation** (the big ticket upsell — Somfy, One Touch)

Smart filtering: only show accessories that apply to the selected blind type and size. Use Shademaster Mechanisms sheet to determine applicable upgrades.

Price difference shown clearly per upgrade. Running total updates live.

### Step 9: Save & Share Quote
**Before checkout, offer quote saving:**

- **"Email me this quote"** — captures email, sends formatted quote summary with unique restoration link. All configured blinds, sizes, colours, prices included. If room preview images were uploaded, include those too.
- **"Share this quote"** — generates shareable link or downloadable PDF. For the "let me check with my spouse" flow.

**Backend:** Every saved quote becomes a warm lead in admin panel. Automated follow-up emails:
- 24 hours: "Your quote is still saved and ready"
- 72 hours: "Still thinking about your blinds?"
- 7 days: Optional discount trigger (admin-configurable)

### Step 10: Delivery & Installation
**Question:** "How would you like to receive your blinds?"

**Option A: Self-install**
- Free delivery on orders over R[threshold]
- Below threshold: delivery fee R[x]
- Includes fitting instructions / video guide link

**Option B: Professional Installation (+R[x] per blind)**
- "Our experienced team will measure, fit, and ensure everything is perfect."
- Fixed price per blind — simple pricing
- Cross-sell hook: "Our installation team also specialises in custom kitchens, cupboards, and built-in furniture. Ask your installer about a free consultation."
- **Checkbox:** "I'm interested in hearing about other services (kitchens, cupboards, built-in furniture)" → flags order as cross-sell opportunity in admin.

### Step 11: Checkout
- Customer details (name, email, phone, delivery address)
- Paystack payment
- Order confirmation email with full specification summary
- Unique order tracking link

---

## 4. Room Preview Feature (Stretch Goal)

**Concept:** Customer uploads a photo of their room/window. They mark the window area. System overlays a visual representation of their selected blind (colour, texture, slat pattern) onto the photo.

**Requirements:**
- Must look professional and polished — if it looks cheap, it does more harm than good
- Canvas-based overlay with appropriate textures per blind type:
  - Roller = solid colour fill with slight fabric texture
  - Venetian = horizontal stripes with correct slat spacing and colour
  - Vertical = vertical stripes with correct width
- Appropriate opacity/blend to look realistic against the room photo
- Shareable — customer can download/share the preview image
- Business value: uploaded photos give the installer intel on the customer's home before arriving

**Decision:** Build core shop first. Prototype preview feature at end. Ship only if quality bar is met.

---

## 5. Admin Panel

### 5.1 Price Import Engine (CRITICAL)

**Tier 1: Shademaster Auto-Import**
- Upload XLS file → system auto-detects Shademaster format
- Parses all sheets automatically (width × drop grid detection)
- Preview screen: "Found 6 sheets, 18,432 prices. 847 changed, 12 new sizes."
- Confirm → prices update instantly with markup applied
- Target: 2-minute process, no manual mapping

**Tier 2: Generic Supplier Import (Future)**
- For new suppliers with different Excel layouts
- Guided column mapper: admin selects which row = widths, which column = drops, where = prices
- Save mapping as template per supplier
- Future uploads from same supplier use saved template automatically

**Re-import handling:**
- "Replace all" mode (wipe and re-seed)
- "Update changed" mode (only update prices that differ)
- Price change history log

### 5.2 Markup Management
- Global markup percentage (e.g. 40% on all supplier prices)
- Per-category override (e.g. 50% on rollers, 35% on aluminium)
- Per-range override (premium ranges at higher margin)
- Installation fee configuration (flat per blind or percentage)
- Customer never sees supplier prices

### 5.3 Product Management
- CRUD for categories, types, ranges
- Image management (lifestyle photos, swatches, detail shots)
- Colour management per range (name, hex, swatch image)
- Extras/accessories management with pricing rules
- Active/inactive toggle (hide without deleting)

### 5.4 Order Management
- Order list with status pipeline: New → Confirmed → Ordered from Supplier → Shipped → Delivered → Installed
- Order detail with full blind specifications per item
- **Generate Shademaster order form** (PDF) from order data for supplier ordering
- Profit view: supplier cost vs customer price per order
- Customer communication (status update emails)
- Cross-sell lead flag (from installation interest checkbox)

### 5.5 Quote / Lead Management
- Saved quotes list with "days since saved" and total value
- Conversion tracking (quote → purchase)
- Swatch request leads
- Professional measure request leads
- Automated follow-up email triggers (configurable intervals)
- Cross-sell interest flags

---

## 6. Supplier Data Summary

### Shademaster Product Range

| Category | Types / Ranges | Price Sheets | Format |
|----------|---------------|-------------|--------|
| Aluminium Venetian | 25mm (2 ranges), 50mm (3 ranges) | 5 sheets | Width × Drop matrix |
| Wood/Bamboo/PVC Venetian | 35mm Wood, 50mm Wood & Sherwood, Bamboo, Polywood, Dreamwood (2), PVC | 7 sheets | Width × Drop matrix |
| 50mm Swiftwood Venetian | 1 range | 1 sheet | Width × Drop matrix |
| 63mm Privacy Wood Venetian | 1 range | 1 sheet | Width × Drop matrix |
| Roller Blinds | 16 fabric ranges + Extras + Mechanisms + Motorisation | 20 sheets | Width × Drop matrix + width-based extras |
| Vertical Blinds | 3 ranges × 2 sizes (127mm, 90mm) | 6 sheets | Width (slats) × Drop matrix |

**Total:** ~40 price sheets, ~15,000–20,000 individual price points
**All prices:** Supplier cost in ZAR (markup applied by platform)
**Update frequency:** ~1× per year for blinds, more frequent for decking

### Key Format Notes
- All sheets follow width-across-top, drop-down-side, price-in-grid pattern
- Column 0 sometimes has "D R O P" text vertically (cosmetic, ignore in parser)
- Some sheets have VALANCE pricing as final row
- Roller blind Extras sheet has width-based pricing for accessories
- Roller blind Mechanisms sheet maps width × drop to required tube diameter
- Roller blind Motorisation sheet has brand/model/tube-size pricing
- Vertical blind 90mm sheets are very large (907 rows × 94 cols)
- Vertical blinds use slat count alongside width in cm

---

## 7. Database Schema (High-Level)

```
blind_categories        → Top-level (Roller, Venetian Aluminium, etc.)
  └─ blind_types        → Specific types (25mm Aluminium, 50mm Wood, etc.)
      └─ blind_ranges   → Material/colour ranges (Beach, Cedar, Plain & Designer, etc.)
          └─ price_matrices → Width × Drop × Price lookup (the big table)

blind_extras            → Accessories with pricing rules
motorisation_options    → Roller blind motors (brand, model, size-based pricing)
markup_config           → Global, per-category, per-range markup percentages

orders                  → Customer orders
  └─ order_items        → Individual blind configurations per order

saved_quotes            → Abandoned cart / quote recovery
swatch_requests         → Free swatch lead capture
measure_requests        → Professional measure lead capture
```

---

## 8. Technical Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (Yoros template), Tailwind CSS, React |
| Database | Supabase (PostgreSQL) with RLS |
| Payments | Paystack (ZAR) |
| Storage | Supabase Storage / Bunny.net CDN |
| XLS Parsing | SheetJS (xlsx) |
| Email | Resend |
| Hosting | Vercel |
| Auth | Supabase Auth (admin only) |
| Room Preview | Canvas API (stretch goal) |

---

## 9. Pages

### Public Pages
- **Homepage** — Hero + lifestyle imagery + "Start configuring your blinds" CTA + trust signals
- **Products / Browse** — Visual category grid → ranges → colours (3-level drill-down that makes 5 products feel like a full shop)
- **Configurator** — The step-by-step purchase flow (Steps 1–11)
- **About** — Company story, experience, service area
- **Contact** — Form + phone + email + "Request a free measure" CTA
- **FAQ** — Measurement guides, colour disclaimers, installation info, returns policy
- **Gallery** — Installed blinds showcase (feeds from admin)

### Admin Pages
- Dashboard (orders summary, revenue, pending quotes)
- Products (categories, types, ranges, colours)
- Price Management (import, markup config, price history)
- Orders (pipeline, detail, supplier order generation)
- Quotes & Leads (saved quotes, swatch requests, measure requests)
- Settings (delivery fees, installation pricing, email templates)

---

## 10. Build Phases

| Phase | Deliverables | Est. Days |
|-------|-------------|-----------|
| 1 | Database schema + XLS import engine + seed all supplier data | 2–3 |
| 2 | Price lookup API + markup engine + admin price management | 1–2 |
| 3 | Customer configurator (Steps 1–7) with live pricing | 3–4 |
| 4 | Cart, accessories upsell, quote save/share, checkout + Paystack | 2–3 |
| 5 | Admin panel (products, orders, leads, supplier order PDF) | 2–3 |
| 6 | Public pages, branding, SEO, imagery, polish | 1–2 |
| 7 | Room preview feature (stretch goal — ship only if quality bar met) | 1–2 |

**Total: 12–19 working days**

---

## 11. Open Questions for Client

1. What markup percentage on supplier prices? Flat or variable by product type?
2. Does he offer installation services? What service area?
3. Installation pricing — flat per blind or other model?
4. Delivery options and pricing? Free delivery threshold?
5. Does Shademaster provide product/swatch photography?
6. Does he have lifestyle / installation photos for the gallery?
7. What happens with between-grid measurements? (Recommendation: round up for outside mount, round down for inside mount)
8. Does he want a "Request a Quote" path for very large orders (whole-house)?
9. Branding preferences beyond the logo brief? Any brands he admires?
10. Service area for free professional measuring?
11. Does he currently have a business name / domain for the blinds business, or is "Blindly" confirmed?

---

## 12. Logo Brief

**Brand Name:** Blindly

**Concept:** "See-through window" — transparency, light, the essence of what blinds do (control light). The logo should evoke looking through blinds or a window treatment.

**Logo Mark Requirements:**
- SVG format, background shines through (transparency is literal and conceptual)
- Incorporates blind slat motif — horizontal lines with gaps, light passing through
- Could work with the letter "B" formed by or incorporating slat lines
- Clean, geometric, modern
- Must NOT resemble Microsoft Windows logo (no 4-pane grid)
- Works at all sizes: favicon (16px) to hero banner
- Single colour version must work (for watermarks, loading states)

**Avoid:**
- Literal window frame imagery
- Curtain/drape motifs (this is blinds, not curtains)
- Overly decorative or ornate design
- Generic house/home icons

**Explore:**
- Horizontal line patterns with strategic gaps (light through slats)
- Abstract "B" made of parallel lines
- Window silhouette where the "glass" is transparent/negative space
- Overlapping geometric shapes suggesting layered slats
- Light ray / sunbeam passing through linear elements
