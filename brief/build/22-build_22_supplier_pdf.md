# Build 22 — Admin: Supplier PDF Generation

> **Type:** Backend
> **Estimated Time:** 1–2 hrs
> **Dependencies:** Build 21 (order detail page)
> **Context Files:** TECHNICAL_DESIGN.md §7 (Supplier Order PDF)

---

## Objective

Generate a PDF matching the Shademaster order form layout, auto-populated from order data. This saves the admin from manually transcribing every order into Shademaster's format.

---

## Tasks

### 1. PDF Generation

**`src/lib/pdf/supplier-order.ts`**

Generate a PDF with these sections:

**Header:**
- Nortier Group / Blindly letterhead
- "SUPPLIER ORDER"
- Order #: BL-2026-XXXX
- Order Date: DD/MM/YYYY
- Customer: [business name / Blindly]

**Line Items Table:**

| No | Location | Qty | Width (mm) | Drop (mm) | Controls L/R | Stacking | Blind Type | Range | Colour |
|----|----------|-----|-----------|-----------|--------------|----------|------------|-------|--------|
| 1 | Kitchen | 1 | 1200 | 1500 | Right | — | Roller | Beach | Sand |
| 2 | Bedroom | 1 | 900 | 1200 | Left | — | Alum 50mm | Plain | White |

**Extras per item (if any):**
| No | Location | Extra | Details |
|----|----------|-------|---------|
| 1 | Kitchen | Stainless steel ball chain | |
| 1 | Kitchen | Side guides | |

**Motorisation (if any):**
| No | Location | Motor | Model |
|----|----------|-------|-------|
| 1 | Kitchen | Somfy | Optuo 40 3/30 |

**Footer:**
- Total items: X
- Notes: [admin_notes from order]
- Generated: [timestamp]

### 2. PDF Library

Use one of:
- `@react-pdf/renderer` — React-based PDF generation (preferred for consistency)
- `jspdf` + `jspdf-autotable` — simpler, good for tabular data
- `puppeteer` / Playwright — HTML to PDF (heavy, avoid if possible)

Recommendation: `jspdf` + `jspdf-autotable` for this use case (simple table-heavy document).

### 3. API Route

**`GET /api/admin/orders/[id]/supplier-pdf`**

1. Verify admin auth
2. Fetch order with items
3. Generate PDF
4. Return as downloadable PDF response:
   ```typescript
   return new Response(pdfBuffer, {
     headers: {
       'Content-Type': 'application/pdf',
       'Content-Disposition': `attachment; filename="Shademaster-Order-${orderNumber}.pdf"`,
     },
   })
   ```

### 4. Wire to Admin UI

On the order detail page (Build 21):
- "Generate Supplier Order" button
- On click: fetch PDF from API route → trigger browser download
- Loading state while PDF generates

### 5. Optional: XLS Export

If time permits, also generate an XLS format matching Shademaster's order form:
- Same data as PDF but in spreadsheet format
- Some suppliers prefer XLS for direct import into their systems

**`GET /api/admin/orders/[id]/supplier-xls`**

---

## Acceptance Criteria

```
✅ PDF generates with correct order data
✅ All order items listed with full specifications
✅ Extras and motorisation listed per item
✅ Width and drop shown in mm (matching Shademaster's expected format)
✅ PDF downloads with correct filename
✅ PDF is readable and well-formatted
✅ Button on admin order detail works
✅ Loading state shown during generation
✅ Admin auth required (non-admin cannot access)
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- The PDF must use mm for dimensions (not cm) — this is what Shademaster expects on their order forms
- Keep the PDF simple and functional — it doesn't need to be beautiful, it needs to be accurate
- The control side field maps to "Controls L/R" in Shademaster's format
- Stacking is for vertical blinds only
- If using jspdf: `pnpm add jspdf jspdf-autotable`
- If using @react-pdf/renderer: it works server-side in Node.js
- Admin notes from the order should be included as a footer note on the PDF
