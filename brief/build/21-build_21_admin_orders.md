# Build 21 — Admin: Order Management

> **Type:** Frontend
> **Estimated Time:** 2–3 hrs
> **Dependencies:** Build 19 (orders), Build 11 (admin layout)
> **Context Files:** TECHNICAL_DESIGN.md §7 (Supplier Order PDF)

---

## Objective

Build the admin order management interface: order list with status filtering, detailed order view with profit visibility, status pipeline management, and admin notes.

---

## Tasks

### 1. Order List Page

**`src/app/(admin)/admin/orders/page.tsx`**

**Status filter tabs:**
```
[All (12)] [New (3)] [Confirmed (2)] [Ordered (4)] [Shipped (1)] [Delivered (2)] [Installed (0)]
```

**Table columns:**
| Order # | Customer | Date | Items | Total | Profit | Status | Actions |
|---------|----------|------|-------|-------|--------|--------|---------|

- **Order #:** BL-2026-0001 (clickable → detail page)
- **Customer:** Name + email
- **Date:** Relative ("2 hours ago") + absolute on hover
- **Items:** Count of blinds
- **Total:** Customer total (formatted as Rands)
- **Profit:** Total markup amount (green text)
- **Status:** Badge with colour coding per status
- **Actions:** View | Quick status advance button

**Search:** Filter by order number, customer name, or email.
**Sort:** By date (newest first default), by total, by status.
**Pagination:** 20 per page.

**Status badge colours:**
- New: blue
- Confirmed: indigo
- Ordered from supplier: amber
- Shipped: orange
- Delivered: green
- Installed: emerald
- Cancelled: red

### 2. Order Detail Page

**`src/app/(admin)/admin/orders/[id]/page.tsx`**

```
┌──────────────────────────────────────────────────────────────────┐
│  Order BL-2026-0001                              [Status Badge]  │
│  Placed: 19 Feb 2026, 14:30                                     │
│                                                                  │
│  ── Status Pipeline ──                                           │
│  [New] → [Confirmed] → [Ordered] → [Shipped] → [Delivered]     │
│    ●         ●            ◉          ○            ○              │
│                                                                  │
│  [Advance to "Ordered from Supplier" →]                         │
│  [Cancel Order ✗]                                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ── Customer ──                                                  │
│  Name: John Smith                                                │
│  Email: john@example.com                                         │
│  Phone: 082 123 4567                                             │
│  Address: 15 Main Road, Paarl, Western Cape, 7646               │
│  Delivery: Professional Installation                             │
│  ⭐ Interested in other Nortier services                         │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ── Items ──                                                     │
│                                                                  │
│  1. Kitchen Window 1                                             │
│     Roller — Beach — Sand                                        │
│     Outside Mount · 1200×1500mm (120×150cm)                     │
│     Control: Right                                               │
│     Extras: Stainless chain (R170), Side guides (R384)          │
│                                                                  │
│     Supplier Cost:    R   892.50                                 │
│     Markup (42%):     R   374.85                                 │
│     Extras:           R   554.00                                 │
│     Customer Price:   R 1,821.35                                 │
│     Profit:           R   374.85  ← green                       │
│                                                                  │
│  2. Main Bedroom                                                 │
│     Aluminium 50mm — Plain & Designer — White                   │
│     Inside Mount · 900×1200mm (90×120cm)                        │
│     ...                                                          │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ── Order Summary ──                                             │
│                                                                  │
│  Subtotal:          R 2,713.35                                   │
│  Extras:            R   554.00                                   │
│  Delivery:          R   500.00                                   │
│  Installation:      R 1,000.00                                   │
│  VAT (15%):         R   715.10                                   │
│  ────────────────────────────                                    │
│  Total:             R 5,482.45                                   │
│                                                                  │
│  Total Profit:      R   749.70  ← green, prominent              │
│  Profit Margin:     15.4%                                        │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ── Payment ──                                                   │
│  Status: Paid ✓                                                  │
│  Reference: pay_abc123xyz                                        │
│  Paid at: 19 Feb 2026, 14:32                                    │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ── Admin Notes ──                                               │
│  [                                                    ]          │
│  [  Textarea for internal notes                       ]          │
│  [                                                    ]          │
│  [Save Notes]                                                    │
│                                                                  │
│  ── Actions ──                                                   │
│  [Generate Supplier Order PDF]  [Print Order]                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3. Status Pipeline

Visual pipeline showing all statuses with current highlighted:
```
[New] ──→ [Confirmed] ──→ [Ordered] ──→ [Shipped] ──→ [Delivered] ──→ [Installed]
```

- Completed statuses: filled dots (brand-terracotta)
- Current: pulsing dot
- Future: empty dots

**"Advance" button:** Moves to next status in the pipeline.
- Shows confirmation dialog: "Move order to [next status]?"
- On confirm: updates DB, triggers status email (from Build 20), logs activity
- Button label changes: "Confirm Order", "Mark as Ordered from Supplier", "Mark as Shipped", etc.

**"Cancel" button:** Sets status to 'cancelled'.
- Separate confirmation dialog with reason input
- Reason stored in admin_notes

### 4. Profit View

For each order item and the order total, show:
- Supplier cost (what Blindly pays)
- Customer price (what the customer pays)
- Markup amount (the profit)
- Margin percentage

This is admin-only data — never visible to customers.

### 5. Admin Notes

- Textarea for internal notes
- Auto-saves on blur or manual save button
- Timestamp shown: "Last updated: [date]"
- Notes visible on both list (truncated) and detail pages

### 6. Cross-Sell Highlight

If `interested_in_other_services = true`:
- Star icon + "Interested in other Nortier services" badge on the detail page
- Highlighted in the order list as well
- This is a lead for the parent company's other offerings

### 7. Quick Actions on List

From the order list, without opening the detail page:
- Quick status advance button (next step only)
- These should have confirmation dialogs

---

## Acceptance Criteria

```
✅ Order list shows all orders with correct data
✅ Status filter tabs work with counts
✅ Search by order number, customer name, email works
✅ Pagination works (20 per page)
✅ Order detail page shows complete order information
✅ Status pipeline visual is accurate
✅ "Advance" button moves to next status with confirmation
✅ Status change triggers email to customer
✅ Status change logged in activity_log
✅ Profit breakdown shown per item and total
✅ Admin notes save and persist
✅ Cross-sell flag highlighted when present
✅ "Generate Supplier Order PDF" button present (wired in Build 22)
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- Use shadcn/ui Table, Badge, Dialog, Textarea, Tabs
- The profit view is the admin's main value proposition — make it prominent
- Status changes are server actions that also trigger emails — use the function from Build 20
- The order list should be a Server Component with search params for filtering
- Cross-sell leads should be impossible to miss — use a bright badge or star icon
- "Generate Supplier Order PDF" is a placeholder button here — functionality comes in Build 22
