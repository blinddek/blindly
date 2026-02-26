"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, notifyAdmin } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

export type ContactFormState = {
  success?: boolean;
  error?: string;
} | null;

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  // Honeypot check — bots fill in the hidden "website" field
  const honeypot = (formData.get("website") as string)?.trim();
  if (honeypot) {
    return { success: true };
  }

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim();
  const message = (formData.get("message") as string)?.trim();

  if (!name || !email || !message) {
    return { error: "Please fill in your name, email, and message." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  // Rate limit by IP — 5 submissions per 5 minutes
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(ip, { prefix: "contact", limit: 5, windowSeconds: 300 });
  if (!rl.success) {
    return { error: "Too many submissions. Please try again in a few minutes." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("contact_submissions").insert({
    name,
    email,
    phone: phone || "",
    message,
  });

  if (error) {
    console.error("[contact] Failed to save submission:", error);
    return { error: "Something went wrong. Please try again." };
  }

  // Fire-and-forget confirmation + admin notification
  Promise.all([
    sendEmail({
      to: email,
      template: "contact_form_confirmation",
      props: { senderName: name },
    }),
    notifyAdmin("admin_new_message", {
      clientName: name,
      projectName: "Contact Form",
      messagePreview: message.slice(0, 200),
      adminUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin`,
    }),
  ]).catch((err) => console.error("[email] contact_form failed:", err));

  return { success: true };
}
