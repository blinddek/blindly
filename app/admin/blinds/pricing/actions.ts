"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function setGlobalMarkup(markup_percent: number) {
  const supabase = await createClient();

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

export async function setSupplierMarkup(supplier_id: string, markup_percent: number | null) {
  const supabase = await createClient();

  if (markup_percent === null) {
    await supabase
      .from("markup_config")
      .delete()
      .eq("scope_type", "supplier")
      .eq("scope_id", supplier_id);
    revalidatePath("/admin/blinds/pricing");
    return { success: true };
  }

  const { data: existing } = await supabase
    .from("markup_config")
    .select("id")
    .eq("scope_type", "supplier")
    .eq("scope_id", supplier_id)
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
      .insert({ scope_type: "supplier", scope_id: supplier_id, markup_percent, is_active: true });
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/blinds/pricing");
  return { success: true };
}

export async function addSupplier(name: string) {
  const slug = name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-)|(-$)/g, "");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .insert({ name, slug, is_active: true })
    .select("id, name, slug")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/admin/blinds/pricing");
  return { supplier: data };
}
