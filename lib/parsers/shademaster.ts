import * as XLSX from "xlsx";
import { parseStandardMatrix } from "./standard-matrix";
import { parseExtras } from "./extras";
import { parseMechanisms } from "./mechanisms";
import { parseMotorisation } from "./motorisation";
import { parseVertical } from "./vertical";
import type { ParserType, SheetResult, ParseResult } from "@/types/blinds";

/**
 * Auto-detect which parser to use for a given sheet name.
 */
export function detectParser(
  sheetName: string,
  filename: string
): ParserType {
  const name = sheetName.toLowerCase();
  const file = filename.toLowerCase();

  if (name.includes("extra")) return "extras";
  if (name.includes("mechanism") || name.includes("tube")) return "mechanisms";
  if (name.includes("motor")) return "motorisation";
  if (
    name.includes("90") ||
    name.includes("127") ||
    file.includes("vertical")
  )
    return "vertical";
  return "standard_matrix";
}

/**
 * Parse a single sheet using the specified parser.
 */
function parseSheet(
  sheet: XLSX.WorkSheet,
  sheetName: string,
  parserType: ParserType
): SheetResult {
  switch (parserType) {
    case "extras": {
      const data = parseExtras(sheet);
      return {
        sheet_name: sheetName,
        detected_parser: "extras",
        data,
        stats: {
          rows: data.items.length,
          cols: data.items[0]?.widths.length ?? 0,
          prices: data.items.reduce((s, i) => s + i.prices.length, 0),
        },
      };
    }
    case "mechanisms": {
      const data = parseMechanisms(sheet);
      return {
        sheet_name: sheetName,
        detected_parser: "mechanisms",
        data,
        stats: {
          rows: data.entries.length,
          cols: 3,
          prices: data.entries.length,
        },
      };
    }
    case "motorisation": {
      const data = parseMotorisation(sheet);
      return {
        sheet_name: sheetName,
        detected_parser: "motorisation",
        data,
        stats: {
          rows: data.motors.length + 1,
          cols: data.tube_cost.widths.length,
          prices: data.motors.reduce((s, m) => s + m.prices.length, 0),
        },
      };
    }
    case "vertical": {
      const data = parseVertical(sheet, sheetName);
      return {
        sheet_name: sheetName,
        detected_parser: "vertical",
        data,
        stats: {
          rows: data.row_count,
          cols: data.col_count,
          prices: data.total_prices,
        },
      };
    }
    case "standard_matrix":
    default: {
      const data = parseStandardMatrix(sheet, sheetName);
      return {
        sheet_name: sheetName,
        detected_parser: "standard_matrix",
        data,
        stats: {
          rows: data.row_count,
          cols: data.col_count,
          prices: data.total_prices,
        },
      };
    }
  }
}

/**
 * Parse an entire Shademaster XLS/XLSX file.
 * Auto-detects the parser for each sheet based on sheet name and filename.
 */
export function parseShademasterFile(
  buffer: ArrayBuffer,
  filename: string
): ParseResult {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheets: SheetResult[] = [];
  const errors: string[] = [];
  let totalPrices = 0;

  for (const sheetName of workbook.SheetNames) {
    try {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) continue;

      const parserType = detectParser(sheetName, filename);
      const result = parseSheet(worksheet, sheetName, parserType);
      sheets.push(result);
      totalPrices += result.stats.prices;
    } catch (err) {
      errors.push(
        `Error parsing sheet "${sheetName}": ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return {
    filename,
    sheets,
    summary: {
      total_sheets: sheets.length,
      total_prices: totalPrices,
      errors,
    },
  };
}
