import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_INSTALLATION_PRICING,
  DEFAULT_VOLUME_DISCOUNTS,
  DEFAULT_COURIER_PRICING,
  type InstallationPricing,
  type VolumeDiscounts,
  type CourierPricing,
} from "@/types/pricing-rules";

// Checkout prices from these rules, so a failed read throws (the request answers 500) instead of
// pricing with the defaults; the quote and the checkout would otherwise disagree on a database blip.
// No row (PGRST116) is the deliberate "never configured" case and still uses the default.
async function readRule<T>(sectionKey: string, fallback: T): Promise<T> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("content")
    .eq("section_key", sectionKey)
    .single();
  if (error && error.code !== "PGRST116") throw new Error(`${sectionKey} read failed: ${error.message}`);
  return (data?.content as T) ?? fallback;
}

export function getInstallationPricing(): Promise<InstallationPricing> {
  return readRule("installation_pricing", DEFAULT_INSTALLATION_PRICING);
}

export function getVolumeDiscounts(): Promise<VolumeDiscounts> {
  return readRule("volume_discounts", DEFAULT_VOLUME_DISCOUNTS);
}

export function getCourierPricing(): Promise<CourierPricing> {
  return readRule("courier_pricing", DEFAULT_COURIER_PRICING);
}
