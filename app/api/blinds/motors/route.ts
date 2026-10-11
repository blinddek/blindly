import { NextRequest, NextResponse } from "next/server";
import { getMotorOptions } from "@/lib/pricing";

/**
 * POST /api/blinds/motors
 * Returns motorisation options with compatibility info and prices.
 */
export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON" }, { status: 400 });
  }
  try {
    const { width_cm, drop_cm } = body;

    if (!width_cm || !drop_cm) {
      return NextResponse.json(
        { error: "Missing required fields: width_cm, drop_cm" },
        { status: 400 }
      );
    }

    const motors = await getMotorOptions(Number(width_cm), Number(drop_cm));

    return NextResponse.json({ motors });
  } catch (err) {
    // A failed read is ours: a 500 without the database's message, which stays in the logs.
    console.error("[blinds/motor] failed:", err);
    return NextResponse.json({ error: "Could not load motor options. Please try again." }, { status: 500 });
  }
}
