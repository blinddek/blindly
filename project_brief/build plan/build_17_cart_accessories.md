# Build 17 — Cart & Accessories Upsell

> **Type:** Frontend
> **Estimated Time:** 2–3 hrs
> **Dependencies:** Build 16 (cart state), Build 10 (extras pricing API)
> **Context Files:** PROJECT_BRIEF.md §3 (Step 8 — Accessories)

---

## Objective

Build the cart page with a per-item accessories upsell section. Customers review their configured blinds, add extras like premium chains, valances, cassettes, and motorisation, then proceed to checkout.

---

## Tasks

### 1. Cart Page

**`src/app/(public)/cart/page.tsx`**

```
"Your Blinds"

  ┌──────────────────────────────────────────────────────────────┐
  │  Kitchen Window 1                                    [✎] [✗] │
  │                                                              │
  │  Roller Blind — Beach — Sand                                 │
  │  Outside Mount · 1200mm × 1500mm (120 × 150cm)              │
  │  Qty: [1]                                                    │
  │                                                      R 1,267 │
  │                                                              │
  │  ── Accessories ──                                           │
  │                                                              │
  │  ┌───────────────────────────────────────────────────┐      │
  │  │ ☐ Stainless Steel Ball Chain     + R 170          │      │
  │  │   Upgrade from standard plastic chain              │      │
  │  ├───────────────────────────────────────────────────┤      │
  │  │ ☐ Wood Valance 106mm             + R 384          │      │
  │  │   Premium wood cover for the headrail              │      │
  │  ├───────────────────────────────────────────────────┤      │
  │  │ ☐ Full Cassette Fascia           + R 690          │      │
  │  │   Enclosed headrail for a clean, modern look       │      │
  │  ├───────────────────────────────────────────────────┤      │
  │  │ ☐ Side Guides                    + R 384          │      │
  │  │   Keep the blind fabric aligned in the frame       │      │
  │  └───────────────────────────────────────────────────┘      │
  │                                                              │
  │  ── Motorisation ── (Roller Blinds only)                     │
  │                                                              │
  │  ┌───────────────────────────────────────────────────┐      │
  │  │ ○ None (manual operation)                         │      │
  │  │ ○ One Touch 1.8Nm Li (rechargeable)   + R 3,185  │      │
  │  │ ○ Somfy Optuo 40                      + R 4,531  │      │
  │  │ ○ Somfy Sonesse 40                    + R 7,150  │      │
  │  └───────────────────────────────────────────────────┘      │
  │                                                              │
  │  Item Total:                                        R 1,267 │
  │  Accessories:                                       R 554   │
  │  ─────────────                                              │
  │  Line Total:                                        R 1,821 │
  └──────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────┐
  │  Main Bedroom                                        [✎] [✗] │
  │  Aluminium Venetian — 50mm — Plain & Designer — White        │
  │  Inside Mount · 900mm × 1200mm (90 × 120cm)                 │
  │  ...                                                         │
  └──────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  + Configure another blind                               │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  ── Cart Summary ──

  ┌────────────────────────────────────────────┐
  │  Subtotal (2 blinds):          R 3,088     │
  │  Extras:                       R 554       │
  │  Delivery:                     R 500       │
  │  (Free on orders over R 5,000)             │
  │                                            │
  │  Estimated Total:              R 4,142     │
  │  (VAT calculated at checkout)              │
  │                                            │
  │  [Continue to Checkout →]                  │
  │                                            │
  │  [💾 Save as Quote]  [📧 Email me this]    │
  └────────────────────────────────────────────┘
```

### 2. Accessories Section (per item)

For each cart item, fetch applicable extras using `POST /api/blinds/extras`:
- Send: `blind_range_id` + `matched_width_cm`
- Returns: list of extras with customer prices

**Display rules:**
- Checkbox toggle for each extra
- Price shown as "+ R X" (already includes markup)
- Description and benefit text for each extra
- Upgrading items (is_upgrade = true): show as "upgrade from standard [X]"

**Motorisation section (Roller Blinds only):**
- Fetch motor options using the motorisation pricing function
- Radio buttons (only one motor per blind)
- Show compatibility status (some motors may not fit based on tube size)
- Incompatible options: greyed out with reason text

### 3. Live Price Updates

As accessories are toggled on/off:
- Update the item's `extras_cents` and `line_total_cents`
- Update the cart summary totals
- All updates instant (client-side calculation)

Store selected extras in cart item:
```typescript
interface SelectedExtra {
  extra_id: string
  name: string
  price_cents: number
  type: 'extra' | 'motorisation'
}
```

### 4. Edit & Remove

- **Edit (✎):** Returns to configurator Step 6 with this item's config pre-loaded. On save, updates the cart item.
- **Remove (✗):** Confirmation dialog → remove from cart. If cart is empty, show empty state.

### 5. Quantity Adjustment

Per item: +/- buttons or number input for quantity.
Price updates: line_total = (customer_price + extras) × quantity.

### 6. Cart Summary

- **Subtotal:** sum of all line totals (before delivery/VAT)
- **Extras Total:** sum of all extras across all items
- **Delivery Fee:** from pricing settings. Show "FREE" if above threshold.
  - "Free on orders over R X,XXX" hint
- **Estimated Total:** subtotal + extras + delivery (VAT shown at checkout, not here)
- Note: "VAT calculated at checkout" — keeps the cart simpler

### 7. Empty Cart State

If cart is empty:
```
Your cart is empty.

Start configuring your perfect blinds.

[Start Configuring →]
```

### 8. "Configure Another Blind" CTA

Link back to `/configure` (Step 1) to add more blinds.

### 9. Save as Quote / Email

Two secondary CTAs below "Continue to Checkout":
- **Save as Quote** → Build 18
- **Email me this** → Build 18
These are placeholders in this build — wire up in Build 18.

---

## Acceptance Criteria

```
✅ Cart page displays all configured blinds with full details
✅ Extras fetched per item based on range and width
✅ Extra checkboxes toggle correctly, prices update live
✅ Motorisation section appears only for Roller blinds
✅ Motorisation radio buttons work (single selection)
✅ Incompatible motors greyed out with reason
✅ Line totals update correctly (base price + extras × quantity)
✅ Cart summary shows correct subtotal, extras, delivery
✅ Delivery fee shows FREE when above threshold
✅ Edit button returns to configurator with item data pre-loaded
✅ Remove button deletes item with confirmation
✅ Quantity adjustment works
✅ Empty cart state displayed when no items
✅ "Configure another" links to /configure
✅ Cart persists across page refresh
✅ Responsive: works on mobile (stacked layout)
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- Extras are fetched from the API, not hardcoded — different blinds get different extras
- Motorisation requires the mechanism cross-reference (width × drop → tube size → compatible motors)
- All prices are in cents internally, displayed in Rands to the customer
- Use JetBrains Mono for all price displays
- The cart is client-side (localStorage) — no server-side cart
- "Save as Quote" and "Email me this" buttons can be non-functional placeholders (wired in Build 18)
- The accessories section is the upsell moment — make it clear and enticing, not overwhelming
