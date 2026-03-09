import { NextRequest, NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/cms/queries";

/**
 * POST /api/distance
 * Geocodes a customer delivery address and returns the road distance (km)
 * from the business location using:
 *   - OpenStreetMap Nominatim for geocoding (free, no key)
 *   - OSRM for road routing (free, no key)
 *
 * Body: { address: string; city: string; province: string; postal_code: string }
 * Response: { distance_km: number } | { error: string }
 */
export async function POST(req: NextRequest) {
  let body: {
    address?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    lat?: number;
    lng?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── 1. Business coordinates ───────────────────────────────────────────────
  const settings = await getSiteSettings();
  const coordsStr = (settings as unknown as Record<string, string>).coordinates;
  if (!coordsStr) {
    return NextResponse.json({ error: "Business coordinates not configured in Site Settings" }, { status: 500 });
  }

  const [latStr, lngStr] = coordsStr.split(",").map((s: string) => s.trim());
  const bizLat = Number.parseFloat(latStr);
  const bizLng = Number.parseFloat(lngStr);

  if (Number.isNaN(bizLat) || Number.isNaN(bizLng)) {
    return NextResponse.json({ error: "Invalid business coordinates in Site Settings" }, { status: 500 });
  }

  // ── 2. Customer coordinates — use supplied lat/lng or geocode via Nominatim ─
  let custLat: number;
  let custLng: number;

  if (body.lat != null && body.lng != null) {
    // Coordinates already resolved by the autocomplete on the client — skip geocoding.
    custLat = body.lat;
    custLng = body.lng;
  } else {
    const { address, city, province, postal_code } = body;
    if (!address || !city) {
      return NextResponse.json({ error: "Address and city are required" }, { status: 400 });
    }

    const nominatimHeaders = {
      "User-Agent": "Blindly-App/1.0 (contact@blindly.co.za)",
      "Accept-Language": "en",
    };

    async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=za`;
      const res = await fetch(url, { headers: nominatimHeaders });
      const data = await res.json() as { lat?: string; lon?: string }[];
      if (!data.length || !data[0].lat || !data[0].lon) return null;
      return { lat: Number.parseFloat(data[0].lat), lng: Number.parseFloat(data[0].lon) };
    }

    try {
      // Try progressively broader queries until one resolves
      const fullQuery = [address, city, province, postal_code, "South Africa"].filter(Boolean).join(", ");
      const cityProvinceQuery = [city, province, "South Africa"].filter(Boolean).join(", ");
      const cityOnlyQuery = [city, "South Africa"].filter(Boolean).join(", ");

      const coords =
        (await geocode(fullQuery)) ??
        (await geocode(cityProvinceQuery)) ??
        (await geocode(cityOnlyQuery));

      if (!coords) {
        return NextResponse.json(
          { error: "Address not found. Please check the city name or enter distance manually." },
          { status: 422 }
        );
      }

      custLat = coords.lat;
      custLng = coords.lng;
    } catch {
      return NextResponse.json({ error: "Geocoding service unavailable. Please enter distance manually." }, { status: 503 });
    }
  }

  // ── 3. Road distance via OSRM ─────────────────────────────────────────────
  // OSRM expects: /route/v1/driving/{lon1},{lat1};{lon2},{lat2}
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${bizLng},${bizLat};${custLng},${custLat}?overview=false`;

  try {
    const routeRes = await fetch(osrmUrl, {
      headers: { "User-Agent": "Blindly-App/1.0" },
    });
    const routeData = await routeRes.json() as {
      code?: string;
      routes?: { distance: number }[];
    };

    if (routeData.code !== "Ok" || !routeData.routes?.length) {
      return NextResponse.json(
        { error: "Could not calculate route. Please enter distance manually." },
        { status: 422 }
      );
    }

    const distanceKm = Math.ceil(routeData.routes[0].distance / 1000); // metres → km, round up
    return NextResponse.json({ distance_km: distanceKm });
  } catch {
    return NextResponse.json({ error: "Routing service unavailable. Please enter distance manually." }, { status: 503 });
  }
}
