import type { ExtrasResult } from "@/types/blinds";
import type { WorkSheet } from "xlsx";
import * as XLSX from "xlsx";

/**
 * Parses the "Extras" sheet from Roller Blind price list.
 * Layout: width headers in a top row, each subsequent row is an accessory
 * with name and per-width prices.
 */
export function parseExtras(sheet: WorkSheet): ExtrasResult {
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Find width header row
  let headerRowIdx = -1;
  let widths: number[] = [];
  let widthStartCol = -1;

  for (let r = 0; r < Math.min(raw.length, 10); r++) {
    const row = raw[r];
    if (!row) continue;

    const numericCols: { col: number; val: number }[] = [];
    for (let c = 0; c < row.length; c++) {
      const val = parseFloat(String(row[c] ?? ""));
      if (!isNaN(val) && val >= 20 && val <= 500) {
        numericCols.push({ col: c, val });
      }
    }

    if (numericCols.length >= 3) {
      headerRowIdx = r;
      widthStartCol = numericCols[0].col;
      widths = numericCols.map((n) => n.val);
      break;
    }
  }

  if (headerRowIdx === -1) {
    return { items: [] };
  }

  const items: ExtrasResult["items"] = [];

  for (let r = headerRowIdx + 1; r < raw.length; r++) {
    const row = raw[r];
    if (!row || row.length === 0) continue;

    // Extract name from cells before width columns
    const nameParts: string[] = [];
    for (let c = 0; c < widthStartCol; c++) {
      const cell = String(row[c] ?? "").trim();
      if (cell) nameParts.push(cell);
    }
    const name = nameParts.join(" ").trim();
    if (!name) continue;

    // Extract prices per width
    const prices: number[] = [];
    const validWidths: number[] = [];
    let maxWidth: number | null = null;

    for (let i = 0; i < widths.length; i++) {
      const c = widthStartCol + i;
      const val = parseFloat(String(row[c] ?? ""));
      if (!isNaN(val) && val > 0) {
        validWidths.push(widths[i]);
        prices.push(val);
      } else if (prices.length > 0) {
        // Empty cell after valid prices = max width limit
        maxWidth = validWidths[validWidths.length - 1];
        break;
      }
    }

    if (prices.length === 0) continue;

    // Detect if fixed (all same price) or width_based
    const allSame = prices.every((p) => p === prices[0]);
    const pricingType = allSame ? ("fixed" as const) : ("width_based" as const);

    items.push({
      name,
      widths: validWidths,
      prices,
      max_width: maxWidth,
      pricing_type: pricingType,
    });
  }

  return { items };
}
