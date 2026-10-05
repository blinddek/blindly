# Build 12 — Admin: Price Import UI

> **Type:** Frontend
> **Estimated Time:** 2–3 hrs
> **Dependencies:** Build 08 (parsers), Build 11 (admin layout)
> **Context Files:** TECHNICAL_DESIGN.md §4.3 (Import UI Flow)

---

## Objective

Build the admin interface for uploading Shademaster XLS files, previewing parsed data, mapping sheets to ranges, and confirming imports. This is how the client updates their prices when Shademaster sends new price lists.

---

## Tasks

### 1. Import Page

**`src/app/(admin)/admin/products/import/page.tsx`**

Three-phase flow:

**Phase 1: Upload**
- Drag-and-drop zone (accepts .xls, .xlsx files)
- Or click to browse
- File size limit: 10MB
- Show filename + size after selection
- "Parse File" button

**Phase 2: Preview**
After parsing, show:

```
┌──────────────────────────────────────────────────────────────┐
│  Import Preview                                              │
│                                                              │
│  File: Shademaster_Roller_Blind_2025.xls                     │
│  Sheets found: 20                                            │
│                                                              │
│  ☑ Beach        → Roller > Beach        (187 prices)  ✓     │
│  ☑ Cedar        → Roller > Cedar        (190 prices)  ✓     │
│  ☑ Extras       → Roller Extras         (12 items)    ✓     │
│  ☑ Mechanisms   → Mechanism Lookup      (324 entries)  ✓    │
│  ☑ Motorisation → Motor Options         (48 entries)   ✓    │
│  ☑ Sanctuary LF → Roller > Sanctuary LF (210 prices)  ✓     │
│  ...                                                         │
│                                                              │
│  Total: 3,842 prices                                         │
│  New: 3,842 | Changed: 0 | Unchanged: 0                     │
│                                                              │
│  Import Mode: ◉ Replace All  ○ Update Changed Only           │
│                                                              │
│  [Cancel]                              [Confirm Import]      │
└──────────────────────────────────────────────────────────────┘
```

Per sheet row:
- Checkbox: include/exclude from import
- Sheet name
- Auto-detected parser type (icon/badge: matrix, extras, mechanisms, motorisation, vertical)
- Mapped target: category > range dropdown (auto-populated from import_mappings if exists)
- Stats: number of price points / entries
- Status indicator: ✓ parsed ok, ⚠ warnings, ✗ failed

### 2. Sheet-to-Range Mapper

Each sheet needs to map to a blind_range (or special target for extras/mechanisms/motorisation):

- For `standard_matrix` and `vertical` sheets: dropdown of all blind_ranges, grouped by category > type
- For `extras` sheets: auto-maps to "Roller Extras" (no range selection needed)
- For `mechanisms` sheets: auto-maps to "Mechanism Lookup"
- For `motorisation` sheets: auto-maps to "Motorisation Options"

If an `import_mapping` already exists for this sheet name, pre-select it. Allow override.

On confirm, save new/updated mappings to `import_mappings` table.

### 3. Diff Preview

Before confirming, for sheets that map to existing ranges with prices:
- Compare new prices against existing prices in DB
- Show counts: New (didn't exist before), Changed (different price), Unchanged
- Optional: click to expand a sheet and see specific changed prices

### 4. Import Execution

On "Confirm Import":
1. Show progress bar
2. Process each selected sheet:
   - Delete existing prices for the range (if Replace All mode)
   - Insert/upsert new prices
   - For extras/mechanisms/motorisation: replace existing data
3. Save import_mappings for future re-imports
4. Create `price_imports` audit record with stats
5. Update `starting_price_cents` on affected ranges
6. Log to activity_log
7. Show success summary

### 5. Import History

Below the upload zone (or as a separate tab), show a table of past imports:

| Date | File | Sheets | Prices Created | Changed | Unchanged | Imported By |
|------|------|--------|----------------|---------|-----------|-------------|
| 2026-02-19 | Roller_2025.xls | 20 | 3,842 | 0 | 0 | admin@blindly.co.za |

### 6. Error Handling

- Malformed XLS: show parse error with sheet name and row number
- Sheet with no valid prices: warning badge, auto-unchecked
- Unmapped sheet: warning — can't import without a target range
- Network error during import: show error, allow retry
- Partial failure: show which sheets succeeded and which failed

---

## Acceptance Criteria

```
✅ Drag-and-drop file upload works for .xls and .xlsx
✅ Parser runs on upload and shows preview within 5 seconds
✅ Each sheet shows correct parser type auto-detection
✅ Sheet-to-range mapper shows correct options per parser type
✅ Existing import_mappings pre-populate the mapper
✅ Import mode toggle works (Replace All vs Update Changed)
✅ Diff preview shows correct new/changed/unchanged counts
✅ Confirm import writes data to database correctly
✅ Import_mappings saved for future re-imports
✅ price_imports audit record created
✅ starting_price_cents updated on affected ranges
✅ Import history table shows past imports
✅ Error handling: malformed files, empty sheets, unmapped sheets
✅ Progress indication during import
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- The parsing happens client-side (in the browser) using the xlsx library — no need to upload the file to the server for parsing
- Only the structured parsed data is sent to the server for database writes
- Use a server action or API route for the actual database write (needs service role for bulk operations)
- The parser from Build 08 runs in the browser — ensure it works in both Node.js and browser environments
- For large files (90mm vertical: 907×94), show a "Parsing..." loading state
- The import_mappings table is the key to making re-imports fast — admin maps once, then subsequent imports of the same file format auto-map
