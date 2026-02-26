import { NextRequest, NextResponse } from "next/server";
import { getAvailableGrid } from "@/lib/pricing";

/**
 * GET /api/blinds/grid?range_id=...
 * Returns available width/drop grid for a blind range.
 */
export async function GET(req: NextRequest) {
  try {
    const rangeId = req.nextUrl.searchParams.get("range_id");

    if (!rangeId) {
      return NextResponse.json(
        { error: "Missing required parameter: range_id" },
        { status: 400 }
      );
    }

    const grid = await getAvailableGrid(rangeId);

    return NextResponse.json(grid);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch grid";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
