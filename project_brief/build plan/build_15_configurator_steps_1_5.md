# Build 15 — Configurator: Steps 1–5

> **Type:** Frontend
> **Estimated Time:** 3–4 hrs
> **Dependencies:** Build 10 (pricing engine for "from" prices)
> **Context Files:** PROJECT_BRIEF.md §3 (Configurator Steps 1–5), BRAND_DESIGN_SYSTEM.md

---

## Objective

Build the first half of the voice-guided configurator — the product selection journey from choosing a blind type through to selecting a colour. This is the core customer experience of Blindly.

---

## Context — The 11-Step Configurator

The full configurator flow (Steps 1–5 in this build, 6–7 in Build 16):

```
Step 1:  What type of blind? (category cards)
Step 2:  Inside or outside mount? (visual selector + info)
Step 3:  What thickness? (slat size — skipped for rollers)
Step 4:  Choose your range (filtered product cards with "from R...")
Step 5:  Pick your colour (swatches + disclaimer + swatch request CTA)
  ── Build 16 ──
Step 6:  Enter measurements (live pricing)
Step 7:  Add to cart / Add another
```

**Voice-guided UX principle:** Each step has a heading that asks a question in natural language. The interface feels like a guided conversation, not a form.

---

## Tasks

### 1. Configurator Route & State Management

**`src/app/(public)/configure/page.tsx`**

Use a React context or URL-based state to track wizard progress:

```typescript
interface ConfiguratorState {
  step: number                    // 1–7
  category_id: string | null
  category_slug: string | null
  mount_type: 'inside' | 'outside' | null
  type_id: string | null
  type_slug: string | null
  range_id: string | null
  range_slug: string | null
  colour: string | null
  colour_hex: string | null
  // Steps 6–7 added in Build 16
}
```

**State persistence:** Store in React context + localStorage backup. If user refreshes, restore from localStorage. If user navigates away and returns, offer to resume.

**URL approach (alternative):** `/configure?step=3&category=roller-blinds&mount=outside` — makes sharing/bookmarking possible.

### 2. Progress Indicator

Top of the configurator:

```
[1]──[2]──[3]──[4]──[5]──[6]──[7]
 ●    ●    ◉    ○    ○    ○    ○
Type Mount Size Range Colour Size  Cart
```

- Completed steps: filled circle (brand-terracotta)
- Current step: outlined circle with pulse animation
- Future steps: empty circle (brand-sand)
- Clickable: can navigate back to completed steps
- Step 3 hidden if category is Roller (no slat size selection)

### 3. Step 1 — "What type of blind are you looking for?"

Fetch `blind_categories` (active, ordered by display_order).

Display as visual cards:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│                  │  │                  │  │                  │  │                  │
│   [image]        │  │   [image]        │  │   [image]        │  │   [image]        │
│                  │  │                  │  │                  │  │                  │
│  Roller Blinds   │  │  Aluminium       │  │  Wood & Natural  │  │  Vertical        │
│                  │  │  Venetian        │  │  Venetian        │  │  Blinds          │
│  Clean, modern   │  │  Classic slatted │  │  Warm, natural   │  │  Ideal for       │
│  blinds...       │  │  blinds in...    │  │  slatted...      │  │  large windows...│
│                  │  │                  │  │                  │  │                  │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

On click: store category, advance to Step 2.

**Responsive:** 2×2 grid on mobile, 4×1 on desktop.

### 4. Step 2 — "How will your blind be mounted?"

Two large visual cards:

```
┌──────────────────────────────┐  ┌──────────────────────────────┐
│                              │  │                              │
│   ┌────────────┐             │  │   ┌────────────┐             │
│   │  ┌──────┐  │  INSIDE     │  │   │            │  OUTSIDE    │
│   │  │blind │  │  MOUNT      │  │   │  ┌──────┐  │  MOUNT      │
│   │  │      │  │             │  │   │  │blind │  │             │
│   │  └──────┘  │  Fits inside │  │   │  │      │  │  Covers the │
│   └────────────┘  the window  │  │   │  └──────┘  │  entire      │
│                   frame.      │  │   └────────────┘  window frame.│
│                              │  │                              │
│   Best for: recessed windows │  │   Best for: flat walls,      │
│   Neat, flush appearance     │  │   maximum light block        │
│                              │  │                              │
└──────────────────────────────┘  └──────────────────────────────┘
```

Include a brief explanation of each and when to use it. Use simple SVG diagrams showing blind position relative to window frame.

On click: store mount_type, advance to Step 3 (or Step 4 if Roller).

### 5. Step 3 — "What thickness do you prefer?"

**Only shown for Venetian and Vertical categories** (rollers skip to Step 4).

Fetch `blind_types` filtered by selected category, ordered by display_order.

Display as cards with slat size prominently:

```
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│                    │  │                    │  │                    │
│      ════════      │  │      ═══════       │  │      ══════        │
│      ════════      │  │      ═══════       │  │      ══════        │
│      ════════      │  │                    │  │                    │
│                    │  │                    │  │                    │
│  25mm Aluminium    │  │  50mm Aluminium    │  │  50mm Wood         │
│                    │  │                    │  │                    │
│  Slim profile,     │  │  Classic width,    │  │  Natural warmth,   │
│  more light when   │  │  strong light      │  │  premium look      │
│  open              │  │  control           │  │                    │
└────────────────────┘  └────────────────────┘  └────────────────────┘
```

