"use server";

import { createClient } from "@/lib/supabase/server";
import { parseWorkbook } from "@/lib/parsers/workbook";
import type {
  ParseResult,
  SheetResult,
  StandardMatrixResult,
  ExtrasResult,
  MechanismsResult,
  MotorisationResult,
  VerticalResult,
  SheetMappingOverride,
} from "@/types/blinds";
import { revalidatePath } from "next/cache";

// ─── Types ─────────────────────────────────────────────────

export interface ImportSummary {
  filename: string;
  sheets_processed: number;
  prices_created: number;
  prices_updated: number;
  prices_unchanged: number;
  extras_synced: number;
  mechanisms_synced: number;
  motors_synced: number;
  products_synced: number;
  errors: string[];
}

interface UpsertStats {
  created: number;
  updated: number;
  unchanged: number;
}

// ─── Main Import Flow ──────────────────────────────────────

/**
 * Parse an XLS buffer and import all data into the database.
 * This is the main entry point called from the API route / server action.
 *
 * @param buffer - Raw XLS/XLSX file buffer
 * @param filename - Original filename
 * @param supplier - Supplier slug (e.g. "shademaster")
 * @param overrides - Optional client-supplied sheet→range mappings from the UI
 */
export async function importPriceSheet(
  buffer: ArrayBuffer,
  filename: string,
  supplier = "shademaster",
  overrides?: SheetMappingOverride[]
): Promise<ImportSummary> {
  const parseResult = parseWorkbook(buffer, filename);
  const importResult = await importParsedData(parseResult, supplier, overrides);
  const productCount = await syncShopProducts();

  // Save overrides as templates for next time
  if (overrides && overrides.length > 0) {
    await saveOverridesAsTemplates(supplier, overrides);
  }

  // Record import in audit table
  const supabase = await createClient();
  await supabase.from("price_imports").insert({
    filename,
    supplier,
    sheets_processed: importResult.sheets_processed,
    prices_created: importResult.prices_created,
    prices_updated: importResult.prices_updated,
    prices_unchanged: importResult.prices_unchanged,
    import_mode: "update_changed",
    error_log:
      importResult.errors.length > 0
        ? { errors: importResult.errors }
        : null,
  });

  revalidatePath("/shop");
  revalidatePath("/configure");
  revalidatePath("/admin");

  return { ...importResult, products_synced: productCount };
}

// ─── Import Parsed Data ────────────────────────────────────

/**
 * Takes a ParseResult from the parser and upserts data into the database.
 * Uses overrides first, then falls back to saved import_mappings.
 */
