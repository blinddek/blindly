# Build 14 — Admin: Markup & Pricing Config

> **Type:** Frontend
> **Estimated Time:** 1–2 hrs
> **Dependencies:** Build 10 (price lookup engine), Build 11 (admin layout)
> **Context Files:** TECHNICAL_DESIGN.md §3.2 (Markup Cascade)

---

## Objective

Build the admin interface for managing the markup cascade, pricing settings, and a price simulator that lets the admin test pricing before it goes live.

---

## Tasks

### 1. Pricing Page

**`src/app/(admin)/admin/pricing/page.tsx`**

Three sections (can be tabs or vertical sections):

### 2. Section 1: Global Markup

Simple card with one field:

```
┌────────────────────────────────────────────┐
│  Global Markup                             │
│                                            │
│  Default markup applied to all products    │
│  unless overridden at a lower level.       │
│                                            │
│  Markup: [40.00] %              [Save]     │
│                                            │
│  This affects all products without a       │
│  category, type, or range-specific markup. │
└────────────────────────────────────────────┘
```

### 3. Section 2: Markup Overrides

Table showing the cascade overrides:

```
┌──────────────────────────────────────────────────────────────┐
│  Markup Overrides                              [+ Add Override] │
│                                                              │
│  Level     │ Target                │ Markup │ Active │ Actions │
│  ──────────│──────────────────────│────────│────────│─────────│
│  Category  │ Roller Blinds         │ 42.00% │  ✓     │ ✎ ✗    │
│  Type      │ 50mm Aluminium        │ 45.00% │  ✓     │ ✎ ✗    │
│  Range     │ Sanctuary BO          │ 50.00% │  ✓     │ ✎ ✗    │
│                                                              │
│  Global fallback: 40.00%                                     │
└──────────────────────────────────────────────────────────────┘
```

**Add Override Dialog:**
- Level: select (Category, Type, Range)
- Target: cascading select (changes based on level — shows categories, types, or ranges)
- Markup %: number input
- Active: toggle

**Effective Markup Display:**
When selecting a target, show: "Effective markup for [target]: X% (from [level])"

This resolves the cascade in real-time so the admin can see what's actually applied.

### 4. Section 3: Pricing Settings

Card with fields from site_settings (pricing category):

```
┌────────────────────────────────────────────────┐
│  Pricing Settings                              │
│                                                │
│  Delivery Fee:             R [500.00]          │
│  Free Delivery Threshold:  R [5,000.00]        │
│  Installation Fee (per blind): R [500.00]      │
│  VAT Rate:                 [15] %              │
│  Currency:                 [ZAR]               │
│                                                │
│  [Save Settings]                               │
└────────────────────────────────────────────────┘
```

Note: Input values in Rands, store as cents. Convert on save/load.

### 5. Section 4: Price Simulator

Interactive tool for testing pricing:

```
┌────────────────────────────────────────────────────────────┐
│  Price Simulator                                           │
│                                                            │
│  Category:    [Roller Blinds        ▼]                     │
│  Type:        [Roller               ▼]                     │
│  Range:       [Beach                ▼]                     │
│  Width:       [1200] mm                                    │
│  Drop:        [1500] mm                                    │
│  Mount Type:  ◉ Outside  ○ Inside                          │
│                                                            │
│  ──── Results ────                                         │
│                                                            │
│  Matched Grid:      120cm × 150cm                          │
│  Supplier Price:    R 892.50                               │
│  Markup:            42% (from: Category)                   │
│  Markup Amount:     R 374.85                               │
│  Customer Price:    R 1,267.35                             │
│  VAT (15%):         R 190.10                               │
│  Total incl. VAT:   R 1,457.45                             │
│  ─────────────                                             │
│  Profit on this blind: R 374.85                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

This calls the same price lookup engine from Build 10, but shows the FULL breakdown including supplier cost and markup (admin-only view).

The simulator should:
- Cascade selects: Category → Type → Range
- Update results live as inputs change (debounced)
- Show the effective markup source
- Show profit amount prominently
- Handle errors gracefully (out-of-range dimensions, no prices)

---

## Acceptance Criteria

```
✅ Global markup editable and saves to markup_config
✅ Markup overrides: add, edit, delete at category/type/range level
✅ Cascade select works correctly (category → type → range)
✅ Effective markup display shows correct resolved value and source
✅ Pricing settings save correctly (Rand input → cents storage)
✅ Price simulator shows full breakdown with supplier cost + markup + VAT
✅ Simulator updates live as inputs change
✅ Simulator shows markup source (global/category/type/range)
✅ Simulator handles out-of-range dimensions gracefully
✅ All changes persist after page reload
✅ Toast notifications on save
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- The price simulator is the most valuable tool on this page — it lets the admin quickly check their margins before going live
- Markup overrides use the `markup_config` table with scope_type + scope_id
- The simulator should call the same functions from `src/lib/pricing/` — not duplicate the logic
- For the simulator, use a server action that returns the full breakdown (including supplier price) — this is admin-only so it's safe
- Pricing settings use the site_settings table — convert between cents (DB) and Rands (UI)
- The UNIQUE(scope_type, scope_id) constraint means only one markup per target — handle this in the UI (if override exists, show edit, not add)
