# BLINDLY — Technical Design Document

> **Version:** 1.0
> **Date:** 19 February 2026
> **Companion to:** PROJECT_BRIEF.md (business requirements & UX flow)

---

## 1. Supplier Data Analysis

### 1.1 Shademaster File Inventory

| File | Sheets | Category |
|------|--------|----------|
| Shademaster Aluminium Venetian Blind Price List | 5 sheets: 25mm Plain & Designer, 25mm Licorice & Mushroom, 50mm Plain & Designer, 50mm Brushed/Linear/Perforated, 50mm Décor | Aluminium Venetian |
| Shademaster Wood, Sherwood, Bamboo, Dreamwood, Polywood and PVC Venetian Blind Price List | 7 sheets: 35mm Wood, 50mm Wood & Sherwood, 50mm Bamboo, 50mm Polywood, 50mm Dreamwood Nougat, 50mm Dreamwood SM, 50mm PVC | Wood/Bamboo/PVC Venetian |
| Shademaster 50mm Swiftwood Venetian Blind Price List | 1 sheet: Swiftwood | Swiftwood Venetian |
| Shademaster 63mm Privacy Wood Venetian Blind Price List | 1 sheet: A | Privacy Wood Venetian |
| Shademaster Roller Blind Price List | 20 sheets: Extras, Mechanisms and tubes, Motorisation, Beach, Cedar, Aspen & Classic, Kleenscreen, Matrix, Natural, Sable, Sanctuary LF, Sanctuary BO, Smart Screen, Solar Cool, Solitaire, Uniview (internal), Uniview (external), Uniview external blind systems, Urban, Vogue | Roller Blinds |
| Shademaster Vertical Blind Price List | 6 sheets: Aspen127, Beach127, Solitaire127, Aspen90, Beach90, Solitaire90 | Vertical Blinds |

**Total: 6 XLS files, ~40 price sheets, ~15,000–20,000 individual price points**

### 1.2 Universal Price Matrix Format

All standard price sheets follow this structure:

```
Row 0:    [blank]  [blank]  "TITLE TEXT..."  [blank]  [blank]  ...
Row 1:    [blank]  [blank]  [blank]          [blank]  [blank]  ...
Row 2:    [blank]  [blank]  60.0    70.0     80.0     90.0     100.0  ...  (WIDTH in cm)
Row 3:    [blank]  60.0     313.74  341.80   380.83   409.06   437.29 ...  (PRICES)
Row 4:    [blank]  70.0     330.33  361.09   402.94   433.87   464.79 ...
Row 5:    [blank]  80.0     344.54  377.59   421.85   455.08   488.31 ...
...       ...      ...      ...     ...      ...      ...      ...
          (DROP)            (PRICE MATRIX — supplier cost in ZAR)
```

**Key observations:**
- Column 0: Sometimes contains "D R O P" text spelled vertically (rows 9–17 approximately) — cosmetic, must be ignored by parser
- Column 1: Drop values in cm
- Row 2 (or 3 for some sheets): Width values in cm
- Grid cells: Prices as float values (ZAR, supplier cost including supplier markup formula)
- Prices are already calculated — these are NOT raw multiplier formulas
- Some 50mm sheets include a "VALANCE" row at the bottom with width-based pricing

### 1.3 Format Variations

#### Roller Blinds — Extras Sheet
```
Row 2:    WIDTH (cm):     60    80    100   120   140   ...   400
Row 3:    Stainless ball chain   170   170   170   170   ...   170   (FIXED per width)
Row 4:    Metal ball chain       70    70    70    70    ...   70
Row 5:    Wood valance - 106mm   259   322   384   447   ...   1551  (WIDTH-DEPENDENT)
Row 6:    Cassette - full fascia 442   566   690   815   ...   (max 240cm)
Row 7:    Cassette face fix - each  12  12   12    ...              (FIXED per unit)
Row 8:    Side guides            384   384   384   384   ...   384   (FIXED)
Row 9:    Duo and multi link     120   131   142   ...              (WIDTH-DEPENDENT, max 200cm)
Row 10:   40mm roller upgrade    77    88    99    ...              (WIDTH-DEPENDENT, max 200cm)
Row 11:   45mm roller upgrade    172   187   201   ...              (WIDTH-DEPENDENT)
Row 12:   45mm HD roller upgrade 410   504   597   ...              (WIDTH-DEPENDENT)
```

