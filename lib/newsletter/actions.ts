"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

export type NewsletterState = {
  success?: boolean;
  error?: string;
} | null;

export async function subscribeNewsletter(
  _prevState: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  // Rate limit by IP — 3 subscriptions per 5 minutes
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(ip, { prefix: "newsletter", limit: 3, windowSeconds: 300 });
  if (!rl.success) {
    return { error: "Too many attempts. Please try again in a few minutes." };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("newsletter_subscribers")
    .upsert(
      { email, is_active: true, source: "footer" },
      { onConflict: "email" }
    );

  if (error) {
    return { error: "Something went wrong. Please try again." };
  }

  // Fire-and-forget newsletter welcome email
  sendEmail({
    to: email,
    template: "newsletter_welcome",
    props: {},
    unsubscribeToken: email,
  }).catch((err) => console.error("[email] newsletter_welcome failed:", err));

  return { success: true };
}
