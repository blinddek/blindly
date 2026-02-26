import { createClient } from "@/lib/supabase/server";
import type { AvailableGrid } from "@/types/blinds";

/**
 * Get available width/drop grid for a blind range.
 * Used by the configurator to show min/max dimensions and validate input.
 */
export async function getAvailableGrid(
  blindRangeId: string
): Promise<AvailableGrid> {
  const supabase = await createClient();

  const [{ data: widthRows }, { data: dropRows }] = await Promise.all([
    supabase
      .from("price_matrices")
      .select("width_cm")
      .eq("blind_range_id", blindRangeId)
      .order("width_cm"),
    supabase
      .from("price_matrices")
      .select("drop_cm")
      .eq("blind_range_id", blindRangeId)
      .order("drop_cm"),
  ]);

  const widths = [
    ...new Set((widthRows ?? []).map((r) => Number(r.width_cm))),
  ].sort((a, b) => a - b);
  const drops = [
    ...new Set((dropRows ?? []).map((r) => Number(r.drop_cm))),
  ].sort((a, b) => a - b);

  return {
    widths,
    drops,
    min_width_cm: widths[0] ?? 0,
    max_width_cm: widths[widths.length - 1] ?? 0,
    min_drop_cm: drops[0] ?? 0,
    max_drop_cm: drops[drops.length - 1] ?? 0,
  };
}
