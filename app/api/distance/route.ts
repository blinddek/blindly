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
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Request body must be a JSON object" }, { status: 400 });
  }

  // Coordinates are numbers, address parts are strings; anything else is the client's fault, not a
  // TypeError inside roadDistanceKm or a string in the OSRM URL (walk round 5 F5).
  const parts = [body.address, body.city, body.province, body.postal_code];
  if ("lat" in body || "lng" in body) {
    if (typeof body.lat !== "number" || typeof body.lng !== "number" || !Number.isFinite(body.lat) || !Number.isFinite(body.lng)) {
      return NextResponse.json({ error: "lat and lng must be numbers" }, { status: 400 });
    }
  } else if (parts.some((p) => p != null && typeof p !== "string")) {
    return NextResponse.json({ error: "address, city, province and postal_code must be text" }, { status: 400 });
  }

  const result =
    typeof body.lat === "number" && typeof body.lng === "number"
      ? await roadDistanceKm({ lat: body.lat, lng: body.lng })
      : await roadDistanceKm({ address: body.address, city: body.city, province: body.province, postal_code: body.postal_code });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ distance_km: result.distance_km });
}
