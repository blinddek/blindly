import { NextResponse } from "next/server";
import { parseCheckoutBody, priceCheckout, CheckoutInputError } from "@/lib/blinds/checkout-pricing";

/**
 * POST /api/blinds/quote — the server's price for a checkout body, creating nothing. The checkout
 * page shows this total and sends it back as `expected_total_cents`; `/api/blinds/checkout` charges
 * the same computation and refuses if the two differ.
 */
export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  try {
    const { totals, distanceKm } = await priceCheckout(parseCheckoutBody(raw));
    return NextResponse.json({ totals, distance_km: distanceKm });
  } catch (err) {
    if (err instanceof CheckoutInputError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[blinds/quote] pricing failed:", err);
    return NextResponse.json({ error: "Could not price your order. Please try again." }, { status: 500 });
  }
}
