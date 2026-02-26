"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { ensureAdmin } from "@/lib/admin/auth";
import { revalidatePath } from "next/cache";

// -- Coupons -----------------------------------------------------------------

export async function getCoupons() {
  await ensureAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function createCoupon(data: {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses?: number;
  expires_at?: string;
}): Promise<{ error?: string }> {
  await ensureAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("coupons").insert({
    ...data,
    code: data.code.toUpperCase(),
    is_active: true,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/commerce");
  return {};
}

export async function toggleCoupon(
  id: string,
  active: boolean
): Promise<{ error?: string }> {
  await ensureAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("coupons")
    .update({ is_active: active })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/commerce");
  return {};
}

export async function deleteCoupon(id: string): Promise<{ error?: string }> {
  await ensureAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("coupons").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/commerce");
  return {};
}

// -- Gifts -------------------------------------------------------------------

export async function getGifts() {
  await ensureAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("gifts")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function createGift(data: {
  code: string;
  gift_type: "course" | "product" | "credits";
  target_id?: string;
  amount?: number;
  expires_at?: string;
}): Promise<{ error?: string }> {
  await ensureAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("gifts").insert({
    ...data,
    code: data.code.toUpperCase(),
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/commerce");
  return {};
}

export async function deleteGift(id: string): Promise<{ error?: string }> {
  await ensureAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("gifts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/commerce");
  return {};
}
