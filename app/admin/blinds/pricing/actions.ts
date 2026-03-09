"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function setGlobalMarkup(markup_percent: number) {
  const supabase = await createClient();

  // Upsert the global markup row (scope_type='global', scope_id=null)
  const { data: existing } = await supabase
    .from("markup_config")
    .select("id")
    .eq("scope_type", "global")
    .is("scope_id", null)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("markup_config")
      .update({ markup_percent, is_active: true })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("markup_config")
      .insert({ scope_type: "global", scope_id: null, markup_percent, is_active: true });
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/blinds/pricing");
  return { success: true };
}

export async function setCategoryMarkup(category_id: string, markup_percent: number | null) {
  const supabase = await createClient();

  if (markup_percent === null) {
    // Remove override — fall back to global
    await supabase
      .from("markup_config")
      .delete()
      .eq("scope_type", "category")
      .eq("scope_id", category_id);
    revalidatePath("/admin/blinds/pricing");
    return { success: true };
  }

  const { data: existing } = await supabase
    .from("markup_config")
    .select("id")
    .eq("scope_type", "category")
    .eq("scope_id", category_id)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("markup_config")
      .update({ markup_percent, is_active: true })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("markup_config")
      .insert({ scope_type: "category", scope_id: category_id, markup_percent, is_active: true });
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/blinds/pricing");
  return { success: true };
}
