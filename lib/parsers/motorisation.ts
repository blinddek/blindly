import type { MotorisationResult } from "@/types/blinds";
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

/** Extract the label from cells before widthStartCol. */
function extractLabel(row: unknown[], widthStartCol: number): string {
  const parts: string[] = [];
  for (let c = 0; c < widthStartCol; c++) {
    const cell = String(row[c] ?? "").trim();
    if (cell) parts.push(cell);
  }
  return parts.join(" ").trim();
}

/** Extract prices and their corresponding widths from a row. */
function extractRowPrices(
  row: unknown[],
  widths: number[],
  widthStartCol: number
): { rowWidths: number[]; rowPrices: number[] } {
  const rowWidths: number[] = [];
  const rowPrices: number[] = [];
  for (let i = 0; i < widths.length; i++) {
    const c = widthStartCol + i;
    const val = Number.parseFloat(String(row[c] ?? ""));
    if (!Number.isNaN(val) && val > 0) {
      rowWidths.push(widths[i]);
      rowPrices.push(val);
    }
  }
  return { rowWidths, rowPrices };
}

/** Parse motor brand/model from a label string. */
function parseMotorLabel(label: string): {
  brand: string;
  model: string;
  is_rechargeable: boolean;
} {
  const labelLower = label.toLowerCase();
  const isRechargeable =
    labelLower.includes("li") ||
    labelLower.includes("rechargeable") ||
    labelLower.includes("battery");

  const parts = label.split(/\s+/);
  let brand = parts[0] ?? label;
  let model = parts.slice(1).join(" ") || label;

  const knownBrands = ["somfy", "one touch", "onetouch"];
  for (const kb of knownBrands) {
    if (labelLower.startsWith(kb)) {
      brand = label.slice(0, kb.length);
      model = label.slice(kb.length).trim() || label;
      break;
    }
  }

  return { brand, model, is_rechargeable: isRechargeable };
}

/**
 * Parses the "Motorisation" sheet from Roller Blind price list.
 * Layout: width headers in top row, multiple motor options as row groups,
 * plus a separate tube cost row.
 */
export function parseMotorisation(sheet: WorkSheet): MotorisationResult {
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const header = findWidthHeaders(raw);
  if (!header) {
    return { tube_cost: { widths: [], prices: [] }, motors: [] };
  }

  const { headerRowIdx, widths, widthStartCol } = header;
  const motors: MotorisationResult["motors"] = [];
  let tubeCost: MotorisationResult["tube_cost"] = { widths: [], prices: [] };

  for (let r = headerRowIdx + 1; r < raw.length; r++) {
    const row = raw[r];
    if (!row || row.length === 0) continue;

    const label = extractLabel(row, widthStartCol);
    if (!label) continue;

    const { rowWidths, rowPrices } = extractRowPrices(row, widths, widthStartCol);
    // Require at least 2 prices — note/description rows typically hit only 1 cell by coincidence
    if (rowPrices.length < 2) continue;

    const labelLower = label.toLowerCase();
    // Skip obvious note rows (long sentences, no motor keyword)
    const isNote =
      label.length > 60 ||
      labelLower.includes("refer") ||
      labelLower.includes("example") ||
      labelLower.includes("specify") ||
      labelLower.includes("ordered separately") ||
      labelLower.includes("electrical lead") ||
      labelLower.includes("reveal width");
    if (isNote) continue;

    if (labelLower.includes("tube") && !labelLower.includes("motor")) {
      tubeCost = { widths: rowWidths, prices: rowPrices };
      continue;
    }

    const motor = parseMotorLabel(label);
    motors.push({ ...motor, widths: rowWidths, prices: rowPrices });
  }

  return { tube_cost: tubeCost, motors };
}