**Parser implication:** Extras are NOT a standard matrix. Each row is an independent accessory with its own width-based or fixed pricing. Some have max width limits (empty cells after a certain width).

#### Roller Blinds — Mechanisms Sheet
```
Row 2:    WIDTH (cm):     60    80    100   120   140   ...   400
Row 3:    Drop 60:        32    32    32    32    32    ...   55+EL
Row 4:    Drop 80:        32    32    32    32    32    ...   55+EL
...
```

**Parser implication:** Not prices — this is a lookup table mapping width × drop to required tube diameter (32mm, 40mm, 45mm, 45HD, 55+EL). Used to determine which mechanism is needed and therefore which roller upgrade extras apply.

#### Roller Blinds — Motorisation Sheet
```
Row 2:    WIDTH (cm):           80    100   120   140   ...   350
Row 3:    Tube cost (55mm):     289   362   434   506   ...   1267
Row 6:    One Touch 1.8Nm Li:   3162  3174  3185  3196  ...
Row 10:   Somfy Optuo 40 42mm:  4450  4491  4531  4571  ...
Row 12:   Somfy Sonesse 40 42:  7069  7110  7150  7190  ...
```

**Parser implication:** Multiple motor brands/models, each with width-based pricing. Some motors only work with certain tube sizes. This needs to cross-reference the Mechanisms sheet.

#### Vertical Blinds
```
Row 2:    Width    56    67    78    89    100   111   ...   (cm — non-uniform increments)
Row 3:    Slats    5     6     7     8     9     10    ...   (slat count per width)
Row 4:    Drop 60  693   741   789   838   886   934   ...   (PRICES)
```

**Parser implication:** Width columns are NOT uniform 10cm increments — they follow 11cm steps (matching 127mm slat width). Row 3 provides slat count mapping. 90mm variant sheets are very large (907 rows × 94 cols) — likely extended sizing data with many more width/drop combinations.

---

## 2. Database Schema

### 2.1 Product Structure

```sql
-- Top-level blind categories
CREATE TABLE blind_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                          -- "Roller Blinds", "Aluminium Venetian", etc.
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Specific blind types within a category
CREATE TABLE blind_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES blind_categories(id),
  name TEXT NOT NULL,                          -- "25mm Aluminium", "50mm Wood", "127mm Vertical"
  slug TEXT UNIQUE NOT NULL,
  slat_size_mm INTEGER,                        -- 25, 50, 63, 90, 127, NULL for rollers
  material TEXT,                                -- "aluminium", "wood", "bamboo", "pvc", "fabric"
  description TEXT,
  features JSONB,                              -- {"light_filtering": true, "block_out": false, ...}
  min_width_cm INTEGER NOT NULL,
  max_width_cm INTEGER NOT NULL,
  min_drop_cm INTEGER NOT NULL,
  max_drop_cm INTEGER NOT NULL,
  min_frame_depth_mm INTEGER,                  -- For inside mount warning (Step 3)
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Colour/material ranges within a type (maps to individual price sheets)
CREATE TABLE blind_ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blind_type_id UUID REFERENCES blind_types(id),
  name TEXT NOT NULL,                          -- "Plain & Designer", "Beach", "Cedar"
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  colour_options JSONB,                        -- [{"name": "White", "hex": "#FFFFFF", "swatch_url": "..."}, ...]
  swatch_image_url TEXT,
  lifestyle_image_url TEXT,
  starting_price_cents INTEGER,                -- Cached lowest price for "starting from" display
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Width × Drop price lookup (THE BIG TABLE)
CREATE TABLE price_matrices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blind_range_id UUID REFERENCES blind_ranges(id),
  width_cm NUMERIC(6,1) NOT NULL,              -- 60.0, 70.0, ... (NUMERIC for 0.5 steps if needed)
  drop_cm NUMERIC(6,1) NOT NULL,               -- 60.0, 70.0, ...
  supplier_price_cents INTEGER NOT NULL,        -- Price in cents (ZAR) from Shademaster
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(blind_range_id, width_cm, drop_cm)
);

-- Index for fast price lookups
CREATE INDEX idx_price_matrix_lookup 
  ON price_matrices(blind_range_id, width_cm, drop_cm);

-- Vertical blind slat count mapping
CREATE TABLE vertical_slat_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blind_type_id UUID REFERENCES blind_types(id),
  width_cm NUMERIC(6,1) NOT NULL,
  slat_count INTEGER NOT NULL,
  
  UNIQUE(blind_type_id, width_cm)
);
```

