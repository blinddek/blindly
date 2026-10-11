import { NextRequest, NextResponse } from "next/server";
import { roadDistanceKm } from "@/lib/distance";

/**
 * POST /api/distance — the road distance the checkout page SHOWS. Checkout pricing charges its own
 * `roadDistanceKm` from the delivery address text, so the page sends the address text when it has it.
 *
 * Body: { address: string; city: string; province: string; postal_code: string } | { lat; lng }
 * Response: { distance_km: number } | { error: string }
 */
export async function POST(req: NextRequest) {
  let body: { address?: string; city?: string; province?: string; postal_code?: string; lat?: number; lng?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result =
    typeof body.lat === "number" && typeof body.lng === "number"
      ? await roadDistanceKm({ lat: body.lat, lng: body.lng })
      : await roadDistanceKm(body);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ distance_km: result.distance_km });
}
