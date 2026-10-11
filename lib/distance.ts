import { getSiteSettings } from "@/lib/cms/queries";

/**
 * Road distance (km, rounded up) from the business to a customer, using OpenStreetMap Nominatim for
 * geocoding and OSRM for routing (both free, no key). Shared by `/api/distance`, which the checkout
 * page shows, and by checkout pricing, which charges it — so both must ask with the same input.
 */
export type DistanceResult = { distance_km: number } | { error: string; status: number };

export interface AddressText {
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
}

const NOMINATIM_HEADERS = {
  "User-Agent": "Blindly-App/1.0 (contact@blindly.co.za)",
  "Accept-Language": "en",
};

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=za`;
  const res = await fetch(url, { headers: NOMINATIM_HEADERS });
  const data = (await res.json()) as { lat?: string; lon?: string }[];
  if (!data.length || !data[0].lat || !data[0].lon) return null;
  return { lat: Number.parseFloat(data[0].lat), lng: Number.parseFloat(data[0].lon) };
}

// Successful address lookups, per server instance. The review step's quote and the checkout that
// follows ask for the same address minutes apart; a warm instance answers the second from here
// instead of spending Nominatim's 1 request/second again, and cannot geocode it differently (a
// different distance would 409 the checkout). A cold instance simply asks again.
const CACHE_MS = 6 * 60 * 60 * 1000;
const CACHE_MAX = 500;
const cache = new Map<string, { km: number; at: number }>();

export async function roadDistanceKm(
  to: AddressText | { lat: number; lng: number }
): Promise<DistanceResult> {
  if ("lat" in to) return computeRoadDistanceKm(to);
  const key = [to.address, to.city, to.province, to.postal_code].map((s) => (s ?? "").trim().toLowerCase()).join("|");
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return { distance_km: hit.km };
  const result = await computeRoadDistanceKm(to);
  if ("distance_km" in result) {
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
    cache.set(key, { km: result.distance_km, at: Date.now() });
  }
  return result;
}

async function computeRoadDistanceKm(
  to: AddressText | { lat: number; lng: number }
): Promise<DistanceResult> {
  // ── 1. Business coordinates ───────────────────────────────────────────────
  const settings = await getSiteSettings();
  const coordsStr = (settings as unknown as Record<string, string>).coordinates;
  if (!coordsStr) return { error: "Business coordinates not configured in Site Settings", status: 500 };

  const [latStr, lngStr] = coordsStr.split(",").map((s: string) => s.trim());
  const bizLat = Number.parseFloat(latStr);
  const bizLng = Number.parseFloat(lngStr);
  if (Number.isNaN(bizLat) || Number.isNaN(bizLng)) {
    return { error: "Invalid business coordinates in Site Settings", status: 500 };
  }

  // ── 2. Customer coordinates — supplied, or geocoded from the address text ─
  let cust: { lat: number; lng: number };
  if ("lat" in to) {
    cust = to;
  } else {
    const { address, city, province, postal_code } = to;
    if (!address || !city) return { error: "Address and city are required", status: 400 };
    try {
      // Try progressively broader queries until one resolves
      const coords =
        (await geocode([address, city, province, postal_code, "South Africa"].filter(Boolean).join(", "))) ??
        (await geocode([city, province, "South Africa"].filter(Boolean).join(", "))) ??
        (await geocode([city, "South Africa"].filter(Boolean).join(", ")));
      if (!coords) return { error: "Address not found. Please check the street and city.", status: 422 };
      cust = coords;
    } catch {
      return { error: "Geocoding service unavailable. Please try again shortly.", status: 503 };
    }
  }

  // ── 3. Road distance via OSRM: /route/v1/driving/{lon1},{lat1};{lon2},{lat2} ─
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${bizLng},${bizLat};${cust.lng},${cust.lat}?overview=false`;
  try {
    const routeRes = await fetch(osrmUrl, { headers: { "User-Agent": "Blindly-App/1.0" } });
    const routeData = (await routeRes.json()) as { code?: string; routes?: { distance: number }[] };
    if (routeData.code !== "Ok" || !routeData.routes?.length) {
      return { error: "Could not calculate a route to that address.", status: 422 };
    }
    return { distance_km: Math.ceil(routeData.routes[0].distance / 1000) }; // metres → km, round up
  } catch {
    return { error: "Routing service unavailable. Please try again shortly.", status: 503 };
  }
}
