/**
 * Custom password reset flow — bypasses Supabase SMTP.
 *
 * Uses crypto.randomBytes for token generation, SHA-256 for hashing,
 * and stores token hashes in password_reset_tokens table.
 *
 * Flow:
 *   1. User submits email on /forgot-password
 *   2. Server generates token, stores hash, sends email via Resend
 *   3. User clicks link → /reset-password?token=xxx
 *   4. Server validates hash + expiry → updates password via admin client
 */

"use server";

import { randomBytes, createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderEmail } from "@/lib/email-render";
import { sendRawEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

const TOKEN_EXPIRY_MINUTES = 60;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordReset(
  _prevState: { error?: string; success?: boolean },
  formData: FormData
) {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(ip, {
    prefix: "password_reset",
    limit: 3,
    windowSeconds: 300,
  });
  if (!rl.success) {
    return { error: "Too many attempts. Please try again in a few minutes." };
  }

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) return { error: "Email is required." };

  const admin = createAdminClient();

  // Find user by email (always return success to prevent enumeration)
  const { data: users } = await admin.auth.admin.listUsers();
  const user = users?.users?.find(
    (u) => u.email?.toLowerCase() === email
  );

  if (user) {
    // Generate token
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(
      Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000
    ).toISOString();

    // Invalidate previous tokens
    await admin
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("user_id", user.id)
      .eq("used", false);

    // Store new token hash
    await admin.from("password_reset_tokens").insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    // Send email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${rawToken}`;
    const name =
      user.user_metadata?.full_name || user.email?.split("@")[0] || "there";

    const rendered = await renderEmail("password_reset", {
      name,
      resetUrl,
      expiryMinutes: String(TOKEN_EXPIRY_MINUTES),
    }).catch(() => null);

    if (rendered) {
      await sendRawEmail({
        to: email,
        subject: rendered.subject,
        html: rendered.html,
      }).catch(console.error);
    }
  }

  // Always return success (prevent user enumeration)
  return {
    success: true,
    error: undefined,
  };
}

export async function resetPassword(
  _prevState: { error?: string; success?: boolean },
  formData: FormData
) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token) return { error: "Invalid or missing reset token." };
  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (!/\d/.test(password)) {
    return { error: "Password must contain at least one number." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const admin = createAdminClient();
  const tokenHash = hashToken(token);

  // Find valid token
  const { data: resetToken } = await admin
    .from("password_reset_tokens")
    .select("id, user_id, expires_at, used")
    .eq("token_hash", tokenHash)
    .single();

  if (!resetToken || resetToken.used) {
    return { error: "This reset link has already been used or is invalid." };
  }

  if (new Date(resetToken.expires_at) < new Date()) {
    return { error: "This reset link has expired. Please request a new one." };
  }

  // Update password
  const { error: updateError } = await admin.auth.admin.updateUserById(
    resetToken.user_id,
    { password }
  );

  if (updateError) {
    return { error: "Failed to update password. Please try again." };
  }

  // Mark token as used
  await admin
    .from("password_reset_tokens")
    .update({ used: true })
    .eq("id", resetToken.id);

  // Mark password as changed in profile
  await admin
    .from("user_profiles")
    .update({ password_changed: true })
    .eq("id", resetToken.user_id);

  return { success: true };
}
