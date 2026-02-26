import type { MotorisationResult } from "@/types/blinds";
import type { WorkSheet } from "xlsx";
import * as XLSX from "xlsx";

/**
 * Parses the "Motorisation" sheet from Roller Blind price list.
 * Layout: width headers in top row, multiple motor options as row groups,
 * plus a separate tube cost row.
 */
export function parseMotorisation(sheet: WorkSheet): MotorisationResult {
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
    return { tube_cost: { widths: [], prices: [] }, motors: [] };
  }

  const motors: MotorisationResult["motors"] = [];
  let tubeCost: MotorisationResult["tube_cost"] = {
    widths: [],
    prices: [],
  };

  for (let r = headerRowIdx + 1; r < raw.length; r++) {
    const row = raw[r];
    if (!row || row.length === 0) continue;

    // Get label from cells before width columns
    const labelParts: string[] = [];
    for (let c = 0; c < widthStartCol; c++) {
      const cell = String(row[c] ?? "").trim();
      if (cell) labelParts.push(cell);
    }
    const label = labelParts.join(" ").trim();
    if (!label) continue;

    // Extract prices per width
    const rowWidths: number[] = [];
    const rowPrices: number[] = [];
    for (let i = 0; i < widths.length; i++) {
      const c = widthStartCol + i;
      const val = parseFloat(String(row[c] ?? ""));
      if (!isNaN(val) && val > 0) {
        rowWidths.push(widths[i]);
        rowPrices.push(val);
      }
    }

    if (rowPrices.length === 0) continue;

    const labelLower = label.toLowerCase();

    // Detect tube cost row
    if (labelLower.includes("tube") && !labelLower.includes("motor")) {
      tubeCost = { widths: rowWidths, prices: rowPrices };
      continue;
    }

    // Parse motor brand/model from label
    const isRechargeable =
      labelLower.includes("li") ||
      labelLower.includes("rechargeable") ||
      labelLower.includes("battery");

    // Try to split "Brand Model" from label
    // Common patterns: "One Touch 1.8Nm Li", "Somfy Optuo 40 3/30"
    const parts = label.split(/\s+/);
    let brand = parts[0] ?? label;
    let model = parts.slice(1).join(" ") || label;

    // Known brands
    const knownBrands = ["somfy", "one touch", "onetouch"];
    for (const kb of knownBrands) {
      if (labelLower.startsWith(kb)) {
        brand = label.slice(0, kb.length);
        model = label.slice(kb.length).trim() || label;
        break;
      }
    }

    motors.push({
      brand,
      model,
      is_rechargeable: isRechargeable,
      widths: rowWidths,
      prices: rowPrices,
    });
  }

  return { tube_cost: tubeCost, motors };
}
