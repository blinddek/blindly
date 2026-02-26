import * as XLSX from "xlsx";
import type { SheetPreview, ParsePreview, ImportMapping } from "@/types/blinds";
import { parseWorkbook } from "./workbook";
import { createClient } from "@/lib/supabase/server";

/** Extract a 5×5 sample data corner from a worksheet. */
function extractSampleData(sheet: XLSX.WorkSheet): unknown[][] {
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  return raw.slice(0, 5).map((row) => (row as unknown[]).slice(0, 5));
}

/**
 * Parse an uploaded workbook and return a preview of each sheet
 * with auto-detected parser type, stats, sample data, and any existing mappings.
 */
export async function parseForPreview(
  buffer: ArrayBuffer,
  filename: string,
  supplier: string
): Promise<ParsePreview> {
  const parseResult = parseWorkbook(buffer, filename);
  const workbook = XLSX.read(buffer, { type: "array" });

  // Load existing mappings for this supplier
  const supabase = await createClient();
  const { data: mappings } = await supabase
    .from("import_mappings")
    .select("*")
    .eq("supplier", supplier)
    .eq("is_active", true);

  const mappingMap = new Map<string, ImportMapping>(
    (mappings ?? []).map((m) => [m.sheet_name, m as ImportMapping])
  );

  const sheets: SheetPreview[] = parseResult.sheets.map((sheet) => {
    const worksheet = workbook.Sheets[sheet.sheet_name];
    const sampleData = worksheet ? extractSampleData(worksheet) : [];

    return {
      sheet_name: sheet.sheet_name,
      detected_parser: sheet.detected_parser,
      stats: sheet.stats,
      sample_data: sampleData,
      existing_mapping: mappingMap.get(sheet.sheet_name) ?? null,
    };
  });

  return {
    filename,
    sheets,
    errors: parseResult.summary.errors,
  };
}
