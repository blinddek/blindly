"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { ensureAdmin } from "@/lib/admin/auth";
import type { InstallationPricing, VolumeDiscounts } from "@/types/pricing-rules";

export async function saveInstallationPricing(data: InstallationPricing) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("site_content").upsert(
    { section_key: "installation_pricing", content: data as unknown as Record<string, unknown>, updated_at: new Date().toISOString() },
    { onConflict: "section_key" }
  );
  if (error) throw new Error(error.message);
}

export async function saveVolumeDiscounts(data: VolumeDiscounts) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("site_content").upsert(
    { section_key: "volume_discounts", content: data as unknown as Record<string, unknown>, updated_at: new Date().toISOString() },
    { onConflict: "section_key" }
  );
  if (error) throw new Error(error.message);
}
