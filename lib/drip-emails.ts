/**
 * Drip email processor — phase-based nurture sequences.
 *
 * Two phases:
 *   onboarding  — sent to new signups (configurable day offsets)
 *   newsletter  — long-term engagement after onboarding completes
 *
 * Called daily by cron. Feature-gated on dripEmails.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { sendRawEmail } from "@/lib/email";
import { baseTemplate } from "@/lib/email-base-template";
import { siteConfig } from "@/config/site";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || `https://${siteConfig.domain}`;
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1000;
const COLD_THRESHOLD = 5;

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

// ── Phase counts ────────────────────────────────────────

async function getDripPhaseCounts(): Promise<{
  onboarding: number;
  newsletter: number;
}> {
  const admin = createAdminClient();

  const { count: onboarding } = await admin
    .from("drip_emails")
    .select("id", { count: "exact", head: true })
    .eq("phase", "onboarding")
    .eq("is_active", true);

  const { count: newsletter } = await admin
    .from("drip_emails")
    .select("id", { count: "exact", head: true })
    .eq("phase", "newsletter")
    .eq("is_active", true);

  return {
    onboarding: onboarding ?? 0,
    newsletter: newsletter ?? 0,
  };
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

// ── Password reset URL ─────────────────────────────────

async function generatePasswordResetUrl(
  email: string
): Promise<string | null> {
  if (!siteConfig.features.customerAuth) return null;

  try {
    const admin = createAdminClient();

    const { data: linkData, error } =
      await admin.auth.admin.generateLink({
        type: "recovery",
        email,
      });

    if (error || !linkData?.properties?.hashed_token) {
      console.error(
        `[drip] Failed to generate reset link for ${email}:`,
        error?.message
      );
      return null;
    }

    return `${BASE_URL}/auth/callback?token_hash=${linkData.properties.hashed_token}&type=recovery&next=/reset-password`;
  } catch (err) {
    console.error(`[drip] Password reset URL error for ${email}:`, err);
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

// ── Drip candidate ──────────────────────────────────────

interface DripCandidate {
  userId: string;
  email: string;
  firstName: string;
  unsubscribeToken: string | null;
  daysSinceSignup: number;
  currentPhase: "onboarding" | "newsletter";
  currentStep: number;
  progressId: string | null;
  clientStatus: string;
}

// ── Main processor ──────────────────────────────────────

interface DripResult {
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
  autoPaused: number;
}

export async function processDripEmails(): Promise<DripResult> {
  const result: DripResult = {
    processed: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    autoPaused: 0,
  };

  const admin = createAdminClient();
  const phaseCounts = await getDripPhaseCounts();

  if (phaseCounts.onboarding === 0 && phaseCounts.newsletter === 0) {
    return result;
  }

  // Get eligible users with drip progress
  const { data: users } = await admin
    .from("user_profiles")
    .select(
      "id, email, first_name, unsubscribe_token, status, created_at"
    )
    .eq("role", "customer")
    .eq("consent_given", true)
    .eq("email_opt_out", false)
    .eq("email_paused", false)
    .order("created_at", { ascending: true });

  if (!users?.length) return result;

  // Fetch all drip progress records
  const userIds = users.map((u) => u.id);
  const { data: progressRecords } = await admin
    .from("drip_progress")
    .select("id, user_id, current_phase, current_step, completed_at, is_paused")
    .in("user_id", userIds);

  const progressMap = new Map(
    (progressRecords ?? []).map((p) => [p.user_id, p])
  );

  // Build candidates
  const now = new Date();
  const candidates: DripCandidate[] = [];

  for (const user of users) {
    const progress = progressMap.get(user.id);

    // Skip completed or paused
    if (progress?.completed_at) continue;
    if (progress?.is_paused) continue;

    const daysSinceSignup = Math.floor(
      (now.getTime() - new Date(user.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    candidates.push({
      userId: user.id,
      email: user.email,
      firstName: user.first_name || "there",
      unsubscribeToken: user.unsubscribe_token,
      daysSinceSignup,
      currentPhase:
        (progress?.current_phase as "onboarding" | "newsletter") ||
        "onboarding",
      currentStep: progress?.current_step ?? 0,
      progressId: progress?.id || null,
      clientStatus: user.status || "active",
    });
  }

  // Process in batches
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((candidate) =>
        processSingleClient(admin, candidate, phaseCounts)
      )
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

  return result;
}

async function processSingleClient(
  admin: ReturnType<typeof createAdminClient>,
  candidate: DripCandidate,
  phaseCounts: { onboarding: number; newsletter: number }
): Promise<"sent" | "skipped" | "failed" | "auto_paused"> {
  const { currentPhase, currentStep, daysSinceSignup } = candidate;

  // Auto-graduate: if client became "active"/"inactive" and is still
  // in onboarding, skip to newsletter
  if (
    currentPhase === "onboarding" &&
    (candidate.clientStatus === "active" ||
      candidate.clientStatus === "inactive")
  ) {
    await graduateToNewsletter(admin, candidate);
    return "skipped";
  }

  // Look up the drip email for this step
  const { data: dripEmail } = await admin
    .from("drip_emails")
    .select("*")
    .eq("phase", currentPhase)
    .eq("step", currentStep)
    .single();

  if (!dripEmail || !dripEmail.is_active) {
    return "skipped";
  }

  // Check if day offset has been reached
  if (daysSinceSignup < dripEmail.day_offset) {
    return "skipped";
  }

  // Idempotency: check email_logs
  const templateKey = `drip_${currentPhase}_${currentStep}`;
  const { count: alreadySent } = await admin
    .from("email_logs")
    .select("id", { count: "exact", head: true })
    .eq("template_key", templateKey)
    .eq("recipient", candidate.email);

  if ((alreadySent ?? 0) > 0) {
    await advanceProgress(admin, candidate, phaseCounts);
    return "skipped";
  }

  // Engagement check
  const cold = await isContactCold(candidate.email);
  if (cold) {
    await admin
      .from("user_profiles")
      .update({
        email_paused: true,
        email_paused_at: new Date().toISOString(),
        email_pause_reason: `${COLD_THRESHOLD}_consecutive_unopened`,
      })
      .eq("id", candidate.userId);
    return "auto_paused";
  }

  // Build email
  const unsubscribeUrl = candidate.unsubscribeToken
    ? `${BASE_URL}/api/email/unsubscribe?token=${candidate.unsubscribeToken}`
    : undefined;

  const variables: Record<string, string> = {
    firstName: candidate.firstName,
    unsubscribeUrl: unsubscribeUrl || "",
  };

  // Password reset URL if needed
  const needsReset =
    dripEmail.body_html.includes("{{passwordResetUrl}}") ||
    (dripEmail.cta_url && dripEmail.cta_url === "{{passwordResetUrl}}");
  if (needsReset) {
    const resetUrl = await generatePasswordResetUrl(candidate.email);
    variables.passwordResetUrl =
      resetUrl || `${BASE_URL}/forgot-password`;
  }

  let bodyHtml = replacePlaceholders(dripEmail.body_html, variables);

  // Add CTA button if defined
  if (dripEmail.cta_text && dripEmail.cta_url) {
    let ctaUrl = replacePlaceholders(dripEmail.cta_url, variables);
    if (ctaUrl.startsWith("/")) {
      ctaUrl = `${BASE_URL}${ctaUrl}`;
    }
    bodyHtml += `<div style="text-align:center;margin:28px 0;"><a href="${ctaUrl}" style="display:inline-block;background:${siteConfig.brand.primary};color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">${dripEmail.cta_text}</a></div>`;
  }

  const subject = replacePlaceholders(dripEmail.subject, variables);
  const html = baseTemplate(subject, bodyHtml, BASE_URL, unsubscribeUrl);

  const emailResult = await sendRawEmail({
    to: candidate.email,
    subject,
    html,
  });

  await logEmail(
    candidate.email,
    subject,
    templateKey,
    emailResult.success ? "sent" : "failed",
    {
      userId: candidate.userId,
      dripEmailId: dripEmail.id,
      dripPhase: currentPhase,
      dripStep: currentStep,
    }
  );

  if (!emailResult.success) return "failed";

  await advanceProgress(admin, candidate, phaseCounts);
  return "sent";
}

// ── Progress management ─────────────────────────────────

async function graduateToNewsletter(
  admin: ReturnType<typeof createAdminClient>,
  candidate: DripCandidate
) {
  const data = {
    current_phase: "newsletter",
    current_step: 0,
    last_sent_at: new Date().toISOString(),
  };

  if (candidate.progressId) {
    await admin
      .from("drip_progress")
      .update(data)
      .eq("id", candidate.progressId);
  } else {
    await admin.from("drip_progress").insert({
      user_id: candidate.userId,
      ...data,
    });
  }
}

async function advanceProgress(
  admin: ReturnType<typeof createAdminClient>,
  candidate: DripCandidate,
  phaseCounts: { onboarding: number; newsletter: number }
) {
  const { currentPhase, currentStep, userId, progressId } = candidate;

  let nextPhase: "onboarding" | "newsletter" = currentPhase;
  let nextStep = currentStep + 1;
  let completedAt: string | null = null;

  // Phase transition
  if (
    currentPhase === "onboarding" &&
    nextStep >= phaseCounts.onboarding
  ) {
    nextPhase = "newsletter";
    nextStep = 0;
  } else if (
    currentPhase === "newsletter" &&
    nextStep >= phaseCounts.newsletter
  ) {
    completedAt = new Date().toISOString();
  }

  const data = {
    current_phase: nextPhase,
    current_step: nextStep,
    last_sent_at: new Date().toISOString(),
    completed_at: completedAt,
  };

  if (progressId) {
    await admin.from("drip_progress").update(data).eq("id", progressId);
  } else {
    await admin.from("drip_progress").insert({
      user_id: userId,
      ...data,
    });
  }
}
