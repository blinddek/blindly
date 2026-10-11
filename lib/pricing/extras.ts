import { createClient } from "@/lib/supabase/server";
import type { ExtraWithPrice } from "@/types/blinds";

/**
 * Get all applicable extras for a blind configuration,
 * with resolved prices based on width.
 */
export async function getApplicableExtras(
  blindRangeId: string,
  widthCm: number
): Promise<ExtraWithPrice[]> {
  const supabase = await createClient();

  // Checkout prices from this list (lib/blinds/checkout-pricing.ts), so a failed read throws rather
  // than offering fewer extras or a price of 0. "No row" (PGRST116) is a genuinely unknown range.
  const { data: range, error: rangeError } = await supabase
    .from("blind_ranges")
    .select("blind_type_id")
    .eq("id", blindRangeId)
    .single();

  if (rangeError && rangeError.code !== "PGRST116") throw new Error(`range read failed: ${rangeError.message}`);
  if (!range) return [];

  const { data: type, error: typeError } = await supabase
    .from("blind_types")
    .select("id, category_id")
    .eq("id", range.blind_type_id)
    .single();

  if (typeError && typeError.code !== "PGRST116") throw new Error(`type read failed: ${typeError.message}`);
  if (!type) return [];

  // Fetch all active extras
  const { data: allExtras, error: extrasError } = await supabase
    .from("blind_extras")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  if (extrasError) throw new Error(`extras read failed: ${extrasError.message}`);
  if (!allExtras) return [];

  const results: ExtraWithPrice[] = [];

  for (const extra of allExtras) {
    // Filter by category
    if (
      extra.applies_to_categories &&
      extra.applies_to_categories.length > 0 &&
      !extra.applies_to_categories.includes(type.category_id)
    ) {
      continue;
    }

    // Filter by type
    if (
      extra.applies_to_types &&
      extra.applies_to_types.length > 0 &&
      !extra.applies_to_types.includes(type.id)
    ) {
      continue;
    }

    // Filter by max width
    if (extra.max_width_cm && widthCm > Number(extra.max_width_cm)) {
      continue;
    }

    // Resolve price
    const priceCents = await getExtraPrice(extra.id, extra.pricing_type, extra.fixed_price_cents, widthCm);
    // An extra with no price (a width-based extra with no price points, or an unknown pricing type)
    // is not offered — it would otherwise sell at R0.
    if (priceCents === null) continue;

    results.push({
      id: extra.id,
      name: extra.name,
      description: extra.description,
      pricing_type: extra.pricing_type,
      price_cents: priceCents,
      is_upgrade: extra.is_upgrade,
      replaces_extra_id: extra.replaces_extra_id ?? null,
    });
  }

  return results;
}

/**
 * Calculate price for a specific extra based on type and width.
 */
async function getExtraPrice(
  extraId: string,
  pricingType: string,
  fixedPriceCents: number | null,
  widthCm: number,
  quantity = 1
): Promise<number | null> {
  switch (pricingType) {
    case "fixed":
      return fixedPriceCents;

    case "per_unit":
      return fixedPriceCents == null ? null : fixedPriceCents * quantity;

    case "width_based": {
      const supabase = await createClient();
      // Find nearest width >= customer width
      const { data: pricePoints, error: pointsError } = await supabase
        .from("extra_price_points")
        .select("width_cm, price_cents")
        .eq("extra_id", extraId)
        .gte("width_cm", widthCm)
        .order("width_cm")
        .limit(1);

      if (pointsError) throw new Error(`extra price read failed: ${pointsError.message}`);
      if (pricePoints && pricePoints.length > 0) {
        return pricePoints[0].price_cents;
      }

      // If no width >= customer width, use the largest available
      const { data: maxPoint, error: maxError } = await supabase
        .from("extra_price_points")
        .select("price_cents")
        .eq("extra_id", extraId)
        .order("width_cm", { ascending: false })
        .limit(1);

      if (maxError) throw new Error(`extra price read failed: ${maxError.message}`);
      return maxPoint?.[0]?.price_cents ?? null;
    }

    default:
      return null;
  }
}