### 2.2 Accessories & Extras

```sql
-- Accessories / add-ons
CREATE TABLE blind_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                          -- "Stainless steel ball chain", "Wood valance 106mm"
  description TEXT,
  applies_to_categories UUID[],                -- Which blind categories this extra applies to
  applies_to_types UUID[],                     -- More specific: which types (NULL = all in category)
  pricing_type TEXT NOT NULL,                  -- "fixed", "width_based", "per_unit"
  fixed_price_cents INTEGER,                   -- For "fixed" type
  is_upgrade BOOLEAN DEFAULT false,            -- true = replaces standard component
  replaces_extra_id UUID REFERENCES blind_extras(id),  -- What it upgrades from
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Width-based extra pricing (for "width_based" type)
CREATE TABLE extra_price_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extra_id UUID REFERENCES blind_extras(id),
  width_cm NUMERIC(6,1) NOT NULL,
  price_cents INTEGER NOT NULL,
  
  UNIQUE(extra_id, width_cm)
);

-- Motorisation options (separate — complex enough to warrant own table)
CREATE TABLE motorisation_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,                         -- "Somfy", "One Touch"
  model TEXT NOT NULL,                         -- "Optuo 40 3/30", "Sonesse 40 3/30"
  tube_size_mm INTEGER,                        -- Required tube diameter
  description TEXT,
  is_rechargeable BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Motorisation pricing (width-based)
CREATE TABLE motorisation_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motor_id UUID REFERENCES motorisation_options(id),
  width_cm NUMERIC(6,1) NOT NULL,
  price_cents INTEGER NOT NULL,
  
  UNIQUE(motor_id, width_cm)
);

-- Mechanism lookup (tube size by width × drop)
CREATE TABLE mechanism_lookup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  width_cm NUMERIC(6,1) NOT NULL,
  drop_cm NUMERIC(6,1) NOT NULL,
  tube_size TEXT NOT NULL,                     -- "32", "40", "45", "45HD", "55 + EL"
  
  UNIQUE(width_cm, drop_cm)
);
```

### 2.3 Markup & Pricing Configuration

```sql
CREATE TABLE markup_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type TEXT NOT NULL,                    -- "global", "category", "type", "range"
  scope_id UUID,                               -- NULL for global, FK for others
  markup_percent NUMERIC(5,2) NOT NULL,        -- e.g. 40.00 = 40%
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pricing_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed with defaults
INSERT INTO pricing_settings (key, value, description) VALUES
  ('global_markup_percent', '40', 'Default markup on all supplier prices'),
  ('installation_fee_cents', '50000', 'Per-blind installation fee in cents (R500)'),
  ('free_delivery_threshold_cents', '500000', 'Free delivery on orders above this (R5,000)'),
  ('delivery_fee_cents', '50000', 'Standard delivery fee (R500)'),
  ('vat_percent', '15', 'SA VAT rate'),
  ('currency', 'ZAR', 'Default currency');
```