async function importParsedData(
  parseResult: ParseResult,
  supplier: string,
  overrides?: SheetMappingOverride[]
): Promise<Omit<ImportSummary, "products_synced">> {
  const supabase = await createClient();
  const errors: string[] = [...parseResult.summary.errors];
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalUnchanged = 0;
  let extrasSynced = 0;
  let mechanismsSynced = 0;
  let motorsSynced = 0;

  // Build override lookup
  const overrideMap = new Map(
    overrides?.map((o) => [o.sheet_name, o]) ?? []
  );

  for (const sheet of parseResult.sheets) {
    try {
      const override = overrideMap.get(sheet.sheet_name);

      // Skip if override says skip
      if (override?.skip) continue;

      // Resolve mapping: override first, then DB lookup
      let rangeIds: string[] = (override?.maps_to_range_ids ?? []).filter(Boolean);
      if (rangeIds.length === 0) {
        const { data: mapping } = await supabase
          .from("import_mappings")
          .select("maps_to_range_id, parser_type")
          .eq("supplier", supplier)
          .eq("sheet_name", sheet.sheet_name)
          .eq("is_active", true)
          .single();
        if (mapping?.maps_to_range_id) {
          rangeIds = [mapping.maps_to_range_id];
        }
      }

      // Import into each mapped range (supports shared price matrices)
      for (const rangeId of rangeIds.length > 0 ? rangeIds : [null]) {
        const stats = await importSheet(sheet, rangeId, errors);
        totalCreated += stats.created;
        totalUpdated += stats.updated;
        totalUnchanged += stats.unchanged;
        extrasSynced += stats.extrasSynced;
        mechanismsSynced += stats.mechanismsSynced;
        motorsSynced += stats.motorsSynced;
      }
    } catch (err) {
      errors.push(
        `Error importing "${sheet.sheet_name}": ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return {
    filename: parseResult.filename,
    sheets_processed: parseResult.sheets.length,
    prices_created: totalCreated,
    prices_updated: totalUpdated,
    prices_unchanged: totalUnchanged,
    extras_synced: extrasSynced,
    mechanisms_synced: mechanismsSynced,
    motors_synced: motorsSynced,
    errors,
  };
}

// ─── Sheet Dispatcher ──────────────────────────────────────

interface SheetImportResult {
  created: number;
  updated: number;
  unchanged: number;
  extrasSynced: number;
  mechanismsSynced: number;
  motorsSynced: number;
}

/** Dispatch a single sheet to its appropriate upsert handler. */
async function importSheet(
  sheet: SheetResult,
  rangeId: string | null,
  errors: string[]
): Promise<SheetImportResult> {
  const result: SheetImportResult = {
    created: 0, updated: 0, unchanged: 0,
    extrasSynced: 0, mechanismsSynced: 0, motorsSynced: 0,
  };

  switch (sheet.detected_parser) {
    case "standard_matrix": {
      if (!rangeId) {
        errors.push(
          `No mapping for sheet "${sheet.sheet_name}" — skipped price matrix import`
        );
        break;
      }
      const stats = await upsertPriceMatrix(
        rangeId,
        sheet.data as StandardMatrixResult
      );
      result.created = stats.created;
      result.updated = stats.updated;
      result.unchanged = stats.unchanged;
      break;
    }
    case "extras": {
      result.extrasSynced = await upsertExtras(sheet.data as ExtrasResult);
      break;
    }
    case "mechanisms": {
      result.mechanismsSynced = await upsertMechanisms(
        sheet.data as MechanismsResult
      );
      break;
    }
    case "motorisation": {
      result.motorsSynced = await upsertMotorisation(
        sheet.data as MotorisationResult
      );
      break;
    }
    case "vertical": {
      if (!rangeId) {
        errors.push(
          `No mapping for vertical sheet "${sheet.sheet_name}" — skipped`
        );
        break;
      }
      const stats = await upsertVertical(
        rangeId,
        sheet as SheetResult & { data: VerticalResult }
      );
      result.created = stats.created;
      result.updated = stats.updated;
      result.unchanged = stats.unchanged;
      break;
    }
  }

  return result;
}

// ─── Save Overrides as Templates ───────────────────────────

/** Persist client-supplied overrides into import_mappings for reuse. */
async function saveOverridesAsTemplates(
  supplier: string,
  overrides: SheetMappingOverride[]
): Promise<void> {
  const supabase = await createClient();
  for (const o of overrides) {
    if (o.skip) continue;
    await supabase.from("import_mappings").upsert(
      {
        supplier,
        sheet_name: o.sheet_name,
        parser_type: o.parser_type,
        maps_to_range_id: o.maps_to_range_ids[0] ?? null,
        is_active: true,
      },
      { onConflict: "supplier,sheet_name" }
    );
  }
}

// ─── Upsert Helpers ────────────────────────────────────────

/** Upsert standard width×drop price matrix for a range. */
async function upsertPriceMatrix(
  rangeId: string,
  data: StandardMatrixResult
): Promise<UpsertStats> {
  const supabase = await createClient();
  let created = 0;

  const rows: {
    blind_range_id: string;
    width_cm: number;
    drop_cm: number;
    supplier_price_cents: number;
  }[] = [];

  for (let d = 0; d < data.drops.length; d++) {
    for (let w = 0; w < data.widths.length; w++) {
      const price = data.prices[d]?.[w];
      if (!price || price <= 0) continue;
      rows.push({
        blind_range_id: rangeId,
        width_cm: data.widths[w],
        drop_cm: data.drops[d],
        supplier_price_cents: Math.round(price * 100),
      });
    }
  }

  // Deduplicate — last occurrence wins (same width×drop for same range)
  const deduped = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    deduped.set(`${row.blind_range_id}:${row.width_cm}:${row.drop_cm}`, row);
  }
  const uniqueRows = [...deduped.values()];

  for (let i = 0; i < uniqueRows.length; i += 500) {
    const chunk = uniqueRows.slice(i, i + 500);
    const { data: result, error } = await supabase
      .from("price_matrices")
      .upsert(chunk, {
        onConflict: "blind_range_id,width_cm,drop_cm",
        ignoreDuplicates: false,
      })
      .select("id");

    if (error) {
      throw new Error(`Price matrix upsert failed: ${error.message}`);
    }
    created += result?.length ?? 0;
  }

  return { created, updated: 0, unchanged: 0 };
}

/** Upsert extras pricing from the extras sheet. */
async function upsertExtras(data: ExtrasResult): Promise<number> {
  const supabase = await createClient();
  let count = 0;

  for (const item of data.items) {
    const slug = item.name
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, "-")
      .replaceAll(/(^-)|(-$)/g, "");

    const { data: extra } = await supabase
      .from("blind_extras")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!extra) continue;

    if (item.pricing_type === "fixed" && item.prices[0]) {
      await supabase
        .from("blind_extras")
        .update({ fixed_price_cents: Math.round(item.prices[0] * 100) })
        .eq("id", extra.id);
      count++;
    } else {
      const points = item.widths.map((w, i) => ({
        extra_id: extra.id,
        width_cm: w,
        price_cents: Math.round(item.prices[i] * 100),
      }));

      await supabase
        .from("extra_price_points")
        .upsert(points, { onConflict: "extra_id,width_cm" });
      count += points.length;
    }
  }
  return count;
}

/** Upsert mechanism/tube lookup data. */
async function upsertMechanisms(data: MechanismsResult): Promise<number> {
  const supabase = await createClient();
  const rows = data.entries.map((e) => ({
    width_cm: e.width_cm,
    drop_cm: e.drop_cm,
    tube_size: e.tube_size,
  }));

  if (rows.length === 0) return 0;

  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    await supabase
      .from("mechanism_lookup")
      .upsert(chunk, { onConflict: "width_cm,drop_cm" });
  }
  return rows.length;
}

/** Upsert motorisation options and prices. */
async function upsertMotorisation(data: MotorisationResult): Promise<number> {
  const supabase = await createClient();
  let count = 0;

  for (const motor of data.motors) {
    const { data: motorRow } = await supabase
      .from("motorisation_options")
      .upsert(
        {
          brand: motor.brand,
          model: motor.model,
          is_rechargeable: motor.is_rechargeable,
        },
        { onConflict: "brand,model" }
      )
      .select("id")
      .single();

    if (!motorRow) continue;

    const priceRows = motor.widths.map((w, i) => ({
      motor_id: motorRow.id,
      width_cm: w,
      price_cents: Math.round(motor.prices[i] * 100),
    }));

    await supabase
      .from("motorisation_prices")
      .upsert(priceRows, { onConflict: "motor_id,width_cm" });

    count += priceRows.length;
  }
  return count;
}

/** Upsert vertical blind price matrix + slat count mapping. */
async function upsertVertical(
  rangeId: string,
  sheet: SheetResult & { data: VerticalResult }
): Promise<UpsertStats> {
  const supabase = await createClient();
  const data = sheet.data;

  const { data: range } = await supabase
    .from("blind_ranges")
    .select("blind_type_id")
    .eq("id", rangeId)
    .single();

  if (range && data.slat_counts.length > 0) {
    const slatRows = data.widths.map((w, i) => ({
      blind_type_id: range.blind_type_id,
      width_cm: w,
      slat_count: data.slat_counts[i] ?? 0,
    }));

    await supabase
      .from("vertical_slat_mapping")
      .upsert(slatRows, { onConflict: "blind_type_id,width_cm" });
  }

  return upsertPriceMatrix(rangeId, {
    sheet_name: data.sheet_name,
    widths: data.widths,
    drops: data.drops,
    prices: data.prices,
    valance_prices: null,
    row_count: data.row_count,
    col_count: data.col_count,
    total_prices: data.total_prices,
  });
}

// ─── Sync Shop Products ────────────────────────────────────

/** Build slug from a colour name. */
function colourSlug(name: string): string {
  return name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-)|(-$)/g, "");
}

/**
 * Regenerate products table from blind_ranges × colour_options.
 * Updates starting_price_cents on ranges from price_matrices.
 * Returns count of products synced.
 */
export async function syncShopProducts(): Promise<number> {
  const supabase = await createClient();
  let count = 0;

  const { data: ranges } = await supabase
    .from("blind_ranges")
    .select(
      `
      id, name, slug, description, colour_options,
      blind_type_id,
      blind_types!inner (
        slug,
        blind_categories!inner ( slug )
      )
    `
    )
    .eq("is_active", true);

  if (!ranges) return 0;

  const { data: productCats } = await supabase
    .from("product_categories")
    .select("id, slug");

  const catMap = new Map(productCats?.map((c) => [c.slug, c.id]) ?? []);

  const blindCatToProductCat: Record<string, string> = {
    roller: "roller",
    "aluminium-venetian": "aluminium-venetian",
    "wood-venetian": "wood-venetian",
    vertical: "vertical",
  };

  for (const range of ranges) {
    const blindType = range.blind_types as unknown as {
      slug: string;
      blind_categories: { slug: string };
    };
    const productCatId = catMap.get(
      blindCatToProductCat[blindType.blind_categories.slug] ?? ""
    );
    if (!productCatId) continue;

    const minPrice = await getMinPrice(supabase, range.id);
    if (minPrice) {
      const startingPrice = Math.round(minPrice * 1.4);
      await supabase
        .from("blind_ranges")
        .update({ starting_price_cents: startingPrice })
        .eq("id", range.id);
    }

    await upsertProductsForRange(supabase, range, productCatId, minPrice);
    const colours = (range.colour_options ?? []) as { name: string; hex: string }[];
    count += colours.length;
  }

  revalidatePath("/shop");
  return count;
}

/** Get minimum supplier price for a range. */
async function getMinPrice(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rangeId: string
): Promise<number | null> {
  const { data } = await supabase
    .from("price_matrices")
    .select("supplier_price_cents")
    .eq("blind_range_id", rangeId)
    .order("supplier_price_cents", { ascending: true })
    .limit(1)
    .single();
  return data?.supplier_price_cents ?? null;
}

/** Upsert products for all colours in a range. */
async function upsertProductsForRange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  range: { id: string; name: string; slug: string; description: string | null; colour_options: unknown },
  productCatId: string,
  minPrice: number | null
): Promise<void> {
  const colours = (range.colour_options ?? []) as { name: string; hex: string }[];
  const fromPrice = minPrice ? Math.round(minPrice * 1.4) : 0;

  for (const colour of colours) {
    const productSlug = `${range.slug}-${colourSlug(colour.name)}`;
    const productName = `${range.name} — ${colour.name}`;

    await supabase.from("products").upsert(
      {
        name: { en: productName },
        slug: productSlug,
        description: range.description
          ? { en: range.description }
          : { en: "" },
        price_cents: fromPrice,
        images: [],
        category_id: productCatId,
        stock_quantity: 999,
        is_active: true,
      },
      { onConflict: "slug" }
    );
  }
}
