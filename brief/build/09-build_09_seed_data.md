# Build 09 — Seed Data Import

> **Type:** Backend
> **Estimated Time:** 1–2 hrs
> **Dependencies:** Build 08 (parsers), Build 07 (all tables)
> **Context Files:** TECHNICAL_DESIGN.md §1 (Supplier Data Analysis)

---

## Objective

Use the parsers from Build 08 to seed the entire Shademaster product catalogue into the database: categories, types, ranges, price matrices, extras, mechanisms, motorisation options, and import mappings. After this build, the database has real data to work with.

---

## Context

The seed script creates the full product hierarchy and imports all ~15,000–20,000 prices:

```
4 Categories → ~15 Types → ~40 Ranges → ~20,000 Price Matrix Rows
+ ~12 Extras + ~324 Mechanism Entries + ~6 Motor Options
+ ~40 Import Mappings + Vertical Slat Mappings
```

---

## Tasks

### 1. Create Seed Script

**`src/lib/import/seed.ts`**

This script runs once to populate the database from Shademaster XLS files. It should be executable via a CLI command or admin action.

```typescript
// High-level flow:
async function seedShademasterData(supabase: SupabaseClient) {
  
  // 1. Create categories
  const categories = await createCategories(supabase)
  
  // 2. Create types per category
  const types = await createTypes(supabase, categories)
  
  // 3. Parse all XLS files
  const parsedFiles = await parseAllFiles()
  
  // 4. Create ranges from parsed sheet names + map to types
  const ranges = await createRanges(supabase, types, parsedFiles)
  
  // 5. Import price matrices per range
  const priceStats = await importPriceMatrices(supabase, ranges, parsedFiles)
  
  // 6. Import extras (from Roller Extras sheet)
  await importExtras(supabase, parsedFiles)
  
  // 7. Import mechanisms (from Roller Mechanisms sheet)
  await importMechanisms(supabase, parsedFiles)
  
  // 8. Import motorisation (from Roller Motorisation sheet)
  await importMotorisation(supabase, parsedFiles)
  
  // 9. Import vertical slat mappings
  await importVerticalSlatMappings(supabase, parsedFiles)
  
  // 10. Create import mappings (sheet name → range)
  await createImportMappings(supabase, ranges)
  
  // 11. Update starting_price_cents on each range
  await updateStartingPrices(supabase, ranges)
  
  // 12. Log the import
  await logImport(supabase, priceStats)
  
  // 13. Print summary
  printSummary(priceStats)
}
```

### 2. Category Definitions

```typescript
const CATEGORIES = [
  {
    name: 'Roller Blinds',
    slug: 'roller-blinds',
    description: 'Clean, modern blinds that roll up into a compact headrail. Available in light-filtering and block-out fabrics.',
    display_order: 1,
  },
  {
    name: 'Aluminium Venetian',
    slug: 'aluminium-venetian',
    description: 'Classic slatted blinds in lightweight aluminium. Adjustable for precise light control.',
    display_order: 2,
  },
  {
    name: 'Wood & Natural Venetian',
    slug: 'wood-venetian',
    description: 'Warm, natural slatted blinds in real wood, bamboo, and composite materials.',
    display_order: 3,
  },
  {
    name: 'Vertical Blinds',
    slug: 'vertical-blinds',
    description: 'Vertical louvres ideal for large windows and sliding doors. Available in 90mm and 127mm slat widths.',
    display_order: 4,
  },
]
```

### 3. Type Definitions

Map each Shademaster product line to a type with correct dimensions and slat sizes:

**Roller Blinds:**
- Roller (no slat_size, material: 'fabric')

**Aluminium Venetian:**
- 25mm Aluminium (slat_size_mm: 25, material: 'aluminium')
- 50mm Aluminium (slat_size_mm: 50, material: 'aluminium')

**Wood & Natural Venetian:**
- 35mm Wood (slat_size_mm: 35, material: 'wood')
- 50mm Wood & Sherwood (slat_size_mm: 50, material: 'wood')
- 50mm Bamboo (slat_size_mm: 50, material: 'bamboo')
- 50mm Polywood (slat_size_mm: 50, material: 'pvc')
- 50mm Dreamwood (slat_size_mm: 50, material: 'composite')
- 50mm PVC (slat_size_mm: 50, material: 'pvc')
- 50mm Swiftwood (slat_size_mm: 50, material: 'composite')
- 63mm Privacy Wood (slat_size_mm: 63, material: 'wood')

**Vertical Blinds:**
- 127mm Vertical (slat_size_mm: 127, material: 'fabric')
- 90mm Vertical (slat_size_mm: 90, material: 'fabric')

For each type, set `min_width_cm`, `max_width_cm`, `min_drop_cm`, `max_drop_cm` from the actual grid extents in the parsed XLS data.

### 4. Range Creation

Each Shademaster price sheet becomes one range. Map sheet names to their parent types:

**Roller ranges (17):** Beach, Cedar, Aspen & Classic, Kleenscreen, Matrix, Natural, Sable, Sanctuary LF, Sanctuary BO, Smart Screen, Solar Cool, Solitaire, Uniview Internal, Uniview External, Uniview External Blind Systems, Urban, Vogue

**Aluminium 25mm ranges (2):** Plain & Designer, Licorice & Mushroom

**Aluminium 50mm ranges (3):** Plain & Designer, Brushed/Linear/Perforated, Décor

And so on for all ~40 sheets.

### 5. Price Matrix Import

