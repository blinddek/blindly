import type { MechanismsResult } from "@/types/blinds";
import type { WorkSheet } from "xlsx";
import * as XLSX from "xlsx";

interface WidthHeader {
  headerRowIdx: number;
  widths: number[];
  widthStartCol: number;
}

/** Find the width header row — a row with 5+ sequential numbers (20–500). */
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

    if (numericCols.length >= 5) {
      return {
        headerRowIdx: r,
        widthStartCol: numericCols[0].col,
        widths: numericCols.map((n) => n.val),
      };
    }
  }
  return null;
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

/** Extract tube sizes from a row at the width column positions. */
function extractTubeSizes(
  row: unknown[],
  widths: number[],
  widthStartCol: number,
  dropCm: number
): MechanismsResult["entries"] {
  const entries: MechanismsResult["entries"] = [];
  for (let i = 0; i < widths.length; i++) {
    const c = widthStartCol + i;
    const cellVal = String(row[c] ?? "").trim();
    if (cellVal) {
      entries.push({
        width_cm: widths[i],
        drop_cm: dropCm,
        tube_size: cellVal,
      });
    }
  }
  return entries;
}

/**
 * Parses the "Mechanisms and tubes" sheet from Roller Blind price list.
 * Layout: width headers in top row, drop values in first column,
 * cell values are tube size designations (text), NOT prices.
 */
export function parseMechanisms(sheet: WorkSheet): MechanismsResult {
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const header = findWidthHeaders(raw);
  if (!header) {
    return { entries: [] };
  }

  const { headerRowIdx, widths, widthStartCol } = header;
  const entries: MechanismsResult["entries"] = [];

  for (let r = headerRowIdx + 1; r < raw.length; r++) {
    const row = raw[r];
    if (!row || row.length === 0) continue;

    const dropCm = findDropValue(row, widthStartCol);
    if (dropCm === null) continue;

    entries.push(...extractTubeSizes(row, widths, widthStartCol, dropCm));
  }

  return { entries };
}
