"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureAdmin } from "@/lib/admin/auth";
import { sendRawEmail } from "@/lib/email";

export async function getEmailTemplates() {
  await ensureAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("email_templates")
    .select("*")
    .order("key");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateEmailTemplate(
  id: string,
  subject: string,
  bodyHtml: string
) {
  await ensureAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("email_templates")
    .update({ subject, body_html: bodyHtml })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/email-templates");
  return { success: true };
}

export async function sendTestEmail(
  templateId: string,
  recipientEmail: string
) {
  await ensureAdmin();
  const admin = createAdminClient();

  const { data: template } = await admin
    .from("email_templates")
    .select("key, subject, body_html, variables")
    .eq("id", templateId)
    .single();

  if (!template) return { error: "Template not found" };

  // Replace variables with test values
  const testVars: Record<string, string> = {};
  const variables = (template.variables as string[]) || [];
  for (const v of variables) {
    testVars[v] = `[${v}]`;
  }

  let subject = template.subject;
  let html = template.body_html;

  for (const [key, val] of Object.entries(testVars)) {
    subject = subject.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val);
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val);
  }

  // Remove conditional blocks for test
  html = html.replace(/\{\{#\w+\}\}([\s\S]*?)\{\{\/\w+\}\}/g, "$1");

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
    template_key: template.key,
    status: "sent",
    metadata: { test: true },
  });

  return { success: true };
}
