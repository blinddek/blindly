# Build 23 — Admin: Quotes & Leads Management

> **Type:** Frontend
> **Estimated Time:** 1–2 hrs
> **Dependencies:** Build 18 (quotes), Build 11 (admin layout)
> **Context Files:** saved_quotes, swatch_requests, measure_requests schemas

---

## Objective

Build the admin interface for managing all three lead types: saved quotes, swatch requests, and measure requests. Plus the lead pipeline summary on the dashboard.

---

## Tasks

### 1. Quotes Management

**`src/app/(admin)/admin/quotes/page.tsx`**

**Table columns:**
| Customer | Email | Items | Total | Created | Age | Status | Actions |

- **Customer:** Name (or "Anonymous" if no name)
- **Items:** Count of blinds in cart_data
- **Total:** Formatted price
- **Age:** "2 days ago", "1 week ago"
- **Status:** Badge — Pending | Converted | Expired
  - Pending: created, not expired, not converted
  - Converted: `converted_to_order_id` is not null
  - Expired: `expires_at < now()`

**Quote Detail (dialog or separate page):**
- Customer contact info
- Full cart contents from cart_data JSONB:
  - Each blind: type, range, colour, size, price
  - Extras per blind
  - Total
- Quote link: clickable URL to `/quote/[token]`
- Follow-up status: which reminder emails have been sent
- "Mark as Contacted" button (for manual follow-up tracking)
- If converted: link to the order

### 2. Swatch Requests

**`src/app/(admin)/admin/leads/swatches/page.tsx`** (or tab within leads page)

**Table columns:**
| Customer | Email | Phone | Blind Range | Colour | Address | Status | Created | Actions |

**Status management:**
- Dropdown to change status: New → Sent → Delivered
- Status change logs to activity_log

**Actions:**
- View address details (for posting the swatch)
- Mark as Sent
- Mark as Delivered
- Admin notes

### 3. Measure Requests

**`src/app/(admin)/admin/leads/measures/page.tsx`** (or tab within leads page)

**Table columns:**
| Customer | Phone | Method | Address | Status | Scheduled | Created | Actions |

**Status management:**
- New → Contacted → Scheduled → Completed → Cancelled
- "Schedule" action: date/time picker → sets `scheduled_at`

**Actions:**
- View full details
- Schedule measurement (date picker)
- Mark status transitions
- Admin notes

### 4. Leads Page — Combined View

**`src/app/(admin)/admin/leads/page.tsx`**

Tabbed interface: **Swatch Requests** | **Measure Requests** | **Contact Submissions**

Contact submissions from the foundation table are also shown here.

### 5. Dashboard Pipeline Summary

Update the admin dashboard (Build 11) with real lead counts:

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Pending Quotes   │  │  Swatch Requests │  │  Measure Requests│
│  5                │  │  3 new           │  │  2 new           │
│  Total: R 45,280  │  │  1 sent          │  │  1 scheduled     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

These should be live counts from the database.

### 6. CSV Export

On each lead table, add an "Export CSV" button:
- Exports all rows (or filtered rows) as CSV
- Filename: `blindly-quotes-2026-02-19.csv`, `blindly-swatches-2026-02-19.csv`, etc.
- All columns included

### 7. Bulk Actions

On each table:
- Select multiple rows via checkboxes
- Bulk status change (e.g., mark all selected swatches as "Sent")
- Bulk delete (with confirmation)

---

## Acceptance Criteria

```
✅ Quotes table shows all saved quotes with correct status (Pending/Converted/Expired)
✅ Quote detail shows full cart contents from JSONB
✅ Swatch requests table with status management (New → Sent → Delivered)
✅ Measure requests table with scheduling and status pipeline
✅ Contact submissions visible in leads section
✅ Dashboard shows real-time lead counts
✅ CSV export works for all lead types
✅ Bulk actions work (status change, delete)
✅ Status changes logged to activity_log
✅ Admin notes save per lead
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- Use shadcn/ui Table, Tabs, Badge, Dialog, Select for all UI
- Quotes table reads cart_data from JSONB — parse and display the blind configurations
- The "Age" column is important — it helps the admin prioritise follow-up (older quotes need urgent attention)
- CSV export can use a simple client-side approach: build CSV string, create Blob, trigger download
- Contact submissions reuse the `contact_submissions` table from the foundation migration
- Lead counts on the dashboard should use server-side count queries for accuracy
