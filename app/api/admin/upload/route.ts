import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureAdmin } from "@/lib/admin/auth";

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

export async function POST(req: NextRequest) {
  try {
    await ensureAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const folder = formData.get("folder") as string | null;

  if (!file || !folder) return NextResponse.json({ error: "file and folder are required" }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large — maximum 15 MB" }, { status: 400 });

  const safeName = file.name.replaceAll(/[^a-z0-9.]/gi, "-").toLowerCase();
  const path = `${folder}/${Date.now()}-${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const admin = createAdminClient();

  const { error: uploadError } = await admin.storage
    .from("images")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: signed, error: signError } = await admin.storage
    .from("images")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10); // 10 years

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: "Uploaded but could not generate URL" }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
