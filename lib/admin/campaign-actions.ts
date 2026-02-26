"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureAdmin } from "@/lib/admin/auth";

// ---------- Email Campaigns ----------

export async function getCampaigns() {
  await ensureAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("campaigns")
    .select("*, campaign_emails(count)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getCampaign(id: string) {
  await ensureAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("campaigns")
    .select("*, campaign_emails(*)")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteCampaign(id: string): Promise<{ error?: string }> {
  await ensureAdmin();
  const admin = createAdminClient();

  const { data: campaign } = await admin
    .from("campaigns")
    .select("status")
    .eq("id", id)
    .single();

  if (campaign?.status !== "draft") {
    return { error: "Only draft campaigns can be deleted" };
  }

  const { error } = await admin.from("campaigns").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/campaigns");
  return {};
}

// ---------- Drip Emails (phase-based) ----------

export async function getDripEmails() {
  await ensureAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("drip_emails")
    .select("*")
    .order("phase")
    .order("step", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createDripEmail(data: {
  phase: string;
  step: number;
  day_offset: number;
  subject: string;
  body_html: string;
  cta_text?: string;
  cta_url?: string;
}): Promise<{ error?: string }> {
  await ensureAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("drip_emails").insert({
    phase: data.phase,
    step: data.step,
    day_offset: data.day_offset,
    subject: data.subject,
    body_html: data.body_html,
    cta_text: data.cta_text ?? null,
    cta_url: data.cta_url ?? null,
    is_active: true,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/campaigns");
  return {};
}

export async function updateDripEmail(
  id: string,
  data: {
    phase?: string;
    step?: number;
    day_offset?: number;
    subject?: string;
    body_html?: string;
    cta_text?: string;
    cta_url?: string;
  }
): Promise<{ error?: string }> {
  await ensureAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("drip_emails")
    .update(data)
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/campaigns");
  return {};
}

export async function toggleDripEmail(
  id: string,
  active: boolean
): Promise<{ error?: string }> {
  await ensureAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("drip_emails")
    .update({ is_active: active })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/campaigns");
  return {};
}

export async function deleteDripEmail(id: string): Promise<{ error?: string }> {
  await ensureAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("drip_emails").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/campaigns");
  return {};
}
