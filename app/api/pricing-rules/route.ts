import { NextResponse } from "next/server";
import { getInstallationPricing, getVolumeDiscounts } from "@/lib/pricing-rules";

/** GET /api/pricing-rules — public, returns both rule sets */
export async function GET() {
  try {
    const [installation_pricing, volume_discounts] = await Promise.all([
      getInstallationPricing(),
      getVolumeDiscounts(),
    ]);
    return NextResponse.json({ installation_pricing, volume_discounts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load rules";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
