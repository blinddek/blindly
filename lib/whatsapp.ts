/**
 * WhatsApp Cloud API integration — send messages via Meta's API.
 * Only used when isEnabled("whatsapp") + WHATSAPP_PHONE_NUMBER_ID is set.
 */

import { createAdminClient } from "@/lib/supabase/admin";

const API_BASE = "https://graph.facebook.com/v18.0";

export async function sendWhatsApp(
  to: string,
  templateName: string,
  variables?: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.warn("[whatsapp] Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN");
    return { success: false, error: "WhatsApp not configured" };
  }

  // Fetch template from DB
  const admin = createAdminClient();
  const { data: template } = await admin
    .from("whatsapp_templates")
    .select("body, variables")
    .eq("name", templateName)
    .single();

  if (!template) {
    return { success: false, error: `Template "${templateName}" not found` };
  }

  // Substitute variables in body
  let body = template.body as string;
  if (variables) {
    for (const [key, value] of Object.entries(variables)) {
      body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
  }

  try {
    const res = await fetch(`${API_BASE}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.replace(/[^0-9]/g, ""),
        type: "text",
        text: { body },
      }),
    });

    const json = await res.json();
    const messageId = json.messages?.[0]?.id;

    // Log
    await admin.from("whatsapp_logs").insert({
      recipient: to,
      template_name: templateName,
      body,
      status: res.ok ? "sent" : "failed",
      message_id: messageId ?? null,
      error: res.ok ? null : JSON.stringify(json.error ?? json),
    });

    if (!res.ok) {
      return { success: false, error: json.error?.message ?? "Send failed" };
    }

    return { success: true, messageId };
  } catch (err) {
    await admin.from("whatsapp_logs").insert({
      recipient: to,
      template_name: templateName,
      body,
      status: "failed",
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return { success: false, error: err instanceof Error ? err.message : "Send failed" };
  }
}
