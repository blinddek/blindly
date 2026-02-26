# Build 03 — Blinds Product Schema

> **Type:** Migration
> **Estimated Time:** 30 min
> **Dependencies:** Build 02 (foundation tables)
> **Context Files:** BUILD_INDEX.md (Migration 002 SQL), TECHNICAL_DESIGN.md §1 (Supplier Data Analysis)

---

## Objective

Create the product catalogue schema: the Category → Type → Range → Price Matrix hierarchy that maps to Shademaster's product structure. This is the core data model that the entire configurator and pricing engine depend on.

---

## Context — Product Hierarchy

```
blind_categories (4)
  └── blind_types (many per category)
        └── blind_ranges (many per type — each maps to 1 Shademaster price sheet)
              └── price_matrices (thousands — width × drop → supplier price)
```

**Example:**
```
Roller Blinds (category)
  └── Roller (type — no slat size)
        ├── Beach (range → 1 price sheet)
        ├── Cedar (range → 1 price sheet)
        ├── Sanctuary LF (range → 1 price sheet)
        ├── Sanctuary BO (range → 1 price sheet)
        └── ... (16 more ranges)

Aluminium Venetian (category)
  └── 25mm Aluminium (type — slat_size_mm: 25)
  │     ├── Plain & Designer (range)
  │     └── Licorice & Mushroom (range)
  └── 50mm Aluminium (type — slat_size_mm: 50)
        ├── Plain & Designer (range)
        ├── Brushed/Linear/Perforated (range)
        └── Décor (range)
```

**Shademaster inventory:** 6 XLS files, ~40 price sheets, ~15,000–20,000 individual price points.

---

## Tasks

### 1. Create Migration File

Create `supabase/migrations/002_blinds_products.sql` with the **exact SQL** from BUILD_INDEX.md → Migration 002.

This includes:
- `blind_categories` — top-level: Roller, Aluminium Venetian, Wood/Bamboo/PVC Venetian, Vertical
- `blind_types` — within category: includes slat_size_mm, material, min/max dimensions, frame depth
- `blind_ranges` — within type: includes colour_options JSONB, swatch images, starting price cache
- `price_matrices` — the big table: blind_range_id + width_cm + drop_cm → supplier_price_cents
- `vertical_slat_mapping` — maps width_cm → slat count for vertical blinds

### 2. Run Migration

```bash
supabase db push
```

### 3. Regenerate TypeScript Types

```bash
supabase gen types typescript --project-id <PROJECT_ID> > src/types/database.ts
```

### 4. Add Convenience Types

Add to `src/types/index.ts`:

```typescript
export type BlindCategory = Database['public']['Tables']['blind_categories']['Row']
export type BlindType = Database['public']['Tables']['blind_types']['Row']
export type BlindRange = Database['public']['Tables']['blind_ranges']['Row']
export type PriceMatrix = Database['public']['Tables']['price_matrices']['Row']
export type VerticalSlatMapping = Database['public']['Tables']['vertical_slat_mapping']['Row']

// Insert types for creating new records
export type BlindCategoryInsert = Database['public']['Tables']['blind_categories']['Insert']
export type BlindTypeInsert = Database['public']['Tables']['blind_types']['Insert']
export type BlindRangeInsert = Database['public']['Tables']['blind_ranges']['Insert']
export type PriceMatrixInsert = Database['public']['Tables']['price_matrices']['Insert']
```

### 5. Create Server Actions for Product CRUD

**`src/lib/actions/products.ts`**:

Implement these server actions:
- `getCategories()` — list active categories ordered by display_order
- `getCategoryBySlug(slug)` — single category with its types
- `getTypesByCategory(categoryId)` — types for a category
- `getTypeBySlug(slug)` — single type with its ranges
- `getRangesByType(typeId)` — ranges for a type
- `getRangeBySlug(slug)` — single range with colour options
- Admin CRUD: `createCategory`, `updateCategory`, `deleteCategory` (and same for types and ranges)

### 6. Verify Indexes

After migration, confirm these indexes exist:
- `idx_blind_types_category` on blind_types(category_id)
- `idx_blind_ranges_type` on blind_ranges(blind_type_id)
- `idx_price_matrix_lookup` on price_matrices(blind_range_id, width_cm, drop_cm)
- `idx_price_matrix_widths` on price_matrices(blind_range_id, width_cm)
- `idx_price_matrix_drops` on price_matrices(blind_range_id, drop_cm)

---

## Key Schema Details

### Price Matrix Format
- `width_cm` and `drop_cm` are `NUMERIC(6,1)` — supports 0.5cm increments if needed
- `supplier_price_cents` is `INTEGER` — all prices in ZAR cents to avoid float issues
- Composite unique constraint on `(blind_range_id, width_cm, drop_cm)` prevents duplicate entries
- The hot-path index `idx_price_matrix_lookup` ensures sub-millisecond lookups

### Colour Options JSONB
Each range stores its available colours as a JSONB array:
```json
[
  {"name": "White", "hex": "#FFFFFF", "swatch_url": "/swatches/white.jpg"},
  {"name": "Ivory", "hex": "#FFFFF0", "swatch_url": "/swatches/ivory.jpg"},
  {"name": "Charcoal", "hex": "#36454F", "swatch_url": "/swatches/charcoal.jpg"}
]
```

### Vertical Slat Mapping
Vertical blinds have non-uniform width increments (11cm steps for 127mm slats, ~7.5cm for 90mm). The `vertical_slat_mapping` table maps each valid width to its slat count — used in the configurator display.

---

## Acceptance Criteria

```
✅ All 5 product tables created
✅ All indexes verified in Supabase dashboard
✅ UNIQUE constraint on price_matrices(blind_range_id, width_cm, drop_cm) works
✅ Cascading DELETE works: deleting a category removes its types, ranges, and prices
✅ TypeScript types generated and match schema
✅ Server actions for category/type/range CRUD functional
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- The exact SQL is in BUILD_INDEX.md under "Migration 002 — Blinds Product Catalogue"
- The `update_updated_at()` trigger function was created in Migration 001 — reuse it here
- `starting_price_cents` on blind_ranges is a cached value updated when prices are imported — not computed on every request
- The `features` JSONB on blind_types stores product attributes like light_filtering, moisture_resistant, etc. — used for filtering in the configurator
- `min_frame_depth_mm` on blind_types is used for inside mount warnings — some blinds need minimum frame depth to fit
