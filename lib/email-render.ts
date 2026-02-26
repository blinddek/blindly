/**
 * DB-backed email template renderer.
 *
 * Fetches template from email_templates table, substitutes {{variables}},
 * returns ready-to-send { subject, html }.
 *
 * Falls back gracefully if template not found (returns null).
 *
 * Usage:
 *   const email = await renderEmail("booking_confirmation", {
 *     clientName: "John",
 *     sessionType: "Consultation",
 *     date: "Monday, 3 March 2026",
 *     time: "10:00 – 11:00 (SAST)",
 *   });
 *   if (email) await sendEmail({ to, ...email });
 */

import { createAdminClient } from "@/lib/supabase/admin";

interface RenderedEmail {
  subject: string;
  html: string;
}

/**
 * Substitute {{variable}} placeholders in a string.
 * Also supports {{#variable}}...{{/variable}} conditional blocks.
 */
function substitute(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;

  // Handle conditional blocks: {{#key}}content{{/key}}
  result = result.replace(
    /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_, key, content) => {
      return variables[key] ? substitute(content, variables) : "";
    }
  );

  // Handle simple variables: {{key}}
  result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return variables[key] ?? "";
  });

  return result;
}

export async function renderEmail(
  templateKey: string,
  variables: Record<string, string>
): Promise<RenderedEmail | null> {
  const admin = createAdminClient();

  const { data: template } = await admin
    .from("email_templates")
    .select("subject, body_html")
    .eq("key", templateKey)
    .single();

  if (!template) return null;

  return {
    subject: substitute(template.subject, variables),
    html: substitute(template.body_html, variables),
  };
}
