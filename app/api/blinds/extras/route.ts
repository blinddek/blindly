import { NextRequest, NextResponse } from "next/server";
import { getApplicableExtras } from "@/lib/pricing";

/**
 * POST /api/blinds/extras
 * Returns applicable extras with customer-facing prices.
 */
export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON" }, { status: 400 });
  }
  try {
    const { blind_range_id, width_cm } = body;

    if (!blind_range_id || !width_cm) {
      return NextResponse.json(
        { error: "Missing required fields: blind_range_id, width_cm" },
        { status: 400 }
      );
    }

    // blind_range_id is a UUID; anything else would fail the read, and answer 500 for a client fault.
    if (typeof blind_range_id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(blind_range_id)) {
      return NextResponse.json({ error: "blind_range_id is not valid" }, { status: 400 });
    }

    const extras = await getApplicableExtras(
      blind_range_id,
      Number(width_cm)
    );

    return NextResponse.json({ extras });
  } catch (err) {
    // A failed read is ours: a 500 without the database's message, which stays in the logs.
    console.error("[blinds/extras] failed:", err);
    return NextResponse.json({ error: "Could not load extras. Please try again." }, { status: 500 });
  }
}
