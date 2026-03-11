import { createAdminClient } from "@/lib/supabase/admin";

interface MarkupResult {
  markup_percent: number;
  source: "range" | "type" | "category" | "supplier" | "global";
}

/**
 * Resolve the effective markup for a blind range using the cascade:
 * 1. Range-specific markup
 * 2. Type-specific markup
 * 3. Category-specific markup
 * 4. Supplier-specific markup
 * 5. Global fallback (always exists, seeded at 40%)
 */
export async function resolveMarkup(
  blindRangeId: string
): Promise<MarkupResult> {
  const supabase = createAdminClient();

  // Get the range → type → category chain + supplier slug
  const { data: range } = await supabase
    .from("blind_ranges")
    .select("id, blind_type_id, supplier")
    .eq("id", blindRangeId)
    .single();

  if (!range) {
    return getGlobalMarkup();
  }

  // Check range-specific markup
  const { data: rangeMarkup } = await supabase
    .from("markup_config")
    .select("markup_percent")
    .eq("scope_type", "range")
    .eq("scope_id", blindRangeId)
    .eq("is_active", true)
    .single();

  if (rangeMarkup) {
    return { markup_percent: Number(rangeMarkup.markup_percent), source: "range" };
  }

  // Get type for the range
  const { data: type } = await supabase
    .from("blind_types")
    .select("id, category_id")
    .eq("id", range.blind_type_id)
    .single();

  if (type) {
    // Check type-specific markup
    const { data: typeMarkup } = await supabase
      .from("markup_config")
      .select("markup_percent")
      .eq("scope_type", "type")
      .eq("scope_id", type.id)
      .eq("is_active", true)
      .single();

    if (typeMarkup) {
      return { markup_percent: Number(typeMarkup.markup_percent), source: "type" };
    }

    // Check category-specific markup
    const { data: catMarkup } = await supabase
      .from("markup_config")
      .select("markup_percent")
      .eq("scope_type", "category")
      .eq("scope_id", type.category_id)
      .eq("is_active", true)
      .single();

    if (catMarkup) {
      return { markup_percent: Number(catMarkup.markup_percent), source: "category" };
    }
  }

  // Check supplier-specific markup (resolve slug → UUID)
  if (range.supplier) {
    const { data: supplierRow } = await supabase
      .from("suppliers")
      .select("id")
      .eq("slug", range.supplier)
      .eq("is_active", true)
      .single();

    if (supplierRow) {
      const { data: supplierMarkup } = await supabase
        .from("markup_config")
        .select("markup_percent")
        .eq("scope_type", "supplier")
        .eq("scope_id", supplierRow.id)
        .eq("is_active", true)
        .single();

      if (supplierMarkup) {
        return { markup_percent: Number(supplierMarkup.markup_percent), source: "supplier" };
      }
    }
  }

  return getGlobalMarkup();
}

async function getGlobalMarkup(): Promise<MarkupResult> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("markup_config")
    .select("markup_percent")
    .eq("scope_type", "global")
    .is("scope_id", null)
    .single();

  if (!data) {
    throw new Error("No global markup configured. Please set a global markup in the admin.");
  }

  return {
    markup_percent: Number(data.markup_percent),
    source: "global",
  };
}