### 2.4 Orders

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,           -- Human-readable: BL-2026-0001
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address JSONB,
  delivery_type TEXT NOT NULL,                 -- "self_install", "professional_install"
  
  -- Pricing
  subtotal_cents INTEGER NOT NULL,
  delivery_fee_cents INTEGER DEFAULT 0,
  installation_fee_cents INTEGER DEFAULT 0,
  vat_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  
  -- Payment
  paystack_reference TEXT,
  payment_status TEXT DEFAULT 'pending',       -- "pending", "paid", "failed", "refunded"
  
  -- Pipeline
  order_status TEXT DEFAULT 'new',             -- "new", "confirmed", "ordered_from_supplier", "shipped", "delivered", "installed"
  
  -- Cross-sell
  interested_in_other_services BOOLEAN DEFAULT false,
  
  -- Notes
  admin_notes TEXT,
  customer_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  blind_range_id UUID REFERENCES blind_ranges(id),
  
  -- Configuration
  location_label TEXT,                         -- "Kitchen", "Main Bedroom"
  mount_type TEXT NOT NULL,                    -- "inside", "outside"
  quantity INTEGER DEFAULT 1,
  width_mm INTEGER NOT NULL,                   -- Customer's entered measurement
  drop_mm INTEGER NOT NULL,
  colour TEXT NOT NULL,
  control_side TEXT,                            -- "left", "right"
  stacking TEXT,                               -- "left", "right", "centre_stack", "centre_open"
  
  -- Matched grid size
  matched_width_cm NUMERIC(6,1) NOT NULL,      -- Actual grid point used for pricing
  matched_drop_cm NUMERIC(6,1) NOT NULL,
  
  -- Pricing breakdown
  supplier_price_cents INTEGER NOT NULL,
  markup_cents INTEGER NOT NULL,
  extras_cents INTEGER DEFAULT 0,
  line_total_cents INTEGER NOT NULL,
  
  -- Selected extras
  selected_extras JSONB,                       -- [{"extra_id": "...", "name": "...", "price_cents": ...}, ...]
  
  -- Room preview
  room_preview_image_url TEXT,                 -- If customer uploaded a room photo
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.5 Quotes & Leads

```sql
CREATE TABLE saved_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_token TEXT UNIQUE NOT NULL,            -- For shareable link: /quote/[token]
  customer_email TEXT,
  customer_name TEXT,
  cart_data JSONB NOT NULL,                    -- Full cart snapshot
  total_cents INTEGER NOT NULL,
  
  -- Follow-up tracking
  email_sent_24h BOOLEAN DEFAULT false,
  email_sent_72h BOOLEAN DEFAULT false,
  email_sent_7d BOOLEAN DEFAULT false,
  converted_to_order_id UUID REFERENCES orders(id),
  
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE swatch_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  delivery_address JSONB NOT NULL,
  blind_range_id UUID REFERENCES blind_ranges(id),
  colour TEXT NOT NULL,
  status TEXT DEFAULT 'new',                   -- "new", "sent", "delivered"
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE measure_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  address JSONB,
  preferred_method TEXT,                        -- "in_person", "virtual"
  notes TEXT,
  status TEXT DEFAULT 'new',                   -- "new", "scheduled", "completed"
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.6 Price Import Tracking

```sql
CREATE TABLE price_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  supplier TEXT NOT NULL,                       -- "shademaster" for now
  sheets_processed INTEGER,
  prices_created INTEGER,
  prices_updated INTEGER,
  prices_unchanged INTEGER,
  import_mode TEXT,                             -- "replace_all", "update_changed"
  imported_by UUID,                            -- Admin user
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 3. Price Lookup Engine

### 3.1 Core Algorithm

