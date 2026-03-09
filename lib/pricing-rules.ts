import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_INSTALLATION_PRICING,
  DEFAULT_VOLUME_DISCOUNTS,
  DEFAULT_COURIER_PRICING,
  type InstallationPricing,
  type VolumeDiscounts,
  type CourierPricing,
} from "@/types/pricing-rules";

export async function getInstallationPricing(): Promise<InstallationPricing> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_content")
    .select("content")
    .eq("section_key", "installation_pricing")
    .single();
  return (data?.content as InstallationPricing) ?? DEFAULT_INSTALLATION_PRICING;
}

export async function getVolumeDiscounts(): Promise<VolumeDiscounts> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_content")
    .select("content")
    .eq("section_key", "volume_discounts")
    .single();
  return (data?.content as VolumeDiscounts) ?? DEFAULT_VOLUME_DISCOUNTS;
}

export async function getCourierPricing(): Promise<CourierPricing> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_content")
    .select("content")
    .eq("section_key", "courier_pricing")
    .single();
  return (data?.content as CourierPricing) ?? DEFAULT_COURIER_PRICING;
}
