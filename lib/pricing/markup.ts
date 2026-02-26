import { createClient } from "@/lib/supabase/server";

interface MarkupResult {
  markup_percent: number;
  source: "range" | "type" | "category" | "global";
}

/**
 * Resolve the effective markup for a blind range using the cascade:
 * 1. Range-specific markup
 * 2. Type-specific markup
 * 3. Category-specific markup
 * 4. Global fallback (always exists, seeded at 40%)
 */
export async function resolveMarkup(
  blindRangeId: string
): Promise<MarkupResult> {
  const supabase = await createClient();

  // Get the range → type → category chain
  const { data: range } = await supabase
    .from("blind_ranges")
    .select("id, blind_type_id")
    .eq("id", blindRangeId)
    .single();

  if (!range) {
    // Fallback to global if range not found
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
    return {
      markup_percent: Number(rangeMarkup.markup_percent),
      source: "range",
    };
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
      return {
        markup_percent: Number(typeMarkup.markup_percent),
        source: "type",
      };
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
      return {
        markup_percent: Number(catMarkup.markup_percent),
        source: "category",
      };
    }
  }

  return getGlobalMarkup();
}

async function getGlobalMarkup(): Promise<MarkupResult> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("markup_config")
    .select("markup_percent")
    .eq("scope_type", "global")
    .is("scope_id", null)
    .single();

  return {
    markup_percent: data ? Number(data.markup_percent) : 40,
    source: "global",
  };
}
