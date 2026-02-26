import type { VerticalResult } from "@/types/blinds";
import type { WorkSheet } from "xlsx";
import * as XLSX from "xlsx";

/**
 * Parses Vertical Blind sheets (127mm and 90mm variants).
 * Layout: width values (non-uniform increments) in header row,
 * slat counts in next row, then standard price grid.
 * 90mm sheets can be very large (907×94).
 */
export function parseVertical(
  sheet: WorkSheet,
  sheetName: string
): VerticalResult {
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Find width header row — non-uniform increments (56, 67, 78... for 127mm)
  let headerRowIdx = -1;
  let widths: number[] = [];
  let widthStartCol = -1;

  for (let r = 0; r < Math.min(raw.length, 10); r++) {
    const row = raw[r];
    if (!row) continue;

    const numericCols: { col: number; val: number }[] = [];
    for (let c = 0; c < row.length; c++) {
      const val = parseFloat(String(row[c] ?? ""));
      if (!isNaN(val) && val >= 20 && val <= 1200) {
        numericCols.push({ col: c, val });
      }
    }

    // Vertical widths have 5+ increasing numbers (non-uniform OK)
    if (numericCols.length >= 5) {
      let isIncreasing = true;
      for (let i = 1; i < numericCols.length; i++) {
        if (numericCols[i].val <= numericCols[i - 1].val) {
          isIncreasing = false;
          break;
        }
      }
      if (isIncreasing) {
        headerRowIdx = r;
        widthStartCol = numericCols[0].col;
        widths = numericCols.map((n) => n.val);
        break;
      }
    }
  }

  if (headerRowIdx === -1) {
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

  // Next row after widths should be slat counts
  const slatCounts: number[] = [];
  const slatRow = raw[headerRowIdx + 1];
  if (slatRow) {
    for (let i = 0; i < widths.length; i++) {
      const c = widthStartCol + i;
      const val = parseInt(String(slatRow[c] ?? ""), 10);
      slatCounts.push(isNaN(val) ? 0 : val);
    }
  }

  // Parse price grid starting after slat row
  const drops: number[] = [];
  const prices: number[][] = [];
  const dataStartRow = slatCounts.length > 0 ? headerRowIdx + 2 : headerRowIdx + 1;

  for (let r = dataStartRow; r < raw.length; r++) {
    const row = raw[r];
    if (!row || row.length === 0) continue;

    // Find drop value
    let dropVal: number | null = null;
    for (let c = widthStartCol - 1; c >= 0; c--) {
      const val = parseFloat(String(row[c] ?? ""));
      if (!isNaN(val) && val >= 20) {
        dropVal = val;
        break;
      }
    }
    if (dropVal === null) continue;

    const rowPrices: number[] = [];
    for (let i = 0; i < widths.length; i++) {
      const c = widthStartCol + i;
      const val = parseFloat(String(row[c] ?? ""));
      rowPrices.push(isNaN(val) ? 0 : val);
    }

    drops.push(dropVal);
    prices.push(rowPrices);
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
