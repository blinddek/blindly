"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { ensureAdmin } from "@/lib/admin/auth";
import { revalidatePath } from "next/cache";
import { addCredit, manualAdjust, getBalance } from "@/lib/booking/credits";

export async function getClientCredits(userId: string) {
  await ensureAdmin();
  const admin = createAdminClient();

  const balance = await getBalance(userId);

  const { data: transactions } = await admin
    .from("session_credit_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return { balance, transactions: transactions ?? [] };
}

export async function adminAddCredits(
  userId: string,
  amount: number,
  description: string
): Promise<{ error?: string }> {
  await ensureAdmin();
  if (amount <= 0) return { error: "Amount must be positive" };
  try {
    await addCredit(userId, amount, description || "Admin credit addition");
    revalidatePath("/admin/booking");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to add credits" };
  }
}

export async function adminAdjustCredits(
  userId: string,
  amount: number,
  description: string
): Promise<{ error?: string }> {
  await ensureAdmin();
  if (amount === 0) return { error: "Amount cannot be zero" };
  try {
    await manualAdjust(userId, amount, description || "Manual adjustment");
    revalidatePath("/admin/booking");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to adjust credits" };
  }
}

// Get all clients with credit balances for admin list view
export async function getAllCreditBalances() {
  await ensureAdmin();
  const admin = createAdminClient();

  const { data } = await admin
    .from("session_credit_balances")
    .select("user_id, balance, updated_at")
    .order("updated_at", { ascending: false });

  if (!data || data.length === 0) return [];

  // Fetch user profiles for names
  const userIds = data.map((d: { user_id: string }) => d.user_id);
  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, full_name, email")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p: { id: string; full_name: string; email: string }) => [p.id, p])
  );

  return data.map((d: { user_id: string; balance: number; updated_at: string }) => ({
    userId: d.user_id,
    balance: d.balance,
    updatedAt: d.updated_at,
    clientName: profileMap.get(d.user_id)?.full_name ?? "Unknown",
    clientEmail: profileMap.get(d.user_id)?.email ?? "",
  }));
}