```
FUNCTION get_customer_price(blind_range_id, width_mm, drop_mm, mount_type):

  1. Convert mm to cm: width_cm = width_mm / 10, drop_cm = drop_mm / 10
  
  2. Get available grid points for this range:
     SELECT DISTINCT width_cm FROM price_matrices WHERE blind_range_id = $1 ORDER BY width_cm
     SELECT DISTINCT drop_cm FROM price_matrices WHERE blind_range_id = $1 ORDER BY drop_cm
  
  3. Find matched grid point based on mount type:
     IF mount_type = "outside":
       matched_width = FIRST width_cm >= customer_width  (round UP)
       matched_drop = FIRST drop_cm >= customer_drop     (round UP)
     IF mount_type = "inside":
       matched_width = LAST width_cm <= customer_width   (round DOWN — must fit)
       matched_drop = LAST drop_cm <= customer_drop
  
  4. Validate: if no matching grid point exists, return error
     (customer's size exceeds available range)
  
  5. Lookup supplier price:
     SELECT supplier_price_cents FROM price_matrices
     WHERE blind_range_id = $1 AND width_cm = matched_width AND drop_cm = matched_drop
  
  6. Apply markup:
     markup = get_markup(blind_range_id)  -- checks range → type → category → global cascade
     customer_price = supplier_price × (1 + markup / 100)
  
  7. Return:
     { supplier_price_cents, markup_percent, customer_price_cents,
       matched_width_cm, matched_drop_cm }
```

### 3.2 Markup Cascade

```
FUNCTION get_markup(blind_range_id):
  
  1. Check range-specific markup:
     SELECT markup_percent FROM markup_config
     WHERE scope_type = 'range' AND scope_id = blind_range_id AND is_active = true
     → IF found, RETURN this
  
  2. Get the type for this range, check type-specific:
     SELECT markup_percent FROM markup_config
     WHERE scope_type = 'type' AND scope_id = type_id AND is_active = true
     → IF found, RETURN this
  
  3. Get the category, check category-specific:
     SELECT markup_percent FROM markup_config
     WHERE scope_type = 'category' AND scope_id = category_id AND is_active = true
     → IF found, RETURN this
  
  4. Fall back to global:
     SELECT value FROM pricing_settings WHERE key = 'global_markup_percent'
     → RETURN this
```

### 3.3 Extras Price Lookup

```
FUNCTION get_extra_price(extra_id, width_cm):
  
  1. Get extra definition:
     SELECT pricing_type, fixed_price_cents FROM blind_extras WHERE id = extra_id
  
  2. IF pricing_type = "fixed":
     RETURN fixed_price_cents
  
  3. IF pricing_type = "width_based":
     Find nearest width_cm >= customer width from extra_price_points
     RETURN that price_cents
  
  4. IF pricing_type = "per_unit":
     RETURN fixed_price_cents (multiply by quantity in order_item)
```

---

## 4. XLS Import Engine

### 4.1 Shademaster Parser Architecture

```
FUNCTION parse_shademaster_file(file_buffer):
  
  1. Read workbook using SheetJS (xlsx library)
  
  2. For each sheet:
     a. Read sheet name → use as range identifier
     b. Scan rows to find header row:
        - Look for a row where multiple cells contain sequential numbers (60, 70, 80...)
        - This is the WIDTH header row
     c. For each row below header:
        - Column 1 (or first numeric column) = DROP value
        - Skip rows where col 1 is text (e.g. "D", "R", "O", "P") or "VALANCE"
        - Remaining columns = PRICE values matched to WIDTH headers
     d. Handle VALANCE row separately (if present): flag as extra pricing
  
  3. Return structured data:
     {
       filename: "...",
       sheets: [
         {
           sheet_name: "25mm Plain & Designer",
           detected_category: "Aluminium Venetian",
           widths: [60, 70, 80, ...],
           drops: [60, 70, 80, ...],
           prices: [[313.74, 341.80, ...], [330.33, 361.09, ...], ...],
           valance_prices: [83.52, 96.60, ...] or null,
           row_count: 21,
           col_count: 25,
           total_prices: 525
         },
         ...
       ],
       summary: { total_sheets: 5, total_prices: 2450 }
     }
```

### 4.2 Special Parsers

```
FUNCTION parse_roller_extras(sheet):
  - Each row is a distinct accessory
  - Row label = accessory name
  - Cells = width-based prices (may have gaps = max width limit)
  - Return: [{ name, widths: [60,80,...], prices: [170,170,...], max_width }]

FUNCTION parse_mechanisms(sheet):
  - Width × Drop → Tube size text
  - Return: [{ width, drop, tube_size }]

FUNCTION parse_motorisation(sheet):
  - Multiple motor options per sheet
  - Group by motor name/brand
  - Width-based pricing per motor
  - Return: [{ brand, model, tube_size, widths: [...], prices: [...] }]

FUNCTION parse_vertical(sheet):
  - Has both width_cm AND slat_count in header rows
  - Non-uniform width increments (11cm steps for 127mm, ~7.5cm for 90mm)
  - Return standard price matrix + slat_count mapping
```

