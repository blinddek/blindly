"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Categories ──────────────────────────────────────────────

export async function upsertCategory(data: {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  display_order: number;
  is_active: boolean;
}) {
  const supabase = await createClient();
  const { error } = data.id
    ? await supabase.from("blind_categories").update(data).eq("id", data.id)
    : await supabase.from("blind_categories").insert(data);
  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("blind_categories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  return { success: true };
}

// ─── Types ───────────────────────────────────────────────────

export async function upsertType(data: {
  id?: string;
  category_id: string;
  name: string;
  slug: string;
  material?: string;
  slat_size_mm?: number | null;
  description?: string;
  min_width_cm: number;
  max_width_cm: number;
  min_drop_cm: number;
  max_drop_cm: number;
  min_frame_depth_mm?: number | null;
  display_order: number;
  is_active: boolean;
}) {
  const supabase = await createClient();
  const { error } = data.id
    ? await supabase.from("blind_types").update(data).eq("id", data.id)
    : await supabase.from("blind_types").insert(data);
  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  return { success: true };
}

export async function deleteType(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("blind_types").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  return { success: true };
}

// ─── Ranges ──────────────────────────────────────────────────

export async function upsertRange(data: {
  id?: string;
  blind_type_id: string;
  name: string;
  slug: string;
  description?: string;
  lifestyle_image_url?: string;
  starting_price_cents?: number | null;
  supplier?: string;
  colour_options: { name: string; hex: string }[];
  display_order: number;
  is_active: boolean;
}) {
  const supabase = await createClient();
  const { error } = data.id
    ? await supabase.from("blind_ranges").update(data).eq("id", data.id)
    : await supabase.from("blind_ranges").insert(data);
  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  return { success: true };
}

export async function deleteRange(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("blind_ranges").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  return { success: true };
}
