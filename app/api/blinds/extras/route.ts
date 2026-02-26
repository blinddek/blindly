import { NextRequest, NextResponse } from "next/server";
import { getApplicableExtras } from "@/lib/pricing";

/**
 * POST /api/blinds/extras
 * Returns applicable extras with customer-facing prices.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { blind_range_id, width_cm } = body;

    if (!blind_range_id || !width_cm) {
      return NextResponse.json(
        { error: "Missing required fields: blind_range_id, width_cm" },
        { status: 400 }
      );
    }

    const extras = await getApplicableExtras(
      blind_range_id,
      Number(width_cm)
    );

    return NextResponse.json({ extras });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch extras";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