### 4.3 Import UI Flow

```
Admin uploads XLS file
  ↓
System reads file, runs parser
  ↓
Preview screen shows:
  ┌──────────────────────────────────────────────┐
  │  Import Preview                              │
  │                                              │
  │  File: Shademaster_Roller_Blind_2025.xls     │
  │  Sheets found: 20                            │
  │                                              │
  │  ☑ Beach        → Roller > Beach      (187 prices)   │
  │  ☑ Cedar        → Roller > Cedar      (190 prices)   │
  │  ☑ Extras       → Roller Extras       (12 items)     │
  │  ☑ Mechanisms   → Mechanism Lookup    (324 entries)  │
  │  ☑ Motorisation → Motor Options       (48 entries)   │
  │  ...                                         │
  │                                              │
  │  Total: 3,842 prices                         │
  │  New: 3,842 | Changed: 0 | Unchanged: 0     │
  │                                              │
  │  [Import Mode: ◉ Replace All  ○ Update Only] │
  │                                              │
  │  [Cancel]                    [Confirm Import] │
  └──────────────────────────────────────────────┘
```

### 4.4 Sheet-to-Range Mapping

On first import, admin maps each sheet to a category → type → range. System saves this mapping. On subsequent imports of the same file format, mapping is applied automatically.

```sql
CREATE TABLE import_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier TEXT NOT NULL,                      -- "shademaster"
  sheet_name TEXT NOT NULL,                    -- "Beach", "25mm Plain & Designer"
  maps_to_range_id UUID REFERENCES blind_ranges(id),
  parser_type TEXT DEFAULT 'standard_matrix',  -- "standard_matrix", "extras", "mechanisms", "motorisation", "vertical"
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(supplier, sheet_name)
);
```

---

## 5. API Routes

```
-- Public (no auth)
GET  /api/blinds/categories                    → List active categories
GET  /api/blinds/categories/[slug]/types       → Types within category
GET  /api/blinds/types/[slug]/ranges           → Ranges within type
GET  /api/blinds/ranges/[slug]/colours         → Colours for range
POST /api/blinds/price                         → Calculate price (body: {range_id, width_mm, drop_mm, mount_type})
POST /api/blinds/extras                        → Get applicable extras + prices (body: {range_id, width_cm})
POST /api/orders                               → Create order + initiate Paystack
POST /api/orders/verify                        → Verify Paystack payment
POST /api/quotes/save                          → Save cart as quote
GET  /api/quotes/[token]                       → Restore saved quote
POST /api/swatch-request                       → Request free swatch
POST /api/measure-request                      → Request professional measure

-- Admin (auth required)
POST /api/admin/import                         → Upload + parse XLS file
POST /api/admin/import/confirm                 → Commit parsed import to DB
GET  /api/admin/orders                         → List orders (filterable)
GET  /api/admin/orders/[id]                    → Order detail
PATCH /api/admin/orders/[id]/status            → Update order status
GET  /api/admin/orders/[id]/supplier-pdf       → Generate Shademaster order form PDF
GET  /api/admin/quotes                         → List saved quotes / leads
GET  /api/admin/markup                         → Get markup config
PUT  /api/admin/markup                         → Update markup config
CRUD /api/admin/categories                     → Category management
CRUD /api/admin/types                          → Type management
CRUD /api/admin/ranges                         → Range management
CRUD /api/admin/extras                         → Extras management
```

---

## 6. Route Structure

