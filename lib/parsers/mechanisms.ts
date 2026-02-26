import type { MechanismsResult } from "@/types/blinds";
import type { WorkSheet } from "xlsx";
import * as XLSX from "xlsx";

/**
 * Parses the "Mechanisms and tubes" sheet from Roller Blind price list.
 * Layout: width headers in top row, drop values in first column,
 * cell values are tube size designations (text), NOT prices.
 */
export function parseMechanisms(sheet: WorkSheet): MechanismsResult {
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

    if (numericCols.length >= 5) {
      headerRowIdx = r;
      widthStartCol = numericCols[0].col;
      widths = numericCols.map((n) => n.val);
      break;
    }
  }

  if (headerRowIdx === -1) {
    return { entries: [] };
  }

  const entries: MechanismsResult["entries"] = [];

  for (let r = headerRowIdx + 1; r < raw.length; r++) {
    const row = raw[r];
    if (!row || row.length === 0) continue;

    // Find drop value
    let dropCm: number | null = null;
    for (let c = widthStartCol - 1; c >= 0; c--) {
      const val = parseFloat(String(row[c] ?? ""));
      if (!isNaN(val) && val >= 20) {
        dropCm = val;
        break;
      }
    }
    if (dropCm === null) continue;

    // Extract tube sizes per width
    for (let i = 0; i < widths.length; i++) {
      const c = widthStartCol + i;
      const cellVal = String(row[c] ?? "").trim();
      if (!cellVal) continue;

      entries.push({
        width_cm: widths[i],
        drop_cm: dropCm,
        tube_size: cellVal,
      });
    }
  }

  return { entries };
}
