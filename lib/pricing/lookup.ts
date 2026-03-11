import { createAdminClient } from "@/lib/supabase/admin";
import { resolveMarkup } from "./markup";
import type { PriceLookupInput, PriceLookupResult } from "@/types/blinds";

/**
 * Core price lookup: configuration → full price breakdown.
 *
 * 1. Convert mm → cm, find nearest grid point
 *    (round UP for outside mount, DOWN for inside mount)
 * 2. Lookup supplier_price_cents from price_matrices
 * 3. Resolve markup via cascade
 * 4. Calculate customer price + VAT
 */
export async function lookupPrice(
  input: PriceLookupInput
): Promise<PriceLookupResult> {
  const supabase = createAdminClient();

  const widthCm = input.width_mm / 10;
  const dropCm = input.drop_mm / 10;

  // Fetch available grid points for this range
  const [{ data: widthRows }, { data: dropRows }] = await Promise.all([
    supabase
      .from("price_matrices")
      .select("width_cm")
      .eq("blind_range_id", input.blind_range_id)
      .order("width_cm"),
    supabase
      .from("price_matrices")
      .select("drop_cm")
      .eq("blind_range_id", input.blind_range_id)
      .order("drop_cm"),
  ]);

  // Deduplicate
  const availableWidths = [
    ...new Set((widthRows ?? []).map((r) => Number(r.width_cm))),
  ].sort((a, b) => a - b);
  const availableDrops = [
    ...new Set((dropRows ?? []).map((r) => Number(r.drop_cm))),
  ].sort((a, b) => a - b);

  if (availableWidths.length === 0 || availableDrops.length === 0) {
    throw new Error("No price data available for this range");
  }

  // Find matched grid point based on mount type
  let matchedWidth: number;
  let matchedDrop: number;

  // Always round UP: supplier orders the next size up and cuts to fit
  matchedWidth = availableWidths.find((w) => w >= widthCm) ?? availableWidths.at(-1)!;
  matchedDrop = availableDrops.find((d) => d >= dropCm) ?? availableDrops.at(-1)!;

  // Validate dimensions are within range
  const minW = availableWidths[0];
  const maxW = availableWidths.at(-1)!;
  const minD = availableDrops[0];
  const maxD = availableDrops.at(-1)!;

  if (widthCm < minW || widthCm > maxW) {
    throw new Error(
      `Width ${input.width_mm}mm is outside available range (${minW * 10}mm – ${maxW * 10}mm)`
    );
  }
  if (dropCm < minD || dropCm > maxD) {
    throw new Error(
      `Drop ${input.drop_mm}mm is outside available range (${minD * 10}mm – ${maxD * 10}mm)`
    );
  }

  // Lookup supplier price
  const { data: priceRow } = await supabase
    .from("price_matrices")
    .select("supplier_price_cents")
    .eq("blind_range_id", input.blind_range_id)
    .eq("width_cm", matchedWidth)
    .eq("drop_cm", matchedDrop)
    .single();

  if (!priceRow) {
    throw new Error(
      `No price found for ${matchedWidth}cm × ${matchedDrop}cm in this range`
    );
  }

  const supplierPriceCents = priceRow.supplier_price_cents;

  // Resolve markup
  const { markup_percent } = await resolveMarkup(input.blind_range_id);

  // Calculate customer price
  const markupCents = Math.round(supplierPriceCents * (markup_percent / 100));
  const customerPriceCents = supplierPriceCents + markupCents;

  // Get VAT rate from settings
  const { data: vatSetting } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "vat_percent")
    .single();

  const vatPercent = vatSetting ? Number(vatSetting.value) : 15;
  const vatCents = Math.round(customerPriceCents * (vatPercent / 100));

  return {
    supplier_price_cents: supplierPriceCents,
    markup_percent: markup_percent,
    markup_cents: markupCents,
    customer_price_cents: customerPriceCents,
    matched_width_cm: matchedWidth,
    matched_drop_cm: matchedDrop,
    vat_cents: vatCents,
    total_with_vat_cents: customerPriceCents + vatCents,
  };
}
