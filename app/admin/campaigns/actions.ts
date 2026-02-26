"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureAdmin } from "@/lib/admin/auth";
import type { AudienceFilters } from "@/lib/audience-filters";

interface StepInput {
  dayOffset: number;
  subject: string;
  previewText: string;
  bodyHtml: string;
  ctaText: string;
  ctaUrl: string;
}

// ── Save Campaign (create or update) ──

export async function saveCampaignAction(formData: FormData) {
  await ensureAdmin();
  const admin = createAdminClient();

  const id = formData.get("id") as string | null;
  const name = formData.get("name") as string;
  const isMultiStep = formData.get("isMultiStep") === "true";
  const audienceFilters = JSON.parse(
    (formData.get("audienceFilters") as string) || "{}"
  );

  const campaignData: Record<string, unknown> = {
    name,
    is_multi_step: isMultiStep,
    audience_filters: audienceFilters,
    campaign_type: "standard",
  };

  if (!isMultiStep) {
    campaignData.subject = formData.get("subject") as string;
    campaignData.body_html = formData.get("bodyHtml") as string;
  }

  let campaignId = id;

  if (id) {
    // Update existing
    const { error } = await admin
      .from("campaigns")
      .update(campaignData)
      .eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    // Create new
    campaignData.status = "draft";
    const { data, error } = await admin
      .from("campaigns")
      .insert(campaignData)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    campaignId = data.id;
  }

  // Handle multi-step emails
  if (isMultiStep) {
    const stepsRaw = formData.get("emails") as string;
    const steps: StepInput[] = JSON.parse(stepsRaw || "[]");

    // Delete existing emails for this campaign, then re-insert
    await admin
      .from("campaign_emails")
      .delete()
      .eq("campaign_id", campaignId!);

    if (steps.length > 0) {
      const rows = steps.map((s, i) => ({
        campaign_id: campaignId!,
        step: i,
        day_offset: s.dayOffset,
        subject: s.subject,
        preview_text: s.previewText || null,
        body_html: s.bodyHtml,
        cta_text: s.ctaText || null,
        cta_url: s.ctaUrl || null,
        is_active: true,
      }));

      const { error } = await admin.from("campaign_emails").insert(rows);
      if (error) throw new Error(error.message);
    }
  }

  revalidatePath("/admin/campaigns");
  redirect(`/admin/campaigns`);
}

// ── Save Birthday Campaign ──

