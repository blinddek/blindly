# Build 08 — XLS Parser Engine

> **Type:** Backend
> **Estimated Time:** 2–3 hrs
> **Dependencies:** Build 07 (all tables + RLS)
> **Context Files:** TECHNICAL_DESIGN.md §1 (Supplier Data Analysis), §4 (XLS Import Engine)

---

## Objective

Build the complete Shademaster XLS parsing engine — 5 specialised parsers that handle every format variation across Shademaster's 6 price list files (~40 sheets). This is pure data extraction logic, no UI yet.

---

## Context — Shademaster File Inventory

| File | Sheets | Parser Type |
|------|--------|-------------|
| Aluminium Venetian Price List | 5 sheets | standard_matrix |
| Wood/Sherwood/Bamboo/Dreamwood/Polywood/PVC Venetian Price List | 7 sheets | standard_matrix |
| 50mm Swiftwood Venetian Price List | 1 sheet | standard_matrix |
| 63mm Privacy Wood Venetian Price List | 1 sheet | standard_matrix |
| Roller Blind Price List | 20 sheets (17 ranges + Extras + Mechanisms + Motorisation) | standard_matrix / extras / mechanisms / motorisation |
| Vertical Blind Price List | 6 sheets | vertical |

**Total: ~40 sheets, ~15,000–20,000 price points**

---

## Tasks

### 1. Install / Verify xlsx Dependency

Already installed in Build 01: `xlsx` (SheetJS). Verify it's in package.json.

### 2. Standard Matrix Parser

**`src/lib/parsers/standard-matrix.ts`**

Handles: All Venetian sheets + most Roller sheets (Beach, Cedar, Aspen, etc.)

```
Input: SheetJS worksheet object
Output: {
  sheet_name: string,
  widths: number[],       // [60, 70, 80, 90, 100, ...]
  drops: number[],        // [60, 70, 80, 90, 100, ...]
  prices: number[][],     // prices[drop_index][width_index] in ZAR (float, e.g. 313.74)
  valance_prices: number[] | null,  // Width-based valance row if present
  row_count: number,
  col_count: number,
  total_prices: number
}
```

**Parsing logic:**
1. Read raw sheet data as 2D array (using `XLSX.utils.sheet_to_json` with `{header: 1}`)
2. Find the WIDTH header row: scan rows looking for a row where multiple consecutive cells contain sequential numbers (60, 70, 80... or similar). The header row typically has numbers starting from column 2 or 3.
3. Extract width values from that row (skip leading blank/text cells)
4. For each subsequent row:
   - Column 0 may contain vertical "D R O P" text (one letter per row) — **skip these cells entirely**
   - Column 1 (or first numeric column): drop value in cm
   - Skip rows where the first meaningful cell is text (e.g., "VALANCE")
   - Remaining columns: price values matching width headers
5. If a "VALANCE" row is found, parse it separately (width-based pricing)
6. Handle empty cells: some sheets have gaps at extreme dimensions

**Edge cases to handle:**
- The "D R O P" text in column 0 spanning rows 9–17 — must not be interpreted as data
- Some sheets have a blank row between the header and first data row
- Valance row at the bottom of some 50mm sheets
- Numbers may be stored as strings in some cells — always parseFloat

### 3. Extras Parser

**`src/lib/parsers/extras.ts`**

Handles: Roller Blinds → "Extras" sheet

```
Input: SheetJS worksheet object
Output: {
  items: [{
    name: string,         // "Stainless ball chain", "Wood valance 106mm", etc.
    widths: number[],     // Available widths
    prices: number[],     // Price per width
    max_width: number | null,  // NULL if no limit, else last valid width
    pricing_type: 'fixed' | 'width_based'  // fixed if same price across all widths
  }]
}
```

**Parsing logic:**
1. Row 2 (or wherever widths start): width values in cm
2. Each subsequent row is an independent accessory:
   - Column 0 or 1: accessory name (text)
   - Remaining columns: prices per width
   - Empty cells after a certain width = max width limit for that accessory
3. Detect if pricing is fixed (all values identical) vs width_based (values vary)

### 4. Mechanisms Parser

**`src/lib/parsers/mechanisms.ts`**

Handles: Roller Blinds → "Mechanisms and tubes" sheet

```
Input: SheetJS worksheet object
Output: {
  entries: [{
    width_cm: number,
    drop_cm: number,
    tube_size: string    // "32", "40", "45", "45HD", "55 + EL"
  }]
}
```

**Parsing logic:**
1. Width headers in row 2
2. Drop values in column 1
3. Cell values are tube size designations (text), NOT prices
4. Map every width × drop combination to its tube size

### 5. Motorisation Parser

**`src/lib/parsers/motorisation.ts`**

Handles: Roller Blinds → "Motorisation" sheet

