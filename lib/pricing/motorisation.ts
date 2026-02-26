import { createClient } from "@/lib/supabase/server";
import type { MotorOptionWithPrice } from "@/types/blinds";

/**
 * Get motorisation options for a given blind width × drop.
 * Checks tube size compatibility via mechanism_lookup.
 */
export async function getMotorOptions(
  widthCm: number,
  dropCm: number
): Promise<MotorOptionWithPrice[]> {
  const supabase = await createClient();

  // Look up required tube size for this width × drop
  const { data: mechanism } = await supabase
    .from("mechanism_lookup")
    .select("tube_size")
    .eq("width_cm", widthCm)
    .eq("drop_cm", dropCm)
    .single();

  // If no exact match, find nearest (round up width, round up drop)
  let requiredTubeSize: string | null = mechanism?.tube_size ?? null;

  if (!requiredTubeSize) {
    // Find nearest mechanism entry
    const { data: nearestMech } = await supabase
      .from("mechanism_lookup")
      .select("tube_size")
      .gte("width_cm", widthCm)
      .gte("drop_cm", dropCm)
      .order("width_cm")
      .order("drop_cm")
      .limit(1);

    requiredTubeSize = nearestMech?.[0]?.tube_size ?? null;
  }

  // Fetch all active motor options
  const { data: motors } = await supabase
    .from("motorisation_options")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  if (!motors) return [];

  const results: MotorOptionWithPrice[] = [];

  // Map tube size text to numeric mm for comparison
  const tubeSizeToMm: Record<string, number> = {
    "32": 32,
    "40": 40,
    "45": 45,
    "45HD": 45,
    "55 + EL": 55,
  };

  const requiredTubeMm = requiredTubeSize
    ? tubeSizeToMm[requiredTubeSize] ?? 32
    : 32;

  for (const motor of motors) {
    const motorTubeMm = motor.tube_size_mm ?? 0;
    const compatible = motorTubeMm <= requiredTubeMm;

    // Look up width-based price
    const { data: priceRow } = await supabase
      .from("motorisation_prices")
      .select("price_cents")
      .eq("motor_id", motor.id)
      .gte("width_cm", widthCm)
      .order("width_cm")
      .limit(1);

    const priceCents = priceRow?.[0]?.price_cents ?? 0;

    results.push({
      id: motor.id,
      brand: motor.brand,
      model: motor.model,
      is_rechargeable: motor.is_rechargeable,
      price_cents: priceCents,
      compatible,
      incompatible_reason: compatible
        ? undefined
        : `Requires ${motorTubeMm}mm tube, but this blind needs ${requiredTubeSize} (${requiredTubeMm}mm)`,
    });
  }

  // Sort: compatible first, then by price
  results.sort((a, b) => {
    if (a.compatible !== b.compatible) return a.compatible ? -1 : 1;
    return a.price_cents - b.price_cents;
  });

  return results;
}
