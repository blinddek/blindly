import { NextRequest, NextResponse } from "next/server";
import { lookupPrice, PriceInputError } from "@/lib/pricing";
import type { MountType } from "@/types/blinds";

/**
 * POST /api/blinds/price
 * Returns customer-facing price (no supplier cost exposed).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { blind_range_id, width_mm, drop_mm, mount_type } = body;

    if (!blind_range_id || !width_mm || !drop_mm || !mount_type) {
      return NextResponse.json(
        { error: "Missing required fields: blind_range_id, width_mm, drop_mm, mount_type" },
        { status: 400 }
      );
    }

    if (!["inside", "outside"].includes(mount_type)) {
      return NextResponse.json(
        { error: "mount_type must be 'inside' or 'outside'" },
        { status: 400 }
      );
    }

    const result = await lookupPrice({
      blind_range_id,
      width_mm: Number(width_mm),
      drop_mm: Number(drop_mm),
      mount_type: mount_type as MountType,
    });

    // Return customer-facing price only — never expose supplier cost or markup
    return NextResponse.json({
      customer_price_cents: result.customer_price_cents,
      matched_width_cm: result.matched_width_cm,
      matched_drop_cm: result.matched_drop_cm,
      vat_cents: result.vat_cents,
      total_with_vat_cents: result.total_with_vat_cents,
    });
  } catch (err) {
    // A size outside the grid is the customer's to fix; a failed read is ours, and its message stays
    // in the logs.
    if (err instanceof PriceInputError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[blinds/price] lookup failed:", err);
    return NextResponse.json({ error: "Failed to calculate price" }, { status: 500 });
  }
}
