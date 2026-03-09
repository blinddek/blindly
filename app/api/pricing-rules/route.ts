import { NextResponse } from "next/server";
import { getInstallationPricing, getVolumeDiscounts, getCourierPricing } from "@/lib/pricing-rules";

/** GET /api/pricing-rules — public, returns all rule sets */
export async function GET() {
  try {
    const [installation_pricing, volume_discounts, courier_pricing] = await Promise.all([
      getInstallationPricing(),
      getVolumeDiscounts(),
      getCourierPricing(),
    ]);
    return NextResponse.json({ installation_pricing, volume_discounts, courier_pricing });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load rules";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
