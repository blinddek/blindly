import type { VerticalResult } from "@/types/blinds";
import type { WorkSheet } from "xlsx";
import * as XLSX from "xlsx";

interface WidthHeader {
  headerRowIdx: number;
  widths: number[];
  widthStartCol: number;
}

/** Check if numeric columns are strictly increasing. */
function isStrictlyIncreasing(cols: { val: number }[]): boolean {
  for (let i = 1; i < cols.length; i++) {
    if (cols[i].val <= cols[i - 1].val) return false;
  }
  return true;
}

/** Find the width header row — 5+ increasing numbers (20–1200). */
function findWidthHeaders(raw: unknown[][]): WidthHeader | null {
  for (let r = 0; r < Math.min(raw.length, 10); r++) {
    const row = raw[r];
    if (!row) continue;

    const numericCols: { col: number; val: number }[] = [];
    for (let c = 0; c < row.length; c++) {
      const val = Number.parseFloat(String(row[c] ?? ""));
      if (!Number.isNaN(val) && val >= 20 && val <= 1200) {
        numericCols.push({ col: c, val });
      }
    }

    if (numericCols.length >= 5 && isStrictlyIncreasing(numericCols)) {
      return {
        headerRowIdx: r,
        widthStartCol: numericCols[0].col,
        widths: numericCols.map((n) => n.val),
      };
    }
  }
  return null;
}

/** Extract slat counts from the row immediately after the width header. */
function extractSlatCounts(
  raw: unknown[][],
  headerRowIdx: number,
  widths: number[],
  widthStartCol: number
): number[] {
  const slatRow = raw[headerRowIdx + 1];
  if (!slatRow) return [];

  const counts: number[] = [];
  for (let i = 0; i < widths.length; i++) {
    const c = widthStartCol + i;
    const val = Number.parseInt(String(slatRow[c] ?? ""), 10);
    counts.push(Number.isNaN(val) ? 0 : val);
  }
  return counts;
}

/** Find the drop value in a row by scanning leftward from widthStartCol. */
function findDropValue(
  row: unknown[],
  widthStartCol: number
): number | null {
  for (let c = widthStartCol - 1; c >= 0; c--) {
    const val = Number.parseFloat(String(row[c] ?? ""));
    if (!Number.isNaN(val) && val >= 20) {
      return val;
    }
  }
  return null;
}

/** Extract prices from a row at the given width column positions. */
function extractRowPrices(
  row: unknown[],
  widthStartCol: number,
  count: number
): number[] {
  const prices: number[] = [];
  for (let c = widthStartCol; c < widthStartCol + count; c++) {
    const val = Number.parseFloat(String(row[c] ?? ""));
    prices.push(Number.isNaN(val) ? 0 : val);
  }
  return prices;
}

/**
 * Parses Vertical Blind sheets (127mm and 90mm variants).
 * Layout: width values (non-uniform increments) in header row,
 * slat counts in next row, then standard price grid.
 * 90mm sheets can be very large (907x94).
 */
export function parseVertical(
  sheet: WorkSheet,
  sheetName: string
): VerticalResult {
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const header = findWidthHeaders(raw);
  if (!header) {
    return {
      sheet_name: sheetName,
      widths: [],
      slat_counts: [],
      drops: [],
      prices: [],
      row_count: 0,
      col_count: 0,
      total_prices: 0,
    };
  }

  const { headerRowIdx, widths, widthStartCol } = header;
  const slatCounts = extractSlatCounts(raw, headerRowIdx, widths, widthStartCol);

  const drops: number[] = [];
  const prices: number[][] = [];
  const dataStartRow = slatCounts.length > 0 ? headerRowIdx + 2 : headerRowIdx + 1;

  for (let r = dataStartRow; r < raw.length; r++) {
    const row = raw[r];
    if (!row || row.length === 0) continue;

    const dropVal = findDropValue(row, widthStartCol);
    if (dropVal === null) continue;

    drops.push(dropVal);
    prices.push(extractRowPrices(row, widthStartCol, widths.length));
  }

  const totalPrices = prices.reduce(
    (sum, row) => sum + row.filter((p) => p > 0).length,
    0
  );

  return {
    sheet_name: sheetName,
    widths,
    slat_counts: slatCounts,
    drops,
    prices,
    row_count: drops.length,
    col_count: widths.length,
    total_prices: totalPrices,
  };
}
