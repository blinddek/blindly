"use server";

import { createClient } from "@/lib/supabase/server";
import { parseForPreview } from "@/lib/parsers/preview";
import { importPriceSheet } from "@/lib/blinds/import";
import type {
  Supplier,
  ImportMapping,
  ParsePreview,
  SheetMappingOverride,
} from "@/types/blinds";
import type { ImportSummary } from "@/lib/blinds/import";

// ─── Suppliers ─────────────────────────────────────────────

export async function getSuppliers(): Promise<Supplier[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("suppliers")
    .select("*")
    .order("name");
  return (data ?? []) as Supplier[];
}

export async function createSupplier(
  name: string,
  slug: string,
  notes?: string
): Promise<Supplier> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .insert({ name, slug, notes: notes ?? null })
    .select()
    .single();

  if (error) throw new Error(`Failed to create supplier: ${error.message}`);
  return data as Supplier;
}

export async function updateSupplier(
  id: string,
  updates: Partial<Pick<Supplier, "name" | "slug" | "notes" | "is_active">>
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("suppliers")
    .update(updates)
    .eq("id", id);
  if (error) throw new Error(`Failed to update supplier: ${error.message}`);
}

export async function deleteSupplier(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("suppliers")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw new Error(`Failed to delete supplier: ${error.message}`);
}

// ─── Parse Preview ─────────────────────────────────────────

export async function parseUploadedFile(
  formData: FormData,
  supplier: string
): Promise<ParsePreview> {
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    throw new Error("No file provided");
  }
  const buffer = await file.arrayBuffer();
  return parseForPreview(buffer, file.name, supplier);
}

// ─── Mappings ──────────────────────────────────────────────

export async function getMappingsForSupplier(
  supplier: string
): Promise<ImportMapping[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("import_mappings")
    .select("*")
    .eq("supplier", supplier)
    .order("sheet_name");
  return (data ?? []) as ImportMapping[];
}

export async function saveMappings(
  supplier: string,
  mappings: { sheet_name: string; parser_type: string; maps_to_range_id: string | null; is_active: boolean }[]
): Promise<void> {
  const supabase = await createClient();
  for (const m of mappings) {
    await supabase.from("import_mappings").upsert(
      {
        supplier,
        sheet_name: m.sheet_name,
        parser_type: m.parser_type,
        maps_to_range_id: m.maps_to_range_id,
        is_active: m.is_active,
      },
      { onConflict: "supplier,sheet_name" }
    );
  }
}

export async function deleteMapping(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("import_mappings").delete().eq("id", id);
}

// ─── Import ────────────────────────────────────────────────

export async function executeImport(
  formData: FormData,
  supplier: string,
  overrides: SheetMappingOverride[]
): Promise<ImportSummary> {
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    throw new Error("No file provided");
  }
  const buffer = await file.arrayBuffer();
  return importPriceSheet(buffer, file.name, supplier, overrides);
}

// ─── Import History ────────────────────────────────────────

export interface ImportHistoryEntry {
  id: string;
  filename: string;
  supplier: string;
  sheets_processed: number;
  prices_created: number;
  prices_updated: number;
  prices_unchanged: number;
  import_mode: string;
  error_log: { errors: string[] } | null;
  created_at: string;
}

export async function getImportHistory(
  limit = 20
): Promise<ImportHistoryEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("price_imports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as ImportHistoryEntry[];
}