For each range, take the parsed width × drop → price grid and insert into `price_matrices`:

```typescript
// Convert float ZAR to integer cents
const priceCents = Math.round(priceFloat * 100)

// Batch insert for performance
const rows = []
for (let d = 0; d < drops.length; d++) {
  for (let w = 0; w < widths.length; w++) {
    if (prices[d][w] != null && !isNaN(prices[d][w])) {
      rows.push({
        blind_range_id: rangeId,
        width_cm: widths[w],
        drop_cm: drops[d],
        supplier_price_cents: Math.round(prices[d][w] * 100),
      })
    }
  }
}

// Insert in chunks of 1000 to avoid payload limits
for (let i = 0; i < rows.length; i += 1000) {
  await supabase.from('price_matrices').upsert(rows.slice(i, i + 1000))
}
```

### 6. Extras Import

From the Roller Extras parsed data, create `blind_extras` and `extra_price_points`:

```typescript
for (const item of extrasData.items) {
  const extra = await supabase.from('blind_extras').insert({
    name: item.name,
    applies_to_categories: [rollerCategoryId],  // Extras only apply to rollers
    pricing_type: item.pricing_type,
    fixed_price_cents: item.pricing_type === 'fixed' ? Math.round(item.prices[0] * 100) : null,
    max_width_cm: item.max_width,
  }).select().single()
  
  if (item.pricing_type === 'width_based') {
    const pricePoints = item.widths.map((w, i) => ({
      extra_id: extra.data.id,
      width_cm: w,
      price_cents: Math.round(item.prices[i] * 100),
    }))
    await supabase.from('extra_price_points').insert(pricePoints)
  }
}
```

### 7. Mechanisms Import

```typescript
for (const entry of mechanismsData.entries) {
  await supabase.from('mechanism_lookup').insert({
    width_cm: entry.width_cm,
    drop_cm: entry.drop_cm,
    tube_size: entry.tube_size,
  })
}
```

### 8. Motorisation Import

```typescript
for (const motor of motorisationData.motors) {
  const option = await supabase.from('motorisation_options').insert({
    brand: motor.brand,
    model: motor.model,
    tube_size_mm: parseInt(motor.tube_size) || null,
    is_rechargeable: motor.is_rechargeable,
  }).select().single()
  
  const prices = motor.widths.map((w, i) => ({
    motor_id: option.data.id,
    width_cm: w,
    price_cents: Math.round(motor.prices[i] * 100),
  }))
  await supabase.from('motorisation_prices').insert(prices)
}
```

### 9. Starting Price Cache

After all prices imported, update each range's `starting_price_cents` with the lowest customer price:

```typescript
for (const range of allRanges) {
  const { data: minPrice } = await supabase
    .from('price_matrices')
    .select('supplier_price_cents')
    .eq('blind_range_id', range.id)
    .order('supplier_price_cents', { ascending: true })
    .limit(1)
    .single()
  
  if (minPrice) {
    // Apply global markup (40%) to get customer-facing "from" price
    const customerPrice = Math.round(minPrice.supplier_price_cents * 1.4)
    await supabase
      .from('blind_ranges')
      .update({ starting_price_cents: customerPrice })
      .eq('id', range.id)
  }
}
```

### 10. Create CLI Runner

**`scripts/seed.ts`** (or add to package.json scripts):

```bash
# Add to package.json:
"scripts": {
  "seed": "npx tsx scripts/seed.ts"
}
```

The script should:
1. Read all XLS files from a specified directory
2. Run the full seed flow
3. Print a summary table

### 11. Summary Output

```
╔══════════════════════════════════════════════════╗
║  SHADEMASTER SEED COMPLETE                       ║
╠══════════════════════════════════════════════════╣
║  Categories:     4                               ║
║  Types:          ~15                             ║
║  Ranges:         ~40                             ║
║  Price Points:   ~18,500                         ║
║  Extras:         ~12                             ║
║  Mechanisms:     ~324                            ║
║  Motor Options:  ~6                              ║
║  Import Maps:    ~40                             ║
╚══════════════════════════════════════════════════╝
```

---

## Acceptance Criteria

```
✅ Seed script runs end-to-end without errors
✅ 4 categories created with correct names and slugs
✅ All types created with correct slat sizes, materials, and dimension ranges
✅ All ~40 ranges created and mapped to correct types
✅ price_matrices populated: total rows between 15,000–20,000
✅ Spot-check 10 random prices against source XLS — all match (within 1 cent rounding)
✅ All extras imported with correct pricing types and max widths
✅ All mechanism entries imported (every width × drop → tube size)
✅ All motorisation options imported with width-based pricing
✅ Vertical slat mappings imported for both 127mm and 90mm
✅ Import mappings created for all sheet names
✅ starting_price_cents updated on all ranges (non-zero)
✅ Import logged in price_imports table
✅ No orphaned records (every range has a type, every type has a category)
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- The Shademaster XLS files will be provided in the project directory
- Use the Supabase service role key (SUPABASE_SERVICE_ROLE_KEY) for the seed script — it bypasses RLS
- Batch inserts in chunks of 1000 rows to stay within Supabase payload limits
- Use `upsert` instead of `insert` for price_matrices — this makes re-running the seed idempotent
- Convert all prices from ZAR float to cents integer: `Math.round(price * 100)`
- The seed is a one-time operation but should be re-runnable without duplicating data
- Log any parsing warnings (empty cells, unexpected values) but don't fail the import