export async function saveBirthdayCampaignAction(formData: FormData) {
  await ensureAdmin();
  const admin = createAdminClient();

  const id = formData.get("id") as string | null;
  const name = formData.get("name") as string;
  const emailsRaw = formData.get("emails") as string;

  interface BirthdayEmailInput {
    subject: string;
    bodyHtml: string;
    ctaText: string;
    ctaUrl: string;
    genderTarget: string;
  }

  const emails: BirthdayEmailInput[] = JSON.parse(emailsRaw || "[]");

  const campaignData: Record<string, unknown> = {
    name,
    is_multi_step: true,
    campaign_type: "birthday",
  };

  let campaignId = id;

  if (id) {
    const { error } = await admin
      .from("campaigns")
      .update(campaignData)
      .eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    campaignData.status = "active";
    const { data, error } = await admin
      .from("campaigns")
      .insert(campaignData)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    campaignId = data.id;
  }

  // Replace all emails
  await admin
    .from("campaign_emails")
    .delete()
    .eq("campaign_id", campaignId!);

  if (emails.length > 0) {
    const rows = emails.map((e, i) => ({
      campaign_id: campaignId!,
      step: i,
      day_offset: 0,
      subject: e.subject,
      body_html: e.bodyHtml,
      cta_text: e.ctaText || null,
      cta_url: e.ctaUrl || null,
      gender_target: e.genderTarget || null,
      is_active: true,
    }));

    const { error } = await admin.from("campaign_emails").insert(rows);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns");
}

// ── Get Recipient Count ──

export async function getRecipientCountAction(
  filters: AudienceFilters
): Promise<number> {
  await ensureAdmin();
  const admin = createAdminClient();

  let query = admin
    .from("user_profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "customer")
    .eq("email_opt_out", false)
    .eq("email_paused", false)
    .eq("consent_given", true);

  // Apply filters
  if (filters.clientStatus?.length) {
    query = query.in("status", filters.clientStatus);
  }
  if (filters.source?.length) {
    query = query.in("source", filters.source);
  }
  if (filters.gender?.length) {
    query = query.in("gender", filters.gender);
  }

  // Age range — computed from date_of_birth
  if (filters.ageRange?.min !== undefined || filters.ageRange?.max !== undefined) {
    const now = new Date();
    if (filters.ageRange.max !== undefined) {
      const minDob = new Date(now.getFullYear() - filters.ageRange.max - 1, now.getMonth(), now.getDate());
      query = query.gte("date_of_birth", minDob.toISOString().split("T")[0]);
    }
    if (filters.ageRange.min !== undefined) {
      const maxDob = new Date(now.getFullYear() - filters.ageRange.min, now.getMonth(), now.getDate());
      query = query.lte("date_of_birth", maxDob.toISOString().split("T")[0]);
    }
  }

  // Last login
  if (filters.lastLoginRange && filters.lastLoginRange !== "never") {
    const days = parseInt(filters.lastLoginRange);
    if (!isNaN(days)) {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const direction = filters.lastLoginDirection || "within";
      if (direction === "within") {
        query = query.gte("last_login_at", cutoff);
      } else {
        query = query.or(`last_login_at.lt.${cutoff},last_login_at.is.null`);
      }
    }
  } else if (filters.lastLoginRange === "never") {
    query = query.is("last_login_at", null);
  }

  // Onboarding
  if (filters.onboardingComplete === true) {
    query = query.eq("onboarding_complete", true);
  }

  const { count, error } = await query;
  if (error) throw new Error(error.message);

  // Enrollment filters require a separate query against enrollments table
  const finalCount = count ?? 0;

  // Enrollment filters require cross-table logic — for the count preview,
  // this is an approximation. Full filtering happens in campaign send.

  return finalCount;
}

// ── Campaign Status Management ──

export async function scheduleCampaignAction(
  id: string,
  startDate: string
): Promise<{ error?: string }> {
  await ensureAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("campaigns")
    .update({ status: "scheduled", start_date: startDate })
    .eq("id", id)
    .eq("status", "draft");

  if (error) return { error: error.message };
  revalidatePath("/admin/campaigns");
  return {};
}

export async function pauseCampaignAction(id: string): Promise<{ error?: string }> {
  await ensureAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("campaigns")
    .update({ status: "paused" })
    .eq("id", id)
    .in("status", ["active", "scheduled"]);

  if (error) return { error: error.message };
  revalidatePath("/admin/campaigns");
  return {};
}

export async function resumeCampaignAction(id: string): Promise<{ error?: string }> {
  await ensureAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("campaigns")
    .update({ status: "active" })
    .eq("id", id)
    .eq("status", "paused");

  if (error) return { error: error.message };
  revalidatePath("/admin/campaigns");
  return {};
}

export async function deleteCampaignAction(id: string): Promise<{ error?: string }> {
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

// ── Send Test Email ──

export async function sendTestCampaignAction(
  campaignId: string,
  recipientEmail: string,
  step?: number
): Promise<{ error?: string }> {
  await ensureAdmin();
  const admin = createAdminClient();

  // Get campaign
  const { data: campaign } = await admin
    .from("campaigns")
    .select("*, campaign_emails(*)")
    .eq("id", campaignId)
    .single();

  if (!campaign) return { error: "Campaign not found" };

  let subject: string;
  let html: string;

  if (campaign.is_multi_step) {
    const targetStep = step ?? 0;
    const emails = (campaign.campaign_emails as Array<{ step: number; subject: string; body_html: string }>)
      ?.sort((a: { step: number }, b: { step: number }) => a.step - b.step);
    const email = emails?.find((e: { step: number }) => e.step === targetStep) || emails?.[0];

    if (!email) return { error: "No email found for this step" };
    subject = email.subject;
    html = email.body_html;
  } else {
    subject = campaign.subject || "";
    html = campaign.body_html || "";
  }

  // Replace variables with test values
  subject = subject
    .replaceAll("{{firstName}}", "[firstName]")
    .replaceAll("{{unsubscribeUrl}}", "#")
    .replaceAll("{{passwordResetUrl}}", "#");
  html = html
    .replaceAll("{{firstName}}", "[firstName]")
    .replaceAll("{{unsubscribeUrl}}", "#")
    .replaceAll("{{passwordResetUrl}}", "#");

  // Send via email lib
  const { sendRawEmail } = await import("@/lib/email");
  const result = await sendRawEmail({
    to: recipientEmail,
    subject: `[TEST] ${subject}`,
    html,
  });

  if (!result.success) return { error: "Failed to send test email" };

  // Log it
  await admin.from("email_logs").insert({
    recipient: recipientEmail,
    subject: `[TEST] ${subject}`,
    template_key: `campaign_test_${campaignId}`,
    status: "sent",
    metadata: { test: true, campaignId },
  });

  return {};
}
