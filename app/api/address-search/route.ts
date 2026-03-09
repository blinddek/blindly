import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/address-search?q=...
 * Proxies Photon (komoot.io) address search, filtered to South Africa.
 * Photon uses OSM data with a better autocomplete index than raw Nominatim.
 * No API key required.
 */

// Bounding box for South Africa
const ZA_BBOX = "16,-35,33,-22"; // minLon,minLat,maxLon,maxLat

interface PhotonFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    osm_id?: number;
    name?: string;
    housenumber?: string;
    street?: string;
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
    country?: string;
    type?: string;
  };
}

interface PhotonResponse {
  features: PhotonFeature[];
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 3) return NextResponse.json([]);

  const url =
    `https://photon.komoot.io/api/` +
    `?q=${encodeURIComponent(q)}&lang=en&limit=6&bbox=${ZA_BBOX}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Blindly-App/1.0 (contact@blindly.co.za)" },
      next: { revalidate: 60 },
    });
    const data = await res.json() as PhotonResponse;
    return NextResponse.json(data.features ?? []);
  } catch {
    return NextResponse.json([]);
  }
}
