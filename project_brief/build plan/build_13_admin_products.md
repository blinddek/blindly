# Build 13 — Admin: Product Management

> **Type:** Frontend
> **Estimated Time:** 2–3 hrs
> **Dependencies:** Build 11 (admin layout)
> **Context Files:** Database schema for blind_categories, blind_types, blind_ranges

---

## Objective

Build the admin CRUD interface for managing the product catalogue: categories, types, and ranges. This is where the admin adds new products, updates descriptions, manages colour options, and controls what's visible on the public site.

---

## Tasks

### 1. Products Page — Tabbed View

**`src/app/(admin)/admin/products/page.tsx`**

Three tabs: **Categories** | **Types** | **Ranges**

Each tab has:
- Search bar (filter by name)
- "Add New" button
- Data table with columns relevant to that level

### 2. Categories Tab

**Table columns:** Name | Slug | Products (count of types) | Active | Order | Actions

**Create/Edit Dialog (shadcn Dialog):**
- Name (text input — slug auto-generated)
- Slug (text input — editable, auto-generated from name)
- Description (textarea)
- Image (upload to Supabase Storage via media library, or paste URL)
- Display Order (number)
- Active toggle (switch)

**Actions:** Edit | Deactivate/Activate | Delete (with confirmation — only if no types attached)

### 3. Types Tab

**Table columns:** Name | Category | Slat Size | Material | Active | Order | Actions

**Filters:** Category dropdown

**Create/Edit Dialog:**
- Name (text)
- Slug (auto-generated)
- Category (select dropdown — from blind_categories)
- Slat Size mm (number, nullable for rollers)
- Material (select: aluminium, wood, bamboo, pvc, fabric, composite)
- Description (textarea)
- Features (JSON editor or checkbox grid):
  - Light filtering
  - Block out
  - Moisture resistant
  - UV resistant
  - Fire retardant
  - Motorisation available
- Min/Max Width cm (two number inputs)
- Min/Max Drop cm (two number inputs)
- Min Frame Depth mm (number, for inside mount warning)
- Image (upload/URL)
- Display Order (number)
- Active toggle

### 4. Ranges Tab

**Table columns:** Name | Type | Category | Colours (count) | Starting Price | Active | Actions

**Filters:** Category dropdown, Type dropdown (cascading — type options filter when category selected)

**Create/Edit Dialog:**
- Name (text)
- Slug (auto-generated)
- Type (select dropdown — from blind_types, grouped by category)
- Description (textarea)
- Supplier (text, default: 'shademaster')
- Swatch Image (upload/URL)
- Lifestyle Image (upload/URL)
- Display Order (number)
- Active toggle

**Colour Options Editor (inline within range edit):**

This is the most complex part — an editable list of colours:

```
┌────────────────────────────────────────────────────┐
│  Colour Options                          [+ Add]   │
│                                                    │
│  ■ White       #FFFFFF    [swatch.jpg]  [✕]       │
│  ■ Ivory       #FFFFF0   [swatch.jpg]  [✕]       │
│  ■ Charcoal    #36454F   [swatch.jpg]  [✕]       │
│  ■ Natural Oak #B8860B   [swatch.jpg]  [✕]       │
│                                                    │
│  [Add Colour]                                      │
│  Name: [________]  Hex: [#______]  Swatch: [📎]   │
└────────────────────────────────────────────────────┘
```

Per colour:
- Name (text)
- Hex code (colour picker input)
- Swatch image URL (upload small image)
- Remove button

Stored as JSONB array in blind_ranges.colour_options:
```json
[
  {"name": "White", "hex": "#FFFFFF", "swatch_url": "/swatches/white.jpg"},
  {"name": "Ivory", "hex": "#FFFFF0", "swatch_url": "/swatches/ivory.jpg"}
]
```

### 5. Bulk Actions

On each tab's data table:
- Checkbox column for row selection
- Bulk actions dropdown: Activate, Deactivate, Delete
- Confirmation dialog for destructive actions

### 6. Slug Auto-Generation

When admin types a name, auto-generate slug:
```typescript
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
```

Slug field is editable but auto-populates on name change (only if slug hasn't been manually modified).

### 7. Cascade Display

On the Types and Ranges tabs, show the parent hierarchy as breadcrumbs or grouped rows so the admin can see the full context:
- Types: "Aluminium Venetian > 25mm Aluminium"
- Ranges: "Aluminium Venetian > 25mm Aluminium > Plain & Designer"

### 8. Data Validation

- Name: required, min 2 chars
- Slug: required, unique, URL-safe characters only
- Min/Max dimensions: min must be < max
- Hex codes: valid 6-digit hex
- Display order: non-negative integer

---

## Acceptance Criteria

```
✅ Three-tab interface for Categories, Types, Ranges
✅ Full CRUD works on all three levels (create, read, update, delete)
✅ Slug auto-generated from name
✅ Category select cascades correctly when creating/editing types
✅ Type select cascades correctly when creating/editing ranges
✅ Colour options editor: add, edit, remove colours with hex picker
✅ Colour options save/load correctly as JSONB
✅ Image upload works (via Supabase Storage)
✅ Active toggle works (immediately updates is_active)
✅ Search filters the table
✅ Delete prevented when children exist (e.g., can't delete category with types)
✅ Bulk activate/deactivate works
✅ Validation prevents invalid data
✅ Toast notifications on save/delete
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- Use shadcn/ui Table, Dialog, Input, Select, Switch, Tabs, Badge
- Server actions for all CRUD operations (not client-side API calls)
- Use `revalidatePath` after mutations to refresh the list
- The colour options editor is the trickiest part — use React state to manage the array, save on dialog confirm
- Starting price is read-only here (it's updated automatically during price import)
- Don't implement drag-and-drop reordering for display_order — simple number input is fine for this project
- Features JSONB on types can be a simple checkbox grid rather than a raw JSON editor
