# Build 16 — Configurator: Steps 6–7 (Measurements + Multi-Window)

> **Type:** Frontend
> **Estimated Time:** 3–4 hrs
> **Dependencies:** Build 15 (Steps 1–5), Build 10 (price lookup API)
> **Context Files:** PROJECT_BRIEF.md §3 (Steps 6–7)

---

## Objective

Build the measurement input step with live pricing and the multi-window flow that lets customers add multiple blinds to their cart. This is where the configurator turns browsing into buying.

---

## Tasks

### 1. Step 6 — "Enter your measurements"

```
"What are your window measurements?"

  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │   Location Label                                           │
  │   [Kitchen Window 1          ]                             │
  │                                                            │
  │   ┌─────────────────┐    ┌─────────────────┐              │
  │   │ Width (mm)       │    │ Drop (mm)        │              │
  │   │ [    1200       ]│    │ [    1500       ]│              │
  │   └─────────────────┘    └─────────────────┘              │
  │                                                            │
  │   Your blind will be made to: 120cm × 150cm               │
  │   (Rounded up to nearest standard size for outside mount)  │
  │                                                            │
  │   ┌──────────────────────────────────────────────┐        │
  │   │                                              │        │
  │   │   Blind Price:          R 1,267              │        │
  │   │   (excl. VAT & extras)                       │        │
  │   │                                              │        │
  │   └──────────────────────────────────────────────┘        │
  │                                                            │
  │   ── Options ──                                            │
  │                                                            │
  │   Control Side:   ◉ Left    ○ Right                        │
  │   (Venetian only)                                          │
  │                                                            │
  │   Stacking:       ○ Left  ○ Right  ○ Centre Stack  ○ Open │
  │   (Vertical only)                                          │
  │                                                            │
  │   ── Disclaimer ──                                         │
  │                                                            │
  │   ☐ I confirm I have measured my window accurately.        │
  │     Blindly is not responsible for blinds ordered with     │
  │     incorrect measurements.                                │
  │                                                            │
  │   ┌──────────────────────────────────────────────┐        │
  │   │  📐 Not confident measuring?                  │        │
  │   │     Request a FREE professional measure.      │        │
  │   │                               [Request →]     │        │
  │   └──────────────────────────────────────────────┘        │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

**Live Pricing:**
- On width/drop input change (debounced 300ms), call `POST /api/blinds/price`
- Show loading spinner while price calculates
- Display the matched grid point ("Your blind will be made to: Xcm × Ycm")
- Show rounding direction explanation based on mount type
- Display customer price prominently (excludes VAT and extras — those come at cart)

**Validation:**
- Width and drop must be numbers, > 0
- Width within type's min_width_cm × 10 to max_width_cm × 10 range
- Drop within type's min_drop_cm × 10 to max_drop_cm × 10 range
- Out-of-range: show friendly error ("This blind is available from Xcm to Ycm wide")
- Show live validation as user types (red border + message for invalid)

**Conditional fields:**
- Control Side: shown for Venetian blinds only (has left/right cord position)
- Stacking: shown for Vertical blinds only (louvre stacking direction)
- Both hidden for Roller blinds

**Location Label:**
- Free-text input for customer to name this window ("Kitchen", "Main Bedroom Left")
- Optional but encouraged — helps them track multiple blinds
- Pre-populated with "Window 1", "Window 2", etc. for multi-window flow

**Measurement Disclaimer:**
- Checkbox required to proceed
- Self-measurement responsibility warning

**Professional Measure CTA:**
- Links to measure request modal (same as Build 15 swatch request pattern)
- Form: Name, Email, Phone, Address, Preferred method (in-person/virtual), Notes
- Submits to `measure_requests` table

### 2. Step 7 — "Review & Continue"

After confirming measurements:

```
"Here's your configured blind"

  ┌────────────────────────────────────────────────────┐
  │  Kitchen Window 1                                  │
  │                                                    │
  │  Roller Blind — Beach — Sand                       │
  │  Outside Mount · 1200mm × 1500mm (120 × 150cm)    │
  │                                                    │
  │  Price: R 1,267                                    │
  └────────────────────────────────────────────────────┘

  What would you like to do next?

  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
  │                  │  │                  │  │                  │
  │  + Add same      │  │  + Add different  │  │  🛒 View Cart    │
  │    blind,        │  │    blind         │  │                  │
  │    different     │  │                  │  │  1 item · R 1,267│
  │    size          │  │  Start fresh     │  │                  │
  │                  │  │  with a new type │  │  Continue to     │
  │  Same type,      │  │                  │  │  accessories &   │
  │  range & colour  │  │                  │  │  checkout        │
  │                  │  │                  │  │                  │
  └──────────────────┘  └──────────────────┘  └──────────────────┘
