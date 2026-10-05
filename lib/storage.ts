"use server";

import { ensureAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_BUCKET = "uploads";

// Server actions are public POST endpoints and both of these use the
// service-role client, so this check is all that stops anonymous writes.
async function adminOrError(): Promise<string | null> {
  try {
    await ensureAdmin();
    return null;
  } catch {
    return "Not authorised";
  }
}

/**
 * Upload a file to Supabase Storage.
 * Supports a "bucket" field in formData to target a specific bucket (e.g. "gallery").
 * Returns the public URL on success.
 */
export async function uploadFile(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  const denied = await adminOrError();
  if (denied) return { error: denied };

  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided" };

  const bucket = (formData.get("bucket") as string) || DEFAULT_BUCKET;
  const folder = (formData.get("folder") as string) || "images";
  const ext = file.name.split(".").pop() ?? "bin";
  const fileName = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const supabase = createAdminClient();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) return { error: error.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(fileName);

  return { url: publicUrl };
}

/**
 * Delete a file from Supabase Storage by its public URL.
 * Auto-detects the bucket from the URL path.
 */
export async function deleteFile(
  publicUrl: string
): Promise<{ error?: string }> {
  const denied = await adminOrError();
  if (denied) return { error: denied };

  const supabase = createAdminClient();
  // Extract bucket and path from: .../storage/v1/object/public/{bucket}/{path}
  const match = publicUrl.match(
    /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/
  );
  if (!match) return { error: "Invalid storage URL" };

  const [, bucket, filePath] = match;
  const { error } = await supabase.storage.from(bucket).remove([filePath]);
  if (error) return { error: error.message };
  return {};
}