```
Input: SheetJS worksheet object
Output: {
  tube_cost: { widths: number[], prices: number[] },
  motors: [{
    brand: string,        // "One Touch", "Somfy"
    model: string,        // "1.8Nm Li", "Optuo 40 3/30"
    is_rechargeable: boolean,
    widths: number[],
    prices: number[]
  }]
}
```

**Parsing logic:**
1. Width headers in row 2
2. Multiple motor options spread across rows — each has a label cell with brand/model name
3. Group consecutive rows by motor option
4. Tube cost row is separate (just tube upgrade pricing, not a motor)
5. Extract rechargeable status from model name (if contains "Li" or "rechargeable")

### 6. Vertical Parser

**`src/lib/parsers/vertical.ts`**

Handles: All Vertical Blind sheets (127mm and 90mm variants)

```
Input: SheetJS worksheet object
Output: {
  sheet_name: string,
  widths: number[],           // Non-uniform increments (11cm for 127mm, ~7.5cm for 90mm)
  slat_counts: number[],      // Slat count per width
  drops: number[],
  prices: number[][],
  row_count: number,
  col_count: number,
  total_prices: number
}
```

**Parsing logic:**
1. Row 2: width values (NON-UNIFORM — 56, 67, 78, 89, 100, 111... for 127mm)
2. Row 3: slat count per width (5, 6, 7, 8, 9, 10...)
3. Row 4+: standard price grid (drop × width)
4. 90mm sheets are very large (907 rows × 94 columns) — must handle efficiently

### 7. Main Parser Orchestrator

**`src/lib/parsers/shademaster.ts`**

```typescript
import { parseStandardMatrix } from './standard-matrix'
import { parseExtras } from './extras'
import { parseMechanisms } from './mechanisms'
import { parseMotorisation } from './motorisation'
import { parseVertical } from './vertical'

type ParserType = 'standard_matrix' | 'extras' | 'mechanisms' | 'motorisation' | 'vertical'

interface ParseResult {
  filename: string
  sheets: SheetResult[]
  summary: {
    total_sheets: number
    total_prices: number
    errors: string[]
  }
}

interface SheetResult {
  sheet_name: string
  detected_parser: ParserType
  data: any  // Typed per parser
  stats: {
    rows: number
    cols: number
    prices: number
  }
}

export function parseShademasterFile(buffer: ArrayBuffer, filename: string): ParseResult
```

**Auto-detection logic** (determine which parser to use for each sheet):
1. If sheet name contains "Extra" → extras parser
2. If sheet name contains "Mechanism" or "tube" → mechanisms parser
3. If sheet name contains "Motor" → motorisation parser
4. If sheet name contains "90" or "127" or parent file is Vertical → vertical parser
5. Otherwise → standard_matrix parser

### 8. Unit Tests

Create test cases (can use Vitest or just manual verification scripts):

For each of the 6 Shademaster XLS files:
- Parse successfully without errors
- Verify row count matches expected (from TECHNICAL_DESIGN.md §1)
- Verify width/drop ranges look reasonable
- Spot-check specific prices against source XLS
- Verify no NaN or undefined values in output

Specific edge case tests:
- Standard matrix: "D R O P" text in column 0 is ignored
- Standard matrix: VALANCE row parsed separately
- Extras: max width detection (empty cells = limit)
- Mechanisms: returns text values, not numbers
- Vertical: non-uniform width increments preserved
- Vertical 90mm: handles 907×94 sheet without timeout or memory issues

---

## Acceptance Criteria

```
✅ All 5 parser modules created and exported
✅ Main orchestrator auto-detects correct parser per sheet
✅ All 6 Shademaster XLS files parse successfully
✅ Standard matrix: widths and drops extracted correctly, prices are valid numbers
✅ Standard matrix: "D R O P" text ignored, VALANCE row separated
✅ Extras: each accessory parsed with name, pricing type, max width
✅ Mechanisms: all width × drop → tube_size mappings extracted
✅ Motorisation: tube cost + all motor options parsed with brand/model
✅ Vertical: non-uniform width increments + slat counts preserved
✅ Vertical 90mm (907×94): parses within reasonable time (<5s)
✅ No NaN, undefined, or null values in price data
✅ Spot-check 10 random prices across different files — all match source XLS
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- The Shademaster XLS files are located in the project directory — they'll be provided as test data
- Use `xlsx` (SheetJS) for reading: `XLSX.read(buffer, { type: 'array' })` then `XLSX.utils.sheet_to_json(sheet, { header: 1 })` for raw 2D array access
- Prices in the XLS are in ZAR as floats (e.g., 313.74) — convert to cents (integer) during import, not during parsing. The parser returns raw floats.
- The parser is a pure function — no database interaction. Database writes happen in Build 09 (Seed Data Import).
- Performance matters for the 90mm vertical sheet — consider streaming or chunked processing if needed
- All parser outputs should be strongly typed with TypeScript interfaces
