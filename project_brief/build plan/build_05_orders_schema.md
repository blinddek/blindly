# Build 05 — Orders & Checkout Schema

> **Type:** Migration
> **Estimated Time:** 30 min
> **Dependencies:** Build 04 (pricing tables)
> **Context Files:** BUILD_INDEX.md (Migration 004 SQL)

---

## Objective

Create the orders and order items schema with auto-generated order numbers, payment tracking, and a status pipeline for the full order lifecycle from checkout through to installation.

---

## Context

Blindly uses **guest checkout** — no account required. Customers provide name, email, phone, and address at checkout. Each order contains one or more configured blinds (order_items), each with its own measurements, colour, extras, and pricing breakdown.

The order lifecycle:
```
new → confirmed → ordered_from_supplier → shipped → delivered → installed
                                                                    ↓
                                                              cancelled (any stage)
```

Payment via Paystack: customer pays → webhook confirms → order status moves to 'confirmed'.

---

## Tasks

### 1. Create Migration File

Create `supabase/migrations/004_orders.sql` with the **exact SQL** from BUILD_INDEX.md → Migration 004.

This includes:
- `orders` — main order record with customer info, delivery type, pricing totals, payment tracking, status pipeline
- `order_items` — individual blinds with full configuration (range, colour, measurements, mount type, control side, stacking, extras, pricing breakdown)
- `order_number_seq` — PostgreSQL sequence for auto-incrementing order numbers
- `generate_order_number()` — trigger function producing 'BL-YYYY-NNNN' format

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
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']

// Order with items joined
export type OrderWithItems = Order & {
  order_items: OrderItem[]
}
```

### 5. Test Order Number Generation

Insert a test order (can be done via Supabase SQL editor):

```sql
INSERT INTO orders (
  customer_name, customer_email, customer_phone,
  delivery_type, subtotal_cents, vat_cents, total_cents
) VALUES (
  'Test Customer', 'test@test.com', '0821234567',
  'self_install', 100000, 15000, 115000
);

-- Verify:
SELECT order_number FROM orders ORDER BY created_at DESC LIMIT 1;
-- Should return: 'BL-2026-0001'
```

Insert a second order to confirm sequence increments:
```sql
INSERT INTO orders (
  customer_name, customer_email, customer_phone,
  delivery_type, subtotal_cents, vat_cents, total_cents
) VALUES (
  'Test Customer 2', 'test2@test.com', '0829876543',
  'professional_install', 200000, 30000, 230000
);

SELECT order_number FROM orders ORDER BY created_at DESC LIMIT 1;
-- Should return: 'BL-2026-0002'
```

Clean up test data after verification.

---

## Key Schema Details

### Order Number Format
- Pattern: `BL-YYYY-NNNN` (e.g., BL-2026-0001)
- `BL` prefix = Blindly (distinguishes from other Nortier projects)
- Year extracted from `now()` at insert time
- Sequence is project-wide, not per-year (simpler, no resets)
- Trigger only fires when `order_number IS NULL OR order_number = ''`

### Delivery Types
- `self_install` — customer installs themselves, standard delivery fee applies
- `professional_install` — Blindly sends an installer, installation_fee_cents added per blind

### Payment Fields
- `paystack_reference` — Paystack transaction reference (from their API)
- `paystack_access_code` — used to initialise the inline payment popup
- `payment_status` — tracked independently from order_status

### Order Items — Pricing Breakdown
Each order_item stores the full pricing story:
- `supplier_price_cents` — raw cost from price matrix
- `markup_percent` — what markup was applied
- `markup_cents` — markup amount in cents
- `extras_cents` — total cost of selected extras
- `line_total_cents` — final price for this item (supplier + markup + extras)

This breakdown is crucial for the admin profit view — they can see margin per blind.

### Selected Extras JSONB
```json
[
  {"extra_id": "uuid-here", "name": "Stainless steel ball chain", "price_cents": 17000},
  {"extra_id": "uuid-here", "name": "Wood valance 106mm", "price_cents": 32200}
]
```
Stored as snapshot — if extra prices change later, historical orders retain their original pricing.

### Matched Grid Points
- `width_mm` / `drop_mm` — what the customer entered
- `matched_width_cm` / `matched_drop_cm` — what grid point was actually used for pricing
- These differ because prices are looked up at the nearest grid point (rounded up for outside mount, down for inside mount)

---

## Acceptance Criteria

```
✅ orders and order_items tables created
✅ order_number_seq sequence created
✅ Auto-generated order numbers work: BL-2026-0001, BL-2026-0002, etc.
✅ Trigger only fires when order_number is empty (manual override possible)
✅ CHECK constraints work on delivery_type, payment_status, order_status, mount_type, control_side, stacking
✅ Cascading DELETE: deleting an order removes its items
✅ All indexes created (status, payment, email, number, created_at, order_items.order_id)
✅ updated_at trigger works on orders table
✅ TypeScript types regenerated
✅ Test orders cleaned up
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- The exact SQL is in BUILD_INDEX.md under "Migration 004 — Orders & Checkout"
- Order numbers use a PostgreSQL SEQUENCE — not a UUID or timestamp-based approach. This gives predictable, human-readable numbers.
- The `order_status` pipeline is linear but can skip steps (e.g., go from 'new' straight to 'cancelled')
- `interested_in_other_services` is a cross-sell flag — when a customer checks "I'm interested in other Nortier services" at checkout, the admin sees this highlighted in the order detail
- `room_preview_image_url` on order_items connects to the stretch goal Room Preview feature (Build 28)
