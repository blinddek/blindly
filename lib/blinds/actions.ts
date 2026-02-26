"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Category CRUD ──────────────────────────────────────

export async function createCategory(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = (formData.get("description") as string) || null;

  const { error } = await supabase
    .from("blind_categories")
    .insert({ name, slug, description });

  if (error) return { error: error.message };
  revalidatePath("/admin/blinds");
  return { success: true };
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = (formData.get("description") as string) || null;
  const is_active = formData.get("is_active") === "true";

  const { error } = await supabase
    .from("blind_categories")
    .update({ name, slug, description, is_active })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/blinds");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("blind_categories")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/blinds");
  return { success: true };
}

// ─── Type CRUD ──────────────────────────────────────────

export async function createBlindType(formData: FormData) {
  const supabase = await createClient();
  const data = {
    category_id: formData.get("category_id") as string,
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    slat_size_mm: formData.get("slat_size_mm")
      ? Number(formData.get("slat_size_mm"))
      : null,
    material: (formData.get("material") as string) || null,
    description: (formData.get("description") as string) || null,
    min_width_cm: Number(formData.get("min_width_cm")),
    max_width_cm: Number(formData.get("max_width_cm")),
    min_drop_cm: Number(formData.get("min_drop_cm")),
    max_drop_cm: Number(formData.get("max_drop_cm")),
    min_frame_depth_mm: formData.get("min_frame_depth_mm")
      ? Number(formData.get("min_frame_depth_mm"))
      : null,
  };

  const { error } = await supabase.from("blind_types").insert(data);
  if (error) return { error: error.message };
  revalidatePath("/admin/blinds");
  return { success: true };
}

export async function updateBlindType(id: string, formData: FormData) {
  const supabase = await createClient();
  const data = {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    slat_size_mm: formData.get("slat_size_mm")
      ? Number(formData.get("slat_size_mm"))
      : null,
    material: (formData.get("material") as string) || null,
    description: (formData.get("description") as string) || null,
    min_width_cm: Number(formData.get("min_width_cm")),
    max_width_cm: Number(formData.get("max_width_cm")),
    min_drop_cm: Number(formData.get("min_drop_cm")),
    max_drop_cm: Number(formData.get("max_drop_cm")),
    is_active: formData.get("is_active") === "true",
  };

  const { error } = await supabase
    .from("blind_types")
    .update(data)
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/blinds");
  return { success: true };
}

export async function deleteBlindType(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("blind_types")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/blinds");
  return { success: true };
}

// ─── Range CRUD ─────────────────────────────────────────

export async function createBlindRange(formData: FormData) {
  const supabase = await createClient();
  const colourOptionsRaw = formData.get("colour_options") as string;
  const data = {
    blind_type_id: formData.get("blind_type_id") as string,
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    description: (formData.get("description") as string) || null,
    colour_options: colourOptionsRaw ? JSON.parse(colourOptionsRaw) : [],
  };

  const { error } = await supabase.from("blind_ranges").insert(data);
  if (error) return { error: error.message };
  revalidatePath("/admin/blinds");
  return { success: true };
}

export async function updateBlindRange(id: string, formData: FormData) {
  const supabase = await createClient();
  const colourOptionsRaw = formData.get("colour_options") as string;
  const data = {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    description: (formData.get("description") as string) || null,
    colour_options: colourOptionsRaw ? JSON.parse(colourOptionsRaw) : [],
    is_active: formData.get("is_active") === "true",
  };

  const { error } = await supabase
    .from("blind_ranges")
    .update(data)
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/blinds");
  return { success: true };
}

export async function deleteBlindRange(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("blind_ranges")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/blinds");
  return { success: true };
}

// ─── Markup CRUD ────────────────────────────────────────

export async function upsertMarkup(formData: FormData) {
  const supabase = await createClient();
  const scope_type = formData.get("scope_type") as string;
  const scope_id = (formData.get("scope_id") as string) || null;
  const markup_percent = Number(formData.get("markup_percent"));

  const { error } = await supabase.from("markup_config").upsert(
    { scope_type, scope_id, markup_percent },
    { onConflict: "scope_type,scope_id" }
  );

  if (error) return { error: error.message };
  revalidatePath("/admin/blinds/pricing");
  return { success: true };
}

export async function deleteMarkup(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("markup_config")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/blinds/pricing");
  return { success: true };
}

// ─── Order Status Management ────────────────────────────

export async function updateBlindlyOrderStatus(
  orderId: string,
  newStatus: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("blindly_orders")
    .update({ order_status: newStatus })
    .eq("id", orderId);

  if (error) return { error: error.message };
  revalidatePath("/admin/orders");
  return { success: true };
}

export async function updateBlindlyOrderNotes(
  orderId: string,
  notes: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("blindly_orders")
    .update({ admin_notes: notes })
    .eq("id", orderId);

  if (error) return { error: error.message };
  return { success: true };
}

// ─── Import & Product Sync ─────────────────────────────────

export async function syncProductsFromRanges() {
  const { syncShopProducts } = await import("@/lib/blinds/import");
  const count = await syncShopProducts();
  revalidatePath("/shop");
  revalidatePath("/admin");
  return { success: true, products_synced: count };
}
