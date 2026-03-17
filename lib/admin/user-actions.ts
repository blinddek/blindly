"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { ensureAdmin } from "@/lib/admin/auth";
import { revalidatePath } from "next/cache";

export async function getUsers() {
  await ensureAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("user_profiles")
    .select("id, role, full_name, email, phone, created_at, updated_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function updateUserRole(
  userId: string,
  role: "admin" | "customer"
): Promise<{ error?: string }> {
  await ensureAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("user_profiles")
    .update({ role })
    .eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/admin/settings");
  return {};
}

export async function deleteUser(userId: string): Promise<{ error?: string }> {
  await ensureAdmin();
  const admin = createAdminClient();

  // Delete from Supabase Auth (cascades to user_profiles via FK)
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath("/admin/settings");
  return {};
}

export async function updateUser(
  userId: string,
  data: { fullName?: string; password?: string }
): Promise<{ error?: string }> {
  await ensureAdmin();
  const admin = createAdminClient();

  // Update name in profile
  if (data.fullName) {
    const { error } = await admin
      .from("user_profiles")
      .update({ full_name: data.fullName, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) return { error: error.message };
  }

  // Update password in Supabase Auth
  if (data.password) {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: data.password,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/settings");
  return {};
}

export async function createUser(data: {
  email: string;
  password: string;
  fullName: string;
  role: "admin" | "customer";
}): Promise<{ error?: string }> {
  await ensureAdmin();
  const admin = createAdminClient();

  // Create in Supabase Auth
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      full_name: data.fullName,
      role: data.role,
    },
  });
  if (authError) return { error: authError.message };
  if (!authData.user) return { error: "Failed to create user" };

  // Create profile
  const { error: profileError } = await admin
    .from("user_profiles")
    .upsert({
      id: authData.user.id,
      full_name: data.fullName,
      email: data.email,
      role: data.role,
    });
  if (profileError) return { error: profileError.message };

  revalidatePath("/admin/settings");
  return {};
}
