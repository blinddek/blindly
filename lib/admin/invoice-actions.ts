"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { ensureAdmin } from "@/lib/admin/auth";
import { revalidatePath } from "next/cache";

interface LineItem {
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
}

export async function getInvoices() {
  await ensureAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getInvoiceById(id: string) {
  await ensureAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function getBillingEntity() {
  await ensureAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("billing_entities")
    .select("*")
    .limit(1)
    .single();
  return data;
}

export async function upsertBillingEntity(entity: {
  id?: string;
  name: string;
  registration_no?: string;
  vat_no?: string;
  address?: string;
  email?: string;
  phone?: string;
  bank_name?: string;
  bank_account?: string;
  bank_branch?: string;
}): Promise<{ error?: string }> {
  await ensureAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("billing_entities").upsert({
    ...entity,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/billing");
  return {};
}

async function getNextInvoiceNumber(): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("invoice_sequences")
    .select("prefix, next_num")
    .eq("id", "default")
    .single();

  const prefix = data?.prefix ?? "INV";
  const num = data?.next_num ?? 1;

  // Increment the sequence
  await admin
    .from("invoice_sequences")
    .update({ next_num: num + 1 })
    .eq("id", "default");

  return `${prefix}-${String(num).padStart(5, "0")}`;
}

export async function createInvoice(data: {
  user_id?: string;
  client_name: string;
  client_email: string;
  line_items: LineItem[];
  vat_rate?: number;
  currency?: string;
  due_days?: number;
}): Promise<{ error?: string; id?: string }> {
  await ensureAdmin();
  const admin = createAdminClient();

  const invoiceNumber = await getNextInvoiceNumber();
  const subtotal = data.line_items.reduce((sum, item) => sum + item.total_cents, 0);
  const vatRate = data.vat_rate ?? 0.15;
  const vatAmount = Math.round(subtotal * vatRate);
  const total = subtotal + vatAmount;

  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + (data.due_days ?? 30));

  const { data: invoice, error } = await admin
    .from("invoices")
    .insert({
      invoice_number: invoiceNumber,
      user_id: data.user_id ?? null,
      client_name: data.client_name,
      client_email: data.client_email,
      line_items: data.line_items,
      subtotal_cents: subtotal,
      vat_rate: vatRate,
      vat_amount_cents: vatAmount,
      total_cents: total,
      currency: data.currency ?? "ZAR",
      status: "draft",
      issued_at: now.toISOString(),
      due_at: dueDate.toISOString(),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/admin/billing");
  return { id: invoice.id };
}

export async function updateInvoiceStatus(
  id: string,
  status: "draft" | "sent" | "paid" | "void"
): Promise<{ error?: string }> {
  await ensureAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("invoices")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/billing");
  return {};
}

export async function deleteInvoice(id: string): Promise<{ error?: string }> {
  await ensureAdmin();
  const admin = createAdminClient();
  // Only allow deleting draft invoices
  const { data: inv } = await admin
    .from("invoices")
    .select("status")
    .eq("id", id)
    .single();
  if (inv?.status !== "draft") {
    return { error: "Only draft invoices can be deleted" };
  }
  const { error } = await admin.from("invoices").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/billing");
  return {};
}