**Inside mount frame depth warning:**
If mount_type is 'inside' and the type has a min_frame_depth_mm value:
```
⚠️ This blind requires a minimum frame depth of 45mm for inside mounting.
   Please measure your frame depth before proceeding.
   
   ☐ I confirm my window frame is deep enough for inside mounting.
```
Checkbox must be checked to proceed.

On click: store type, advance to Step 4.

### 6. Step 4 — "Choose your range"

Fetch `blind_ranges` filtered by selected type, ordered by display_order.

Display as cards with swatch preview and starting price:

```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  [lifestyle image]   │  │  [lifestyle image]   │  │  [lifestyle image]   │
│                     │  │                     │  │                     │
│  Beach              │  │  Cedar              │  │  Sanctuary LF       │
│  Light, breezy      │  │  Warm, natural      │  │  Premium light      │
│  textures           │  │  wood tones         │  │  filtering          │
│                     │  │                     │  │                     │
│  [swatch strip]     │  │  [swatch strip]     │  │  [swatch strip]     │
│                     │  │                     │  │                     │
│  From R 450         │  │  From R 520         │  │  From R 680         │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

- Swatch strip: horizontal row of 4–6 colour dots (from colour_options) as a preview
- Starting price: from `starting_price_cents` (includes markup, formatted as "From R X")
- If no lifestyle image, use swatch image as card background

On click: store range, advance to Step 5.

### 7. Step 5 — "Pick your colour"

Fetch selected range's `colour_options` from JSONB.

Display as a swatch grid:

```
"Pick your colour"

  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
  │      │  │      │  │      │  │      │  │      │
  │      │  │      │  │      │  │      │  │      │
  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘
   White     Ivory    Charcoal   Stone     Natural

  Selected: ● Charcoal (#36454F)
  
  ⚠️ Colour Disclaimer
  Colours shown on screen may vary from the actual product due to
  screen settings and lighting conditions. We recommend ordering a
  free swatch sample before purchasing.
  
  ☐ I understand that screen colours may differ from the actual product.
  
  ┌──────────────────────────────────────────────┐
  │  🎁 Not sure? Request a FREE swatch sample   │
  │     delivered to your door.                   │
  │                                  [Request →]  │
  └──────────────────────────────────────────────┘
```

**Swatch grid:**
- If swatch_url available: show swatch image
- Otherwise: show hex colour square
- Selected swatch: terracotta border + checkmark
- Hover: enlarge slightly + show name tooltip

**Colour disclaimer:**
- Must check the checkbox to proceed
- Styled as a warm amber/sand info box, not alarming red

**Free Swatch Request:**
- CTA card below the colour grid
- On click: opens modal form
- Form fields: Name, Email, Phone (optional), Address (street, city, province, postal code)
- On submit: creates swatch_requests record + shows confirmation toast
- Doesn't block progression — user can request swatch AND continue configuring

On colour select + disclaimer confirmed: store colour, advance to Step 6.

### 8. Back Navigation

Every step has a "← Back" button that returns to the previous step with state preserved.

Clicking a completed step in the progress indicator also navigates back.

Going back does NOT clear subsequent selections — user can change Step 2 and their Step 4 choice is preserved (if still valid). If a change invalidates later selections (e.g., switching category), clear dependent steps.

### 9. Responsive Design

- Mobile: single column, full-width cards, sticky progress bar at top
- Tablet: 2-column card grids
- Desktop: max-width 960px (configurator container), centered
- Swatches: wrap grid to fit screen width

### 10. Loading States

- Skeleton loaders while fetching categories/types/ranges
- Optimistic: pre-fetch next step's data while user is viewing current step

---

## Acceptance Criteria

```
✅ Full flow from Step 1 → Step 5 works without errors
✅ Step 1: all 4 categories display with images and descriptions
✅ Step 2: inside/outside mount cards with SVG diagrams
✅ Step 3: type cards filtered by category; skipped for Roller Blinds
✅ Step 3: inside mount depth warning shown when applicable
✅ Step 3: disclaimer checkbox blocks progression until checked
✅ Step 4: range cards with swatch preview and "From R..." price
✅ Step 5: colour swatches from range's colour_options JSONB
✅ Step 5: colour disclaimer checkbox required
✅ Step 5: swatch request modal submits to swatch_requests table
✅ Progress indicator shows correct state and allows back-navigation
✅ Back navigation preserves state
✅ State persists across page refresh (localStorage)
✅ Responsive: mobile, tablet, desktop all work
✅ Loading states (skeletons) shown during data fetch
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- This is the customer-facing crown jewel — it needs to look and feel premium
- Use the brand design system: DM Serif Display for step headings, DM Sans for body text
- Warm neutral backgrounds (brand-linen/ivory), terracotta accents on selected states and CTAs
- Card hover effects: subtle shadow lift + border-brand-sand
- The configurator should feel conversational — each step heading is a question
- Pre-fetch data: when Step 1 loads, also fetch types in the background
- The swatch request form is a lead capture mechanism — it captures customer info even if they don't buy
- Max width for the configurator: 960px (from brand design system)
