# Build 04 — Pricing & Extras Schema

> **Type:** Migration
> **Estimated Time:** 30 min
> **Dependencies:** Build 03 (product tables)
> **Context Files:** BUILD_INDEX.md (Migration 003 SQL), TECHNICAL_DESIGN.md §1.3 (Format Variations)

---

## Objective

Create the extras, motorisation, markup configuration, and import tracking schema. This covers everything needed for accessories pricing, cascading markup logic, mechanism cross-referencing, and supplier price import management.

---

## Context

Blinds pricing isn't just width × drop. There are:
- **Extras** — chain upgrades, valances, cassettes, side guides (some fixed price, some width-dependent)
- **Mechanisms** — roller blinds need specific tube diameters based on width × drop (32mm, 40mm, 45mm, 45HD, 55+EL)
- **Motorisation** — multiple motor brands/models, width-based pricing, must match tube size from mechanism lookup
- **Markup** — cascading: range-specific → type-specific → category-specific → global fallback
- **Import tracking** — audit trail of every XLS import with stats

---

## Tasks

### 1. Create Migration File

Create `supabase/migrations/003_pricing_config.sql` with the **exact SQL** from BUILD_INDEX.md → Migration 003.

This includes:
- `blind_extras` — accessories with pricing_type: 'fixed', 'width_based', 'per_unit'
- `extra_price_points` — width-based pricing rows for width_based extras
- `mechanism_lookup` — width × drop → tube size text for roller blinds
- `motorisation_options` — motor brands/models with tube size requirements
- `motorisation_prices` — width-based pricing per motor option
- `markup_config` — cascading markup: global/category/type/range scopes
- Additional `site_settings` rows for pricing config (markup, delivery, installation, VAT)
- `price_imports` — import audit log
- `import_mappings` — sheet name → range mapping for re-imports

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
export type BlindExtra = Database['public']['Tables']['blind_extras']['Row']
export type ExtraPricePoint = Database['public']['Tables']['extra_price_points']['Row']
export type MechanismLookup = Database['public']['Tables']['mechanism_lookup']['Row']
export type MotorisationOption = Database['public']['Tables']['motorisation_options']['Row']
export type MotorisationPrice = Database['public']['Tables']['motorisation_prices']['Row']
export type MarkupConfig = Database['public']['Tables']['markup_config']['Row']
export type PriceImport = Database['public']['Tables']['price_imports']['Row']
export type ImportMapping = Database['public']['Tables']['import_mappings']['Row']
```

### 5. Verify Seeded Data

After migration, confirm:
- `markup_config` has 1 row: scope_type='global', markup_percent=40.00
- `site_settings` has new pricing rows: global_markup_percent, installation_fee_cents, free_delivery_threshold_cents, delivery_fee_cents, vat_percent, currency

---

## Key Schema Details

### Extras Pricing Types

| Type | How it works | Example |
|------|-------------|---------|
| `fixed` | Same price regardless of blind size | Stainless ball chain: R170 |
| `width_based` | Price varies by blind width, looked up from extra_price_points | Wood valance: R259 at 60cm, R322 at 80cm, etc. |
| `per_unit` | Fixed price per unit, multiplied by quantity | Cassette face fix bracket: R12 each |

### Mechanism Cross-Reference

The `mechanism_lookup` table maps roller blind width × drop to required tube diameter. This determines:
1. Which roller upgrade extras are applicable (40mm upgrade, 45mm upgrade, etc.)
2. Which motorisation options are compatible (motors require specific tube sizes)

Example: a 200cm wide × 200cm drop roller blind needs a 45mm tube → only motors rated for 45mm+ are shown.

### Markup Cascade

Resolution order (first match wins):
1. Range-specific markup (e.g., "Sanctuary BO gets 50% markup")
2. Type-specific markup (e.g., "All 50mm Aluminium gets 45%")
3. Category-specific markup (e.g., "All Roller Blinds get 42%")
4. Global markup (default: 40%)

The `UNIQUE(scope_type, scope_id)` constraint ensures only one markup per scope.

### Import Mappings

When admin first imports a Shademaster XLS file, they map each sheet to a range. This mapping is saved so subsequent imports of the same file auto-map correctly. The `parser_type` field tells the system which parser to use for each sheet.

---

## Acceptance Criteria

```
✅ All 8 new tables created (blind_extras, extra_price_points, mechanism_lookup, motorisation_options, motorisation_prices, markup_config, price_imports, import_mappings)
✅ Global markup seeded at 40%
✅ Pricing settings added to site_settings (6 new rows)
✅ CHECK constraints work: pricing_type only accepts 'fixed'/'width_based'/'per_unit'
✅ CHECK constraints work: scope_type only accepts 'global'/'category'/'type'/'range'
✅ CHECK constraints work: import_mode only accepts 'replace_all'/'update_changed'
✅ CHECK constraints work: parser_type only accepts valid parser names
✅ Indexes on extra_price_points, mechanism_lookup, motorisation_prices verified
✅ TypeScript types regenerated
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- The exact SQL is in BUILD_INDEX.md under "Migration 003 — Extras, Motorisation & Pricing Config"
- The `markup_config.scope_id` is polymorphic (can reference category, type, or range UUID) — no FK constraint, validated in application code
- `blind_extras.applies_to_categories` and `applies_to_types` are UUID arrays — when NULL, the extra applies to all
- The `price_imports.error_log` JSONB field stores any parsing errors per sheet for debugging
- `motorisation_options.tube_size_mm` is the MINIMUM tube size required — motors work with that tube size or larger
