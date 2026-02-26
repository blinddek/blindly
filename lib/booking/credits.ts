/**
 * Session credit management — add, debit, refund, forfeit.
 *
 * Only used when isEnabled("sessionCredits") is true.
 * Uses createAdminClient() for all mutations (bypasses RLS).
 */

import { createAdminClient } from "@/lib/supabase/admin";

export async function getBalance(userId: string): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("session_credit_balances")
    .select("balance")
    .eq("user_id", userId)
    .single();
  return data?.balance ?? 0;
}

async function updateBalance(userId: string, delta: number) {
  const admin = createAdminClient();
  const current = await getBalance(userId);
  await admin.from("session_credit_balances").upsert(
    { user_id: userId, balance: current + delta },
    { onConflict: "user_id" }
  );
}

async function logTransaction(
  userId: string,
  amount: number,
  type: "purchase" | "refund" | "forfeit" | "debit" | "manual",
  description: string,
  bookingId?: string
) {
  const admin = createAdminClient();
  await admin.from("session_credit_transactions").insert({
    user_id: userId,
    amount,
    type,
    description,
    booking_id: bookingId ?? null,
  });
}

export async function addCredit(
  userId: string,
  amount: number,
  description: string,
  bookingId?: string
) {
  await logTransaction(userId, amount, "purchase", description, bookingId);
  await updateBalance(userId, amount);
}

export async function debitCredit(
  userId: string,
  amount: number,
  description: string,
  bookingId?: string
) {
  await logTransaction(userId, -amount, "debit", description, bookingId);
  await updateBalance(userId, -amount);
}

export async function refundCredit(
  userId: string,
  bookingId: string,
  description: string
) {
  await logTransaction(userId, 1, "refund", description, bookingId);
  await updateBalance(userId, 1);
}

export async function forfeitCredit(
  userId: string,
  bookingId: string,
  description: string
) {
  await logTransaction(userId, 0, "forfeit", description, bookingId);
  // No balance change — credit was already debited at booking time
}

export async function manualAdjust(
  userId: string,
  amount: number,
  description: string
) {
  await logTransaction(userId, amount, "manual", description);
  await updateBalance(userId, amount);
}
