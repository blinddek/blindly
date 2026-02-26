import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { importPriceSheet } from "@/lib/blinds/import";

/**
 * POST /api/admin/import
 * Accepts an XLS/XLSX file upload and imports supplier price data.
 * Requires admin role.
 */
export async function POST(request: Request) {
  // Auth check — require admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  // Parse multipart form data
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No file provided. Send a multipart form with a 'file' field." },
      { status: 400 }
    );
  }

  const filename = file.name;
  if (
    !filename.endsWith(".xls") &&
    !filename.endsWith(".xlsx") &&
    !filename.endsWith(".xlsm")
  ) {
    return NextResponse.json(
      { error: "Only .xls, .xlsx, and .xlsm files are supported." },
      { status: 400 }
    );
  }

  try {
    const buffer = await file.arrayBuffer();
    const summary = await importPriceSheet(buffer, filename);

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Import failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
