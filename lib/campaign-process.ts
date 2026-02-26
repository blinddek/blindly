/**
 * Campaign processing engine.
 *
 * Two entry points:
 *   - sendCampaign(id)     — immediate single-email broadcast to all recipients
 *   - processCampaigns()   — daily cron: activate scheduled campaigns + send due multi-step emails
 *
 * Uses Supabase admin client (no RLS). Feature-gated on emailCampaigns.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { sendRawEmail } from "@/lib/email";
import { baseTemplate } from "@/lib/email-base-template";
import { siteConfig } from "@/config/site";
import type { AudienceFilters } from "@/lib/audience-filters";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || `https://${siteConfig.domain}`;
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1000;
const COLD_THRESHOLD = 5;

// ── Helpers ──────────────────────────────────────────────

function replacePlaceholders(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return key in variables ? variables[key] : match;
  });
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Recipient query ──────────────────────────────────────

interface Recipient {
  id: string;
  email: string;
  first_name: string;
  unsubscribe_token: string | null;
}

async function getCampaignRecipients(
  filters: AudienceFilters | null
): Promise<Recipient[]> {
  const admin = createAdminClient();

  let query = admin
    .from("user_profiles")
    .select("id, email, first_name, unsubscribe_token")
    .eq("role", "customer")
    .eq("email_opt_out", false)
    .eq("email_paused", false)
    .eq("consent_given", true);

  if (!filters) {
    const { data } = await query;
    return (data ?? []) as Recipient[];
  }

  if (filters.clientStatus?.length) {
    query = query.in("status", filters.clientStatus);
  }
  if (filters.source?.length) {
    query = query.in("source", filters.source);
  }
  if (filters.gender?.length) {
    query = query.in("gender", filters.gender);
  }

  if (
    filters.ageRange?.min !== undefined ||
    filters.ageRange?.max !== undefined
  ) {
    const now = new Date();
    if (filters.ageRange.max !== undefined) {
      const minDob = new Date(
        now.getFullYear() - filters.ageRange.max - 1,
        now.getMonth(),
        now.getDate()
      );
      query = query.gte(
        "date_of_birth",
        minDob.toISOString().split("T")[0]
      );
    }
    if (filters.ageRange.min !== undefined) {
      const maxDob = new Date(
        now.getFullYear() - filters.ageRange.min,
        now.getMonth(),
        now.getDate()
      );
      query = query.lte(
        "date_of_birth",
        maxDob.toISOString().split("T")[0]
      );
    }
  }

  if (filters.lastLoginRange && filters.lastLoginRange !== "never") {
    const days = parseInt(filters.lastLoginRange);
    if (!isNaN(days)) {
      const cutoff = new Date(
        Date.now() - days * 24 * 60 * 60 * 1000
      ).toISOString();
      const direction = filters.lastLoginDirection || "within";
      if (direction === "within") {
        query = query.gte("last_login_at", cutoff);
      } else {
        query = query.or(
          `last_login_at.lt.${cutoff},last_login_at.is.null`
        );
      }
    }
  } else if (filters.lastLoginRange === "never") {
    query = query.is("last_login_at", null);
  }

  if (filters.onboardingComplete === true) {
    query = query.eq("onboarding_complete", true);
  }

  const { data } = await query;
  return (data ?? []) as Recipient[];
}

// ── Engagement check ────────────────────────────────────

async function isContactCold(email: string): Promise<boolean> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("email_logs")
    .select("opened_at")
    .eq("recipient", email)
    .eq("status", "sent")
    .not("tracking_id", "is", null)
    .order("sent_at", { ascending: false })
    .limit(COLD_THRESHOLD);

  if (!data || data.length < COLD_THRESHOLD) return false;
  return data.every(
    (e: { opened_at: string | null }) => e.opened_at === null
  );
}

async function autoPauseContact(userId: string) {
  const admin = createAdminClient();
  await admin
    .from("user_profiles")
    .update({
      email_paused: true,
      email_paused_at: new Date().toISOString(),
      email_pause_reason: `${COLD_THRESHOLD}_consecutive_unopened`,
    })
    .eq("id", userId);
}

// ── Password reset URL (feature-gated on customerAuth) ──

async function generatePasswordResetUrl(
  userId: string,
  email: string
): Promise<string | null> {
  if (!siteConfig.features.customerAuth) return null;

  try {
    const admin = createAdminClient();

    // Check if user has a Supabase auth account
    const { data: profile } = await admin
      .from("user_profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (!profile) return null;

    // Generate recovery link via admin API
    const { data: linkData, error } =
      await admin.auth.admin.generateLink({
        type: "recovery",
        email,
      });

    if (error || !linkData?.properties?.hashed_token) {
      console.error(
        `[campaign] Failed to generate reset link for ${email}:`,
        error?.message
      );
      return null;
    }

    return `${BASE_URL}/auth/callback?token_hash=${linkData.properties.hashed_token}&type=recovery&next=/reset-password`;
  } catch (err) {
    console.error(
      `[campaign] Password reset URL error for ${email}:`,
      err
    );
    return null;
  }
}

// ── Email logging ───────────────────────────────────────

async function logEmail(
  recipient: string,
  subject: string,
  templateKey: string,
  status: "sent" | "failed",
  metadata?: Record<string, unknown>
): Promise<void> {
  const admin = createAdminClient();
  const trackingId = crypto.randomUUID();

  await admin.from("email_logs").insert({
    recipient,
    subject,
    template_key: templateKey,
    status,
    tracking_id: trackingId,
    metadata,
  });
}

// ── Build email HTML ────────────────────────────────────

function buildEmailHtml(
  bodyHtml: string,
  ctaText: string | null,
  ctaUrl: string | null,
  variables: Record<string, string>,
  subject: string,
  unsubscribeUrl?: string
): string {
  let html = replacePlaceholders(bodyHtml, variables);

  if (ctaText && ctaUrl) {
    let resolvedUrl = replacePlaceholders(ctaUrl, variables);
    if (resolvedUrl.startsWith("/")) {
      resolvedUrl = `${BASE_URL}${resolvedUrl}`;
    }
    html += `<div style="text-align:center;margin:28px 0;"><a href="${resolvedUrl}" style="display:inline-block;background:${siteConfig.brand.primary};color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">${ctaText}</a></div>`;
  }

  return baseTemplate(subject, html, BASE_URL, unsubscribeUrl);
}

// ── Single-email campaign broadcast ─────────────────────

export async function sendCampaign(
  campaignId: string
): Promise<{ sent: number; failed: number; total: number }> {
  const admin = createAdminClient();
  const result = { sent: 0, failed: 0, total: 0 };

  const { data: campaign } = await admin
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (!campaign) throw new Error("Campaign not found");
  if (campaign.is_multi_step)
    throw new Error("Use processCampaigns() for multi-step campaigns");

  // Mark as sending
  await admin
    .from("campaigns")
    .update({ status: "sending" })
    .eq("id", campaignId);

  const recipients = await getCampaignRecipients(
    (campaign.audience_filters as AudienceFilters) || null
  );
  result.total = recipients.length;

  // Update total count
  await admin
    .from("campaigns")
    .update({ total_recipients: recipients.length })
    .eq("id", campaignId);

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (recipient) => {
        const unsubscribeUrl = recipient.unsubscribe_token
          ? `${BASE_URL}/api/email/unsubscribe?token=${recipient.unsubscribe_token}`
          : undefined;

        const variables: Record<string, string> = {
          firstName: recipient.first_name || "there",
          unsubscribeUrl: unsubscribeUrl || "",
        };

        // Password reset URL if needed
        const needsReset =
          campaign.body_html?.includes("{{passwordResetUrl}}") ||
          campaign.subject?.includes("{{passwordResetUrl}}");
        if (needsReset) {
          const resetUrl = await generatePasswordResetUrl(
            recipient.id,
            recipient.email
          );
          variables.passwordResetUrl =
            resetUrl || `${BASE_URL}/forgot-password`;
        }

        const subject = replacePlaceholders(
          campaign.subject || "",
          variables
        );
        const html = buildEmailHtml(
          campaign.body_html || "",
          null,
          null,
          variables,
          subject,
          unsubscribeUrl
        );

        const templateKey = `campaign_broadcast_${campaignId}`;
        const emailResult = await sendRawEmail({
          to: recipient.email,
          subject,
          html,
        });

        await logEmail(
          recipient.email,
          subject,
          templateKey,
          emailResult.success ? "sent" : "failed",
          { campaignId, userId: recipient.id }
        );

        return emailResult.success;
      })
    );

    for (const res of results) {
      if (res.status === "fulfilled" && res.value) result.sent++;
      else result.failed++;
    }

    if (i + BATCH_SIZE < recipients.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  // Final status
  await admin
    .from("campaigns")
    .update({
      status: result.failed === result.total ? "failed" : "sent",
      sent_count: result.sent,
      failed_count: result.failed,
      sent_at: new Date().toISOString(),
    })
    .eq("id", campaignId);

  return result;
}

// ── Multi-step campaign processor (daily cron) ──────────

interface CampaignProcessResult {
  activated: number;
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
  completed: number;
  autoPaused: number;
}

export async function processCampaigns(): Promise<CampaignProcessResult> {
  const result: CampaignProcessResult = {
    activated: 0,
    processed: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    completed: 0,
    autoPaused: 0,
  };

  await activateScheduledCampaigns(result);
  await processActiveCampaigns(result);

  return result;
}

async function activateScheduledCampaigns(result: CampaignProcessResult) {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: scheduled } = await admin
    .from("campaigns")
    .select("id, audience_filters")
    .eq("status", "scheduled")
    .eq("is_multi_step", true)
    .neq("campaign_type", "birthday")
    .lte("start_date", now);

  if (!scheduled?.length) return;

  for (const campaign of scheduled) {
    const recipients = await getCampaignRecipients(
      (campaign.audience_filters as AudienceFilters) || null
    );

    if (recipients.length > 0) {
      const rows = recipients.map((r) => ({
        campaign_id: campaign.id,
        user_id: r.id,
        current_step: 0,
      }));

      await admin
        .from("campaign_progress")
        .upsert(rows, { onConflict: "campaign_id,user_id" });
    }

    await admin
      .from("campaigns")
      .update({
        status: "active",
        activated_at: now,
        total_recipients: recipients.length,
      })
      .eq("id", campaign.id);

    result.activated++;
  }
}

async function processActiveCampaigns(result: CampaignProcessResult) {
  const admin = createAdminClient();

  const { data: campaigns } = await admin
    .from("campaigns")
    .select("id, activated_at, campaign_emails(*)")
    .eq("status", "active")
    .eq("is_multi_step", true)
    .neq("campaign_type", "birthday");

  if (!campaigns?.length) return;

  for (const campaign of campaigns) {
    const emails = (
      campaign.campaign_emails as Array<{
        id: string;
        step: number;
        day_offset: number;
        subject: string;
        body_html: string;
        cta_text: string | null;
        cta_url: string | null;
        is_active: boolean;
      }>
    )
      ?.filter((e) => e.is_active)
      .sort((a, b) => a.step - b.step);

    if (!emails?.length) continue;

    const totalSteps = emails.length;
    const daysSinceActivation = campaign.activated_at
      ? Math.floor(
          (Date.now() - new Date(campaign.activated_at).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    // Get active progress records with user data
    const { data: progressRecords } = await admin
      .from("campaign_progress")
      .select("id, user_id, current_step")
      .eq("campaign_id", campaign.id)
      .is("completed_at", null)
      .eq("is_paused", false);

    if (!progressRecords?.length) continue;

    // Fetch user data for these progress records
    const userIds = progressRecords.map((p) => p.user_id);
    const { data: users } = await admin
      .from("user_profiles")
      .select(
        "id, email, first_name, unsubscribe_token, consent_given, email_opt_out, email_paused"
      )
      .in("id", userIds)
      .eq("consent_given", true)
      .eq("email_opt_out", false)
      .eq("email_paused", false);

    const userMap = new Map(
      (users ?? []).map((u) => [u.id, u])
    );

    const candidates = progressRecords.filter((p) =>
      userMap.has(p.user_id)
    );

    // Process in batches
    for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
      const batch = candidates.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (progress) => {
          const user = userMap.get(progress.user_id)!;

          // Engagement check
          const cold = await isContactCold(user.email);
          if (cold) {
            await autoPauseContact(user.id);
            return "auto_paused" as const;
          }

          const campaignEmail = emails.find(
            (e) => e.step === progress.current_step
          );
          if (!campaignEmail) return "skipped" as const;

          // Day offset check
          if (daysSinceActivation < campaignEmail.day_offset) {
            return "skipped" as const;
          }

          // Idempotency
          const templateKey = `campaign_${campaign.id}_${progress.current_step}`;
          const { count } = await admin
            .from("email_logs")
            .select("id", { count: "exact", head: true })
            .eq("template_key", templateKey)
            .eq("recipient", user.email);

          if ((count ?? 0) > 0) {
            await advanceCampaignProgress(
              admin,
              progress.id,
              progress.current_step,
              totalSteps
            );
            return "skipped" as const;
          }

          // Build and send
          const unsubscribeUrl = user.unsubscribe_token
            ? `${BASE_URL}/api/email/unsubscribe?token=${user.unsubscribe_token}`
            : undefined;

          const variables: Record<string, string> = {
            firstName: user.first_name || "there",
            unsubscribeUrl: unsubscribeUrl || "",
          };

          const needsReset =
            campaignEmail.body_html.includes("{{passwordResetUrl}}") ||
            campaignEmail.cta_url === "{{passwordResetUrl}}";
          if (needsReset) {
            const resetUrl = await generatePasswordResetUrl(
              user.id,
              user.email
            );
            variables.passwordResetUrl =
              resetUrl || `${BASE_URL}/forgot-password`;
          }

          const subject = replacePlaceholders(
            campaignEmail.subject,
            variables
          );
          const html = buildEmailHtml(
            campaignEmail.body_html,
            campaignEmail.cta_text,
            campaignEmail.cta_url,
            variables,
            subject,
            unsubscribeUrl
          );

          const emailResult = await sendRawEmail({
            to: user.email,
            subject,
            html,
          });

          await logEmail(
            user.email,
            subject,
            templateKey,
            emailResult.success ? "sent" : "failed",
            {
              campaignId: campaign.id,
              campaignEmailId: campaignEmail.id,
              userId: user.id,
              step: progress.current_step,
            }
          );

          if (!emailResult.success) return "failed" as const;

          await advanceCampaignProgress(
            admin,
            progress.id,
            progress.current_step,
            totalSteps
          );
          return "sent" as const;
        })
      );

      for (const res of results) {
        result.processed++;
        if (res.status === "fulfilled") {
          if (res.value === "sent") result.sent++;
          else if (res.value === "skipped") result.skipped++;
          else if (res.value === "failed") result.failed++;
          else if (res.value === "auto_paused") result.autoPaused++;
        } else {
          result.failed++;
        }
      }

      if (i + BATCH_SIZE < candidates.length) {
        await delay(BATCH_DELAY_MS);
      }
    }

    // Update campaign aggregate stats
    const { count: sentCount } = await admin
      .from("email_logs")
      .select("id", { count: "exact", head: true })
      .like("template_key", `campaign_${campaign.id}_%`)
      .eq("status", "sent");

    const { count: failedCount } = await admin
      .from("email_logs")
      .select("id", { count: "exact", head: true })
      .like("template_key", `campaign_${campaign.id}_%`)
      .eq("status", "failed");

    await admin
      .from("campaigns")
      .update({
        sent_count: sentCount ?? 0,
        failed_count: failedCount ?? 0,
      })
      .eq("id", campaign.id);

    // Check completion
    const { count: totalProgress } = await admin
      .from("campaign_progress")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign.id);

    const { count: completedProgress } = await admin
      .from("campaign_progress")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign.id)
      .not("completed_at", "is", null);

    if (
      (totalProgress ?? 0) > 0 &&
      (completedProgress ?? 0) >= (totalProgress ?? 0)
    ) {
      await admin
        .from("campaigns")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", campaign.id);
      result.completed++;
    }
  }
}

async function advanceCampaignProgress(
  admin: ReturnType<typeof createAdminClient>,
  progressId: string,
  currentStep: number,
  totalSteps: number
) {
  const nextStep = currentStep + 1;
  const isComplete = nextStep >= totalSteps;

  await admin
    .from("campaign_progress")
    .update({
      current_step: nextStep,
      last_sent_at: new Date().toISOString(),
      completed_at: isComplete ? new Date().toISOString() : null,
    })
    .eq("id", progressId);
}