```
-- Public
/                                → Homepage
/products                        → Category browse (visual grid)
/products/[category-slug]        → Types within category
/products/[category-slug]/[type-slug]  → Ranges within type
/configure                       → Configurator entry (Step 1)
/configure/[step]                → Configurator steps (state in URL or session)
/cart                            → Cart with upsell
/checkout                        → Payment flow
/order/[id]                      → Order confirmation / tracking
/quote/[token]                   → Restore saved quote
/about                           → About page
/contact                         → Contact + measure request
/faq                             → FAQ + measurement guides
/gallery                         → Installation showcase

-- Admin
/admin                           → Dashboard
/admin/products                  → Product management
/admin/products/import           → XLS import
/admin/pricing                   → Markup configuration
/admin/orders                    → Order pipeline
/admin/orders/[id]               → Order detail
/admin/quotes                    → Saved quotes & leads
/admin/swatches                  → Swatch requests
/admin/measures                  → Measure requests
/admin/settings                  → General settings
```

---

## 7. Supplier Order PDF Generation

When the admin clicks "Generate Supplier Order" on an order, the system creates a PDF matching the Shademaster Order Form layout:

```
Fields populated from order data:
- CUSTOMER: [client business name]
- ORDER NO: [order_number]
- ORDER DATE: [created_at]

Per order_item row:
- NO: [line number]
- LOCATION: [location_label]
- QTY: [quantity]
- WIDTH: [matched_width_cm × 10] mm
- DROP: [matched_drop_cm × 10] mm
- CONTROLS L/R: [control_side]
- STACKING: [stacking]
- BLIND TYPE: [blind_type name + slat_size]
- RANGE: [blind_range name]
- COLOUR: [colour]
```

This saves the client from manually filling in the Shademaster order form for every order.

---

## 8. Performance Considerations

### Price Matrix Table Size
- ~20,000 rows for current Shademaster data
- With composite index on (blind_range_id, width_cm, drop_cm), lookups will be < 1ms
- Even at 10× growth (200k rows), Supabase handles this trivially

### Real-time Price Calculation
- Price lookup is a single indexed SELECT — sub-millisecond
- Markup cascade is 3-4 queries max (cacheable in memory)
- Extras lookup is similarly fast
- Total configurator response time target: < 100ms

### Image Strategy
- Lifestyle photos: Bunny.net CDN (or Supabase Storage)
- Colour swatches: Small PNGs, can be inline or CDN
- Room preview uploads: Supabase Storage with size limit (5MB)
- All images lazy-loaded, WebP format where supported

---

## 9. Build Sessions

### Session 1: Foundation (Day 1-2)
- Supabase project setup
- Run all CREATE TABLE migrations
- Build Shademaster XLS parser (all 4 parser types)
- Import all 6 price list files
- Verify data integrity (spot-check prices against source)

### Session 2: Pricing Engine (Day 3)
- Price lookup function with mount type logic
- Markup cascade system
- Extras price lookup
- Motorisation cross-reference with mechanisms
- Admin markup configuration UI

### Session 3: Configurator Part 1 (Day 4-5)
- Steps 1-5: Type → Mount → Thickness → Range → Colour
- Component architecture (wizard state management)
- Validation rules per step
- Disclaimer checkboxes
- Responsive design

### Session 4: Configurator Part 2 (Day 6-7)
- Step 6: Measurements with live pricing
- Step 7: Multi-window flow (add same / add different)
- Cart management
- Step 8: Accessories upsell

### Session 5: Checkout & Orders (Day 8-9)
- Quote save / share / restore
- Paystack integration
- Order creation
- Order confirmation email
- Admin order list + detail views
- Supplier PDF generation

### Session 6: Admin & Import UI (Day 10-11)
- XLS upload + preview + confirm UI
- Sheet-to-range mapping interface
- Product CRUD (categories, types, ranges, colours)
- Quote/lead management
- Swatch + measure request management

### Session 7: Public Pages & Polish (Day 12-13)
- Homepage with hero + lifestyle imagery
- Product browse pages (3-level drill-down)
- About, Contact, FAQ, Gallery
- SEO (meta, schema, sitemap)
- Mobile responsiveness pass
- Performance audit

### Session 8: Room Preview (Day 14 — Stretch Goal)
- Photo upload + window area selection
- Blind texture overlay rendering
- Download/share preview
- Quality assessment — ship or cut
