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

/**
 * Find the width header row — a row with 5+ sequential increasing numbers.
 * Accepts values 20–3000 to handle both cm and mm formats.
 * Searches up to the first 30 rows to handle files with title/logo rows.
 */
function findWidthHeaders(raw: unknown[][]): WidthHeader | null {
  for (let r = 0; r < Math.min(raw.length, 30); r++) {
    const row = raw[r];
    if (!row) continue;

    const numericCols: { col: number; val: number }[] = [];
    for (let c = 0; c < row.length; c++) {
      const val = Number.parseFloat(String(row[c] ?? ""));
      if (!Number.isNaN(val) && val >= 20 && val <= 3000) {
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
    if (!Number.isNaN(val) && val >= 20 && val <= 3000) {
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
 * Check if a row looks like a secondary width header (e.g. tube upgrade table).
 * Key distinction from price rows: header rows have NO drop value in the left columns,
 * while data rows always have a numeric drop. This avoids false positives on price rows
 * where values happen to be strictly increasing (wider blinds cost more).
 */
function isSecondaryHeader(row: unknown[], widthStartCol: number): boolean {
  // Data rows have a drop value — headers don't
  if (findDropValue(row, widthStartCol) !== null) return false;

  const numericCols: { val: number }[] = [];
  for (let c = widthStartCol; c < row.length; c++) {
    const val = Number.parseFloat(String(row[c] ?? ""));
    if (!Number.isNaN(val) && val >= 20 && val <= 3000) {
      numericCols.push({ val });
    }
  }
  return numericCols.length >= 5 && isStrictlyIncreasing(numericCols);
}

/** Check if the left-side text contains stop keywords (secondary tables). */
function isStopRow(row: unknown[], widthStartCol: number): boolean {
  const text = row
    .slice(0, widthStartCol)
    .map((c) => String(c ?? "").toLowerCase())
    .join(" ");
  return /\b(tube upgrade|recover deduction|width \(cm\))\b/.test(text);
}

/**
 * Detect if values are in millimeters and return a divisor.
 * Heuristic: if the smallest value > 200, values are in mm (no blind starts at 2m wide).
 */
function detectUnit(values: number[]): number {
  if (values.length === 0) return 1;
  return values[0] > 200 ? 10 : 1;
}

/**
 * Parses standard price matrix sheets (Venetian + most Roller ranges).
 * Layout: width headers in a top row, drop values in first numeric column,
 * price grid in the body. Handles VALANCE rows and stops at secondary
 * tables (tube upgrades, recover deductions).
 * Auto-detects mm vs cm and normalizes output to cm.
 */
export function parseStandardMatrix(
  sheet: WorkSheet,
  sheetName: string
): StandardMatrixResult {
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const header = findWidthHeaders(raw);
  if (!header) {
    const sampleRows = raw
      .slice(0, 10)
      .map(
        (row, i) =>
          `  row ${i}: ${(row as unknown[]).slice(0, 6).join(" | ")}`
      )
      .join("\n");

    throw new Error(
      `Could not find width header row in sheet "${sheetName}". ` +
        `Expected a row with 5+ increasing numbers (20–3000) within the first 30 rows.\n` +
        `First 10 rows:\n${sampleRows}`
    );
  }

  const { headerRowIdx, widthStartCol } = header;

  // Detect mm vs cm from the width values
  const unit = detectUnit(header.widths);
  const widths = header.widths.map((w) => Math.round(w / unit));

  const drops: number[] = [];
  const prices: number[][] = [];
  let valancePrices: number[] | null = null;

  for (let r = headerRowIdx + 1; r < raw.length; r++) {
    const row = raw[r];
    if (!row || row.length === 0) continue;

    // Stop at secondary tables (tube upgrade, recover deduction, etc.)
    if (isStopRow(row, widthStartCol)) break;
    if (isSecondaryHeader(row, widthStartCol)) break;

    if (isValanceRow(row, widthStartCol)) {
      valancePrices = extractRowPrices(row, widthStartCol, widths.length);
      continue;
    }

    const dropVal = findDropValue(row, widthStartCol);
    if (dropVal === null) continue;

    drops.push(Math.round(dropVal / unit));
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
