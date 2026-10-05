# Build 10 — Price Lookup Engine

> **Type:** Backend
> **Estimated Time:** 1–2 hrs
> **Dependencies:** Build 09 (seeded data)
> **Context Files:** TECHNICAL_DESIGN.md §3 (Price Lookup Engine)

---

## Objective

Build the server-side pricing engine: the core functions that take a blind configuration and return the customer price. This includes the price matrix lookup with mount-type rounding, cascading markup resolver, extras pricing, and motorisation cross-referencing. Plus the public API routes that the configurator will call.

---

## Context

The pricing flow:
```
Customer enters: range_id + width_mm + drop_mm + mount_type
                         ↓
1. Convert mm → cm, find nearest grid point (round UP for outside, DOWN for inside)
2. Lookup supplier_price_cents from price_matrices
3. Resolve markup via cascade: range → type → category → global
4. Calculate customer_price = supplier_price × (1 + markup%)
5. Return: { supplier_price, markup_percent, customer_price, matched_width, matched_drop }
```

---

## Tasks

### 1. Core Price Lookup

**`src/lib/pricing/lookup.ts`**

```typescript
interface PriceLookupInput {
  blind_range_id: string
  width_mm: number
  drop_mm: number
  mount_type: 'inside' | 'outside'
}

interface PriceLookupResult {
  supplier_price_cents: number
  markup_percent: number
  markup_cents: number
  customer_price_cents: number
  matched_width_cm: number
  matched_drop_cm: number
  vat_cents: number
  total_with_vat_cents: number
}

export async function lookupPrice(input: PriceLookupInput): Promise<PriceLookupResult>
```

**Algorithm:**
1. Convert mm to cm: `width_cm = width_mm / 10`, `drop_cm = drop_mm / 10`
2. Fetch available grid widths for this range (sorted ascending):
   ```sql
   SELECT DISTINCT width_cm FROM price_matrices 
   WHERE blind_range_id = $1 ORDER BY width_cm
   ```
3. Fetch available grid drops (sorted ascending):
   ```sql
   SELECT DISTINCT drop_cm FROM price_matrices 
   WHERE blind_range_id = $1 ORDER BY drop_cm
   ```
4. Find matched grid point:
   - **Outside mount:** round UP — find first grid width >= customer width, first grid drop >= customer drop. Rationale: outside mount blind must cover the opening, so go to next size up.
   - **Inside mount:** round DOWN — find last grid width <= customer width, last grid drop <= customer drop. Rationale: inside mount blind must fit within the frame, so go to next size down.
5. If no valid grid point found (size exceeds available range), throw a descriptive error
6. Lookup supplier price:
   ```sql
   SELECT supplier_price_cents FROM price_matrices
   WHERE blind_range_id = $1 AND width_cm = $2 AND drop_cm = $3
   ```
7. Get markup via cascade (see below)
8. Calculate customer price: `supplier × (1 + markup/100)`
9. Calculate VAT: `customer_price × (vat_percent/100)`
10. Return full breakdown

### 2. Markup Cascade

**`src/lib/pricing/markup.ts`**

```typescript
export async function resolveMarkup(blind_range_id: string): Promise<{
  markup_percent: number
  source: 'range' | 'type' | 'category' | 'global'
}>
```

**Resolution order:**
1. Check `markup_config` for `scope_type = 'range'` AND `scope_id = range_id`
2. Get the type_id for this range, check `scope_type = 'type'` AND `scope_id = type_id`
3. Get the category_id for this type, check `scope_type = 'category'` AND `scope_id = category_id`
4. Fall back to `scope_type = 'global'` (always exists, seeded at 40%)

Return both the percentage and which level it came from (for admin visibility).

### 3. Extras Price Calculator

**`src/lib/pricing/extras.ts`**

```typescript
interface ExtraWithPrice {
  id: string
  name: string
  description: string | null
  pricing_type: 'fixed' | 'width_based' | 'per_unit'
  price_cents: number
  is_upgrade: boolean
}

// Get all applicable extras for a blind configuration
export async function getApplicableExtras(
  blind_range_id: string,
  width_cm: number
): Promise<ExtraWithPrice[]>

// Calculate price for a specific extra
export async function getExtraPrice(
  extra_id: string,
  width_cm: number,
  quantity?: number
): Promise<number>  // returns price in cents
```

