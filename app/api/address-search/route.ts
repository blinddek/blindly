import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/address-search?q=...
 * Proxies Nominatim address search (ZA only) so the server can set User-Agent.
 * Returns up to 6 suggestions with addressdetails.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 4) return NextResponse.json([]);

  // Appending the country name improves Nominatim accuracy for ZA addresses
  const query = q.toLowerCase().includes("south africa") ? q : `${q}, South Africa`;

  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(query)}&countrycodes=za&format=json&addressdetails=1&limit=6`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Blindly-App/1.0 (contact@blindly.co.za)",
        "Accept-Language": "en",
      },
      next: { revalidate: 300 },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}
