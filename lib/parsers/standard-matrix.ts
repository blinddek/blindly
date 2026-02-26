import type { StandardMatrixResult } from "@/types/blinds";
import type { WorkSheet } from "xlsx";
import * as XLSX from "xlsx";

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

  // 1. Find the width header row — a row with multiple sequential numbers
  let headerRowIdx = -1;
  let widths: number[] = [];
  let widthStartCol = -1;

  for (let r = 0; r < Math.min(raw.length, 15); r++) {
    const row = raw[r];
    if (!row) continue;

    const numericCols: { col: number; val: number }[] = [];
    for (let c = 0; c < row.length; c++) {
      const val = parseFloat(String(row[c] ?? ""));
      if (!isNaN(val) && val >= 20 && val <= 1000) {
        numericCols.push({ col: c, val });
      }
    }

    // Width headers have 5+ sequential increasing numbers
    if (numericCols.length >= 5) {
      let isSequential = true;
      for (let i = 1; i < numericCols.length; i++) {
        if (numericCols[i].val <= numericCols[i - 1].val) {
          isSequential = false;
          break;
        }
      }
      if (isSequential) {
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
      drops: [],
      prices: [],
      valance_prices: null,
      row_count: 0,
      col_count: 0,
      total_prices: 0,
    };
  }

  // 2. Parse data rows (drop values + prices)
  const drops: number[] = [];
  const prices: number[][] = [];
  let valancePrices: number[] | null = null;

  for (let r = headerRowIdx + 1; r < raw.length; r++) {
    const row = raw[r];
    if (!row || row.length === 0) continue;

    // Skip "D R O P" text columns — single letters in column 0
    const cell0 = String(row[0] ?? "").trim();
    if (cell0.length === 1 && /^[A-Z]$/i.test(cell0)) continue;

    // Check for VALANCE row
    const rowText = row
      .slice(0, widthStartCol)
      .map((c) => String(c ?? "").toLowerCase())
      .join(" ");
    if (rowText.includes("valance")) {
      const vPrices: number[] = [];
      for (let c = widthStartCol; c < widthStartCol + widths.length; c++) {
        const val = parseFloat(String(row[c] ?? ""));
        vPrices.push(isNaN(val) ? 0 : val);
      }
      valancePrices = vPrices;
      continue;
    }

    // Find drop value — first numeric cell before widthStartCol, or at widthStartCol - 1
    let dropVal: number | null = null;
    for (let c = widthStartCol - 1; c >= 0; c--) {
      const val = parseFloat(String(row[c] ?? ""));
      if (!isNaN(val) && val >= 20 && val <= 1000) {
        dropVal = val;
        break;
      }
    }

    if (dropVal === null) continue;

    // Parse prices for this row
    const rowPrices: number[] = [];
    for (let c = widthStartCol; c < widthStartCol + widths.length; c++) {
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
    drops,
    prices,
    valance_prices: valancePrices,
    row_count: drops.length,
    col_count: widths.length,
    total_prices: totalPrices,
  };
}
