import { NextRequest, NextResponse } from "next/server";
import { getMotorOptions } from "@/lib/pricing";

/**
 * POST /api/blinds/motors
 * Returns motorisation options with compatibility info and prices.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
    const message =
      err instanceof Error ? err.message : "Failed to fetch motor options";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
