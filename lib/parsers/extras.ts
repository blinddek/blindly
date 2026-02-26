import type { ExtrasResult } from "@/types/blinds";
import type { WorkSheet } from "xlsx";
import * as XLSX from "xlsx";

interface WidthHeader {
  headerRowIdx: number;
  widths: number[];
  widthStartCol: number;
}

/** Find the width header row — a row with 3+ sequential numbers (20–500). */
function findWidthHeaders(raw: unknown[][]): WidthHeader | null {
  for (let r = 0; r < Math.min(raw.length, 10); r++) {
    const row = raw[r];
    if (!row) continue;

    const numericCols: { col: number; val: number }[] = [];
    for (let c = 0; c < row.length; c++) {
      const val = Number.parseFloat(String(row[c] ?? ""));
      if (!Number.isNaN(val) && val >= 20 && val <= 500) {
        numericCols.push({ col: c, val });
      }
    }

    if (numericCols.length >= 3) {
      return {
        headerRowIdx: r,
        widthStartCol: numericCols[0].col,
        widths: numericCols.map((n) => n.val),
      };
    }
  }
  return null;
}

/** Extract the item name from cells before widthStartCol. */
function extractItemName(row: unknown[], widthStartCol: number): string {
  const parts: string[] = [];
  for (let c = 0; c < widthStartCol; c++) {
    const cell = String(row[c] ?? "").trim();
    if (cell) parts.push(cell);
  }
  return parts.join(" ").trim();
}

/** Extract prices and their corresponding widths from a row. */
function extractPricesForRow(
  row: unknown[],
  widths: number[],
  widthStartCol: number
): { validWidths: number[]; prices: number[]; maxWidth: number | null } {
  const prices: number[] = [];
  const validWidths: number[] = [];
  let maxWidth: number | null = null;

  for (let i = 0; i < widths.length; i++) {
    const c = widthStartCol + i;
    const val = Number.parseFloat(String(row[c] ?? ""));
    if (!Number.isNaN(val) && val > 0) {
      validWidths.push(widths[i]);
      prices.push(val);
    } else if (prices.length > 0) {
      maxWidth = validWidths[validWidths.length - 1];
      break;
    }
  }

  return { validWidths, prices, maxWidth };
}

/**
 * Parses the "Extras" sheet from Roller Blind price list.
 * Layout: width headers in a top row, each subsequent row is an accessory
 * with name and per-width prices.
 */
export function parseExtras(sheet: WorkSheet): ExtrasResult {
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const header = findWidthHeaders(raw);
  if (!header) {
    return { items: [] };
  }

  const { headerRowIdx, widths, widthStartCol } = header;
  const items: ExtrasResult["items"] = [];

  for (let r = headerRowIdx + 1; r < raw.length; r++) {
    const row = raw[r];
    if (!row || row.length === 0) continue;

    const name = extractItemName(row, widthStartCol);
    if (!name) continue;

    const { validWidths, prices, maxWidth } = extractPricesForRow(
      row,
      widths,
      widthStartCol
    );
    if (prices.length === 0) continue;

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
