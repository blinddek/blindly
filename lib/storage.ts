"use server";

import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "uploads";

/**
 * Upload a file to Supabase Storage.
 * Returns the public URL on success.
 */
export async function uploadFile(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided" };

  const folder = (formData.get("folder") as string) || "images";
  const ext = file.name.split(".").pop() ?? "bin";
  const fileName = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const supabase = createAdminClient();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) return { error: error.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

  return { url: publicUrl };
}

/**
 * Delete a file from Supabase Storage by its public URL.
 */
export async function deleteFile(
  publicUrl: string
): Promise<{ error?: string }> {
  const supabase = createAdminClient();
  // Extract path from public URL: .../storage/v1/object/public/uploads/...
  const match = publicUrl.match(/\/storage\/v1\/object\/public\/uploads\/(.+)$/);
  if (!match) return { error: "Invalid storage URL" };

  const { error } = await supabase.storage.from(BUCKET).remove([match[1]]);
  if (error) return { error: error.message };
  return {};
}
