import type { StandardMatrixResult } from "@/types/blinds";
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

/** Find the width header row — a row with 5+ sequential increasing numbers. */
function findWidthHeaders(raw: unknown[][]): WidthHeader | null {
  for (let r = 0; r < Math.min(raw.length, 15); r++) {
    const row = raw[r];
    if (!row) continue;

    const numericCols: { col: number; val: number }[] = [];
    for (let c = 0; c < row.length; c++) {
      const val = Number.parseFloat(String(row[c] ?? ""));
      if (!Number.isNaN(val) && val >= 20 && val <= 1000) {
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

/** Find the drop value in a row by scanning leftward from widthStartCol. */
function findDropValue(
  row: unknown[],
  widthStartCol: number
): number | null {
  for (let c = widthStartCol - 1; c >= 0; c--) {
    const val = Number.parseFloat(String(row[c] ?? ""));
    if (!Number.isNaN(val) && val >= 20 && val <= 1000) {
      return val;
    }
  }
  return null;
}

/** Check if a row is a "VALANCE" pricing row. */
function isValanceRow(row: unknown[], widthStartCol: number): boolean {
  return row
    .slice(0, widthStartCol)
    .map((c) => String(c ?? "").toLowerCase())
    .join(" ")
    .includes("valance");
}

/**
 * Parses standard price matrix sheets (Venetian + most Roller ranges).
 * Layout: width headers in a top row, drop values in first numeric column,
 * price grid in the body. Handles "D R O P" text in column 0 and VALANCE rows.
 */
export function parseStandardMatrix(
  sheet: WorkSheet,
  sheetName: string
): StandardMatrixResult {
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const header = findWidthHeaders(raw);
  if (!header) {
    return {
      sheet_name: sheetName,
      widths: [],
      drops: [],
      prices: [],
      valance_prices: null,
      row_count: 0,
      col_count: 0,
      total_prices: 0,
    };
  }

  const { headerRowIdx, widths, widthStartCol } = header;
  const drops: number[] = [];
  const prices: number[][] = [];
  let valancePrices: number[] | null = null;

  for (let r = headerRowIdx + 1; r < raw.length; r++) {
    const row = raw[r];
    if (!row || row.length === 0) continue;

    // Skip "D R O P" text columns — single letters in column 0
    const cell0 = String(row[0] ?? "").trim();
    if (cell0.length === 1 && /^[A-Z]$/i.test(cell0)) continue;

    if (isValanceRow(row, widthStartCol)) {
      valancePrices = extractRowPrices(row, widthStartCol, widths.length);
      continue;
    }

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
    drops,
    prices,
    valance_prices: valancePrices,
    row_count: drops.length,
    col_count: widths.length,
    total_prices: totalPrices,
  };
}
