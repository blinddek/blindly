import type { VerticalResult } from "@/types/blinds";
import type { WorkSheet } from "xlsx";
import * as XLSX from "xlsx";

interface WidthHeader {
  headerRowIdx: number;
  widths: number[];
  widthStartCol: number;
}

interface MatrixBlock {
  widths: number[];
  slatCounts: number[];
  drops: number[];
  prices: number[][];
}

/** Check if numeric columns are strictly increasing. */
function isStrictlyIncreasing(cols: { val: number }[]): boolean {
  for (let i = 1; i < cols.length; i++) {
    if (cols[i].val <= cols[i - 1].val) return false;
  }
  return true;
}

/**
 * Find ALL width header rows in the sheet.
 * Width headers are identified by a "Width" text label in the row
 * combined with 5+ strictly increasing numbers in the 20–1200 range.
 */
function findAllWidthHeaders(raw: unknown[][]): WidthHeader[] {
  const headers: WidthHeader[] = [];
  for (let r = 0; r < raw.length; r++) {
    const row = raw[r];
    if (!row) continue;

    const hasWidthLabel = row.some(
      (cell) => typeof cell === "string" && /\bwidth\b/i.test(String(cell))
    );
    if (!hasWidthLabel) continue;

    const numericCols: { col: number; val: number }[] = [];
    for (let c = 0; c < row.length; c++) {
      const val = Number.parseFloat(String(row[c] ?? ""));
      if (!Number.isNaN(val) && val >= 20 && val <= 1200) {
        numericCols.push({ col: c, val });
      }
    }

    if (numericCols.length >= 5 && isStrictlyIncreasing(numericCols)) {
      headers.push({
        headerRowIdx: r,
        widthStartCol: numericCols[0].col,
        widths: numericCols.map((n) => n.val),
      });
    }
  }
  return headers;
}

/**
 * Fallback: find the first width header row in the first 10 rows.
 * Used when no "Width"-labelled headers are found (backward compat).
 */
function findFirstWidthHeader(raw: unknown[][]): WidthHeader | null {
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
    if (!Number.isNaN(val) && val >= 20 && val <= 400) {
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

/** Parse a single matrix block between its header and the next header (or sheet end). */
function parseBlock(
  raw: unknown[][],
  header: WidthHeader,
  endRow: number
): MatrixBlock {
  const slatCounts = extractSlatCounts(
    raw,
    header.headerRowIdx,
    header.widths,
    header.widthStartCol
  );
  const dataStartRow =
    slatCounts.length > 0 ? header.headerRowIdx + 2 : header.headerRowIdx + 1;

  const drops: number[] = [];
  const prices: number[][] = [];

  for (let r = dataStartRow; r < endRow; r++) {
    const row = raw[r];
    if (!row || row.length === 0) continue;

    const dropVal = findDropValue(row, header.widthStartCol);
    if (dropVal === null) continue;

    // Drops must be strictly increasing within a block — stop if not
    if (drops.length > 0 && dropVal <= drops[drops.length - 1]) break;

    drops.push(dropVal);
    prices.push(
      extractRowPrices(row, header.widthStartCol, header.widths.length)
    );
  }

  return { widths: header.widths, slatCounts, drops, prices };
}

/** Merge multiple stacked matrix blocks into one VerticalResult. */
function mergeBlocks(
  blocks: MatrixBlock[],
  sheetName: string
): VerticalResult {
  if (blocks.length === 0) return emptyResult(sheetName);

  // Collect all unique drops across blocks, sorted
  const dropSet = new Set<number>();
  for (const block of blocks) {
    for (const d of block.drops) dropSet.add(d);
  }
  const drops = [...dropSet].sort((a, b) => a - b);

  // Concatenate widths and slat counts from all blocks
  const widths: number[] = [];
  const slatCounts: number[] = [];
  for (const block of blocks) {
    widths.push(...block.widths);
    slatCounts.push(...block.slatCounts);
  }

  // Build merged price grid: for each drop, concatenate prices from all blocks
  const prices: number[][] = [];
  for (const drop of drops) {
    const row: number[] = [];
    for (const block of blocks) {
      const dropIdx = block.drops.indexOf(drop);
      if (dropIdx >= 0) {
        row.push(...block.prices[dropIdx]);
      } else {
        // This drop doesn't exist in this block — fill with zeros
        row.push(...new Array(block.widths.length).fill(0));
      }
    }
    prices.push(row);
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

function emptyResult(sheetName: string): VerticalResult {
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

/**
 * Parses Vertical Blind sheets (127mm and 90mm variants).
 * Handles sheets with multiple stacked price matrices (different width ranges
 * sharing the same drops), which is the standard Shademaster format.
 */
export function parseVertical(
  sheet: WorkSheet,
  sheetName: string
): VerticalResult {
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Find all width headers (rows with "Width" label + 5+ increasing numbers)
  let headers = findAllWidthHeaders(raw);

  // Fallback: if no "Width"-labelled headers found, try original first-10-rows logic
  if (headers.length === 0) {
    const fallback = findFirstWidthHeader(raw);
    if (!fallback) return emptyResult(sheetName);
    headers = [fallback];
  }

  // Parse each matrix block
  const blocks: MatrixBlock[] = [];
  for (let h = 0; h < headers.length; h++) {
    const endRow =
      h + 1 < headers.length ? headers[h + 1].headerRowIdx : raw.length;
    const block = parseBlock(raw, headers[h], endRow);
    if (block.drops.length > 0) {
      blocks.push(block);
    }
  }

  return mergeBlocks(blocks, sheetName);
}