**Logic per pricing type:**
- `fixed`: return `fixed_price_cents` directly
- `width_based`: find the nearest width_cm >= customer width from `extra_price_points`, return that price. If customer width exceeds `max_width_cm`, the extra is not available.
- `per_unit`: return `fixed_price_cents × quantity`

**Filtering:** Only return extras where:
- `is_active = true`
- `applies_to_categories` contains the blind's category_id (or is NULL)
- `applies_to_types` contains the blind's type_id (or is NULL)
- Customer width doesn't exceed `max_width_cm`

### 4. Motorisation Price Calculator

**`src/lib/pricing/motorisation.ts`**

```typescript
interface MotorOptionWithPrice {
  id: string
  brand: string
  model: string
  is_rechargeable: boolean
  price_cents: number
  compatible: boolean
  incompatible_reason?: string
}

export async function getMotorOptions(
  width_cm: number,
  drop_cm: number
): Promise<MotorOptionWithPrice[]>
```

**Logic:**
1. Look up required tube size from `mechanism_lookup` for this width × drop
2. Fetch all active motorisation options
3. For each motor:
   - Check if motor's `tube_size_mm` is compatible with required tube
   - If compatible, look up width-based price from `motorisation_prices`
   - If incompatible, include in results but mark as `compatible: false` with reason
4. Sort: compatible first, then by price ascending

### 5. Public API Routes

**`src/app/api/blinds/price/route.ts`**

```typescript
// POST /api/blinds/price
// Body: { blind_range_id, width_mm, drop_mm, mount_type }
// Returns: PriceLookupResult (customer prices only — never expose supplier price to client)
```

**Important:** The API response must NOT include `supplier_price_cents` or `markup_percent`. Only return:
- `customer_price_cents` (after markup)
- `matched_width_cm`, `matched_drop_cm`
- `vat_cents`, `total_with_vat_cents`

Supplier costs are internal — only visible in admin.

**`src/app/api/blinds/extras/route.ts`**

```typescript
// POST /api/blinds/extras
// Body: { blind_range_id, width_cm }
// Returns: ExtraWithPrice[] (with customer-facing prices including markup)
```

**Note:** Extra prices should also have markup applied if desired. Check pricing_settings or apply a flat markup to extras too. (Discuss with business logic — for now, extras pass through at supplier cost + markup.)

### 6. Utility: Available Grid Points

**`src/lib/pricing/grid.ts`**

```typescript
// Get available width/drop ranges for a blind range
export async function getAvailableGrid(blind_range_id: string): Promise<{
  widths: number[]
  drops: number[]
  min_width_cm: number
  max_width_cm: number
  min_drop_cm: number
  max_drop_cm: number
}>
```

This is used by the configurator to show min/max dimensions and validate input.

### 7. Unit Tests

Test these scenarios:

**Price lookup:**
- Outside mount: 750mm width → rounds up to 80cm grid point
- Inside mount: 750mm width → rounds down to 70cm grid point
- Exact grid match: 800mm → 80cm (both mount types)
- Exceeds max: 5000mm width → error

**Markup cascade:**
- Range with specific markup → returns range markup
- Range without, type with → returns type markup
- Range without, type without, category with → returns category markup
- All empty → returns global 40%

**Extras:**
- Fixed price extra: same price regardless of width
- Width-based extra: correct interpolation to nearest grid point
- Width exceeds max: extra not returned
- Filter by category: roller extras don't show for venetian blinds

---

## Acceptance Criteria

```
✅ Price lookup returns correct customer price for known test dimensions
✅ Outside mount rounds UP, inside mount rounds DOWN
✅ Markup cascade resolves correctly at all 4 levels
✅ Extras filter by category/type and return correct prices
✅ Width-based extras find correct price point
✅ Motorisation options filter by tube size compatibility
✅ API /api/blinds/price responds < 100ms
✅ API response does NOT contain supplier_price_cents or markup_percent
✅ Error handling: invalid range_id, out-of-range dimensions, missing data
✅ Available grid function returns correct min/max per range
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- Use the Supabase server client for all database queries (server-side only)
- The price lookup is the hot path of the entire application — optimize for speed
- Consider caching the available grid points (they don't change unless prices are re-imported)
- All money values are integers in cents — never use floats for pricing
- The API routes should validate input with Zod schemas before processing
- VAT rate comes from site_settings ('vat_percent') — don't hardcode 15%
