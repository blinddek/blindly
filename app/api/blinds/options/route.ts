import { NextRequest, NextResponse } from "next/server";
import {
  getCategories,
  getTypesByCategory,
  getRangesByType,
} from "@/lib/blinds/queries";

/**
 * GET /api/blinds/options
 * Returns configurator options hierarchy.
 * ?category_id= → returns types for category
 * ?type_id= → returns ranges for type
 * No params → returns all categories
 */
export async function GET(req: NextRequest) {
  try {
    const categoryId = req.nextUrl.searchParams.get("category_id");
    const typeId = req.nextUrl.searchParams.get("type_id");

    if (typeId) {
      const ranges = await getRangesByType(typeId);
      return NextResponse.json({ ranges });
    }

    if (categoryId) {
      const types = await getTypesByCategory(categoryId);
      return NextResponse.json({ types });
    }

    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load options";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
