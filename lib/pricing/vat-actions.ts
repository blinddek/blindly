"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureAdmin } from "@/lib/admin/auth";
import { parseVatPercent } from "./vat";

/** Settings → Finance: set the one VAT rate, `site_settings.vat_percent` (G-13). */
export async function updateVatPercent(percent: number): Promise<{ error?: string }> {
  await ensureAdmin();
  const pct = parseVatPercent(percent);
  if (pct == null) return { error: "VAT must be a number from 0 to 100." };
  const { data, error } = await createAdminClient()
    .from("site_settings")
    .update({ value: String(pct) })
    .eq("key", "vat_percent")
    .select("key");
  if (error) return { error: error.message };
  // An update that matched no row is not a save (walk round 5 F6).
  if (!data?.length) return { error: "The vat_percent setting row is missing; nothing was saved." };
  revalidatePath("/admin/settings");
  return {};
}
