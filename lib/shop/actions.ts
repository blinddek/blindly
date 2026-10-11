"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { ensureAdmin } from "@/lib/admin/auth";
import type { LocalizedString } from "@/types/cms";

// ---------- Products ----------

export async function upsertProduct(data: {
  id?: string;
  name: LocalizedString;
  slug: string;
  description?: LocalizedString | null;
  price_cents: number;
  images?: string[];
  category_id?: string | null;
  stock_quantity: number;
  is_active?: boolean;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("products").upsert({
    ...data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/shop");
  revalidatePath("/admin/shop");
}

export async function deleteProduct(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/shop");
  revalidatePath("/admin/shop");
}

// ---------- Product Categories ----------

export async function upsertProductCategory(data: {
  id?: string;
  name: LocalizedString;
  slug: string;
  image?: string | null;
  display_order?: number;
  is_active?: boolean;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("product_categories").upsert({
    ...data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/shop");
  revalidatePath("/admin/shop");
}

export async function deleteProductCategory(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("product_categories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/shop");
  revalidatePath("/admin/shop");
}

// ---------- Orders ----------

export async function updateOrderStatus(
  id: string,
  status: "pending" | "paid" | "fulfilled" | "cancelled"
) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/shop/orders");
}

// ---------- Shop Settings ----------

export async function updateShopSetting(key: string, value: number) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("shop_settings")
    .upsert({ key, value: value as unknown as Record<string, unknown> });
  if (error) throw new Error(error.message);
  revalidatePath("/shop");
  revalidatePath("/admin/shop/settings");
}
