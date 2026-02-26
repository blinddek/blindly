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

// ---------- Stock Validation (used by checkout API) ----------

export async function validateAndDecrementStock(
  items: { product_id: string; quantity: number }[]
): Promise<{ valid: boolean; error?: string }> {
  const supabase = createAdminClient();

  for (const item of items) {
    const { data: product } = await supabase
      .from("products")
      .select("stock_quantity, name")
      .eq("id", item.product_id)
      .single();

    if (!product) return { valid: false, error: `Product not found: ${item.product_id}` };
    if (product.stock_quantity < item.quantity) {
      const name = typeof product.name === "object" && product.name !== null
        ? (product.name as { en?: string }).en ?? "Unknown"
        : "Unknown";
      return {
        valid: false,
        error: `Insufficient stock for ${name} (available: ${product.stock_quantity})`,
      };
    }
  }

  // Decrement stock
  for (const item of items) {
    const { error } = await supabase.rpc("decrement_stock", {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    });
    // Fallback if RPC doesn't exist — use raw update
    if (error) {
      const { data: product } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", item.product_id)
        .single();
      if (product) {
        await supabase
          .from("products")
          .update({ stock_quantity: product.stock_quantity - item.quantity })
          .eq("id", item.product_id);
      }
    }
  }

  return { valid: true };
}