```

**Three paths:**

1. **"Add same blind, different size"**
   - Returns to Step 6 with category, mount, type, range, and colour preserved
   - Only measurements and location label are cleared
   - Location label auto-increments: "Kitchen Window 2"

2. **"Add different blind"**
   - Returns to Step 1 completely fresh
   - Previous blind is saved to cart

3. **"View Cart"**
   - Navigates to `/cart`
   - Current blind is saved to cart before navigation

### 3. Cart State Management

**`src/hooks/use-cart.ts`** or **`src/lib/cart.ts`**

```typescript
interface CartItem {
  id: string                    // Unique ID (nanoid)
  blind_range_id: string
  category_name: string
  type_name: string
  range_name: string
  colour: string
  colour_hex: string
  mount_type: 'inside' | 'outside'
  location_label: string
  width_mm: number
  drop_mm: number
  matched_width_cm: number
  matched_drop_cm: number
  control_side?: 'left' | 'right'
  stacking?: string
  customer_price_cents: number
  quantity: number
  selected_extras: SelectedExtra[]  // Added in Build 17
}

interface Cart {
  items: CartItem[]
  addItem(item: CartItem): void
  removeItem(id: string): void
  updateItem(id: string, updates: Partial<CartItem>): void
  clearCart(): void
  getSubtotal(): number
  getItemCount(): number
}
```

**Persistence:** Save to localStorage on every change. Restore on mount.
**Expiry:** Cart data expires after 7 days of inactivity (clear stale carts).

### 4. Quantity Support

On the review card and in cart:
- Default quantity: 1
- Allow quantity adjustment (for identical blinds — same size, same config)
- "Need more than one?" hint under the review card

### 5. Edge Cases

- **Zero-price result:** If price lookup returns 0 or null, show error ("Price unavailable for these dimensions — please contact us")
- **API timeout:** Show retry option
- **Invalid dimensions after category change:** If user goes back to Step 1, changes category, and their saved measurements exceed new type's range — clear measurements and show notice
- **Browser back button:** Should navigate between wizard steps, not leave the configurator

---

## Acceptance Criteria

```
✅ Step 6: width and drop inputs accept mm values
✅ Step 6: live price updates on input change (debounced)
✅ Step 6: matched grid point displayed with rounding explanation
✅ Step 6: validation shows min/max range for current blind type
✅ Step 6: control side shown only for Venetian
✅ Step 6: stacking shown only for Vertical
✅ Step 6: measurement disclaimer checkbox required
✅ Step 6: professional measure request modal works
✅ Step 7: review card shows complete configuration summary
✅ Step 7: "Add same" returns to Step 6 with config preserved
✅ Step 7: "Add different" returns to Step 1 fresh
✅ Step 7: "View Cart" saves item and navigates to /cart
✅ Cart state persists in localStorage
✅ Multi-window flow: add 3 different blinds, all appear in cart
✅ Quantity adjustment works
✅ Price API response < 100ms
✅ Error handling: out-of-range, API failure, invalid input
✅ Responsive on mobile
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- The live pricing call must be debounced (300ms) to avoid hammering the API on every keystroke
- Use the `formatPrice` utility from Build 01 for all price display
- The price shown in Step 6 excludes VAT and extras — this is intentional. Full totals are shown in the cart/checkout.
- The cart is client-side only (localStorage) — no server-side cart at this stage
- JetBrains Mono for price display (from brand design system)
- The mm → cm conversion and grid matching explanation is important for customer confidence ("Your blind will be made to...") — don't skip it
