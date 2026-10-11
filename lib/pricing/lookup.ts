import { createAdminClient } from "@/lib/supabase/admin";
import { resolveMarkup } from "./markup";
import type { PriceLookupInput, PriceLookupResult } from "@/types/blinds";
import { PriceInputError, readOrThrow } from "./errors";
import { getVatPercent } from "./vat";

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
  // The request bodies are unvalidated JSON. A non-numeric dimension divides to NaN, which passes
  // both range comparisons below and prices at the largest grid point; a fractional one prices but
  // fails the INTEGER order-item insert as a 500. Refuse both here, as a 400 at either route.
  for (const [name, mm] of [["Width", input.width_mm], ["Drop", input.drop_mm]] as const) {
    if (typeof mm !== "number" || !Number.isInteger(mm) || mm <= 0) {
      throw new PriceInputError(`${name} must be a positive whole number of millimetres`);
    }
  }

  const supabase = createAdminClient();

  const widthCm = input.width_mm / 10;
  const dropCm = input.drop_mm / 10;

  // Fetch available grid points for this range
  const [{ data: widthRows, error: widthError }, { data: dropRows, error: dropError }] = await Promise.all([
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

  // A failed read is a fault, not "no prices for this range".
  const readError = widthError ?? dropError;
  if (readError) throw new Error(`price grid read failed: ${readError.message}`);

  // Deduplicate
  const availableWidths = [
    ...new Set((widthRows ?? []).map((r) => Number(r.width_cm))),
  ].sort((a, b) => a - b);
  const availableDrops = [
    ...new Set((dropRows ?? []).map((r) => Number(r.drop_cm))),
  ].sort((a, b) => a - b);

  if (availableWidths.length === 0 || availableDrops.length === 0) {
    throw new PriceInputError("No price data available for this range");
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
    throw new PriceInputError(
      `Width ${input.width_mm}mm is outside available range (${minW * 10}mm – ${maxW * 10}mm)`
    );
  }
  if (dropCm < minD || dropCm > maxD) {
    throw new PriceInputError(
      `Drop ${input.drop_mm}mm is outside available range (${minD * 10}mm – ${maxD * 10}mm)`
    );
  }

  // Lookup supplier price
  const { data: priceRow, error: priceError } = await supabase
    .from("price_matrices")
    .select("supplier_price_cents")
    .eq("blind_range_id", input.blind_range_id)
    .eq("width_cm", matchedWidth)
    .eq("drop_cm", matchedDrop)
    .single();

  if (priceError && priceError.code !== "PGRST116") throw new Error(`price read failed: ${priceError.message}`);
  if (!priceRow) {
    throw new PriceInputError(
      `No price found for ${matchedWidth}cm × ${matchedDrop}cm in this range`
    );
  }

  const supplierPriceCents = priceRow.supplier_price_cents;

  // Resolve markup
  const { markup_percent } = await resolveMarkup(input.blind_range_id);

  // Calculate customer price
  const markupCents = Math.round(supplierPriceCents * (markup_percent / 100));
  const customerPriceCents = supplierPriceCents + markupCents;

  // The one VAT rate (G-13); returned with the price so the order's extras are taxed at it too.
  const vatPercent = await getVatPercent();
  const vatCents = Math.round(customerPriceCents * (vatPercent / 100));

  return {
    supplier_price_cents: supplierPriceCents,
    markup_percent: markup_percent,
    markup_cents: markupCents,
    customer_price_cents: customerPriceCents,
    matched_width_cm: matchedWidth,
    matched_drop_cm: matchedDrop,
    vat_percent: vatPercent,
    vat_cents: vatCents,
    total_with_vat_cents: customerPriceCents + vatCents,
  };
}
