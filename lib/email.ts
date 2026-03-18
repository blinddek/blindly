/**
 * Unified email sender — Resend API primary, SMTP fallback.
 * Resend API primary, SMTP fallback.
 *
 * Usage:
 *   import { sendEmail, notifyAdmin } from "@/lib/email";
 */

import { createElement } from "react";
import { Resend } from "resend";
import { render } from "@react-email/render";
import type { EmailTemplate } from "./email-types";

// Templates — lazy imports to keep bundle small
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each template has unique props
const templates: Record<EmailTemplate, () => Promise<{ default: React.ComponentType<any> }>> = {
  welcome: () => import("@/components/email/welcome"),
  booking_confirmed: () => import("@/components/email/booking-confirmed"),
  booking_reminder_24h: () => import("@/components/email/booking-reminder-24h"),
  booking_reminder_1h: () => import("@/components/email/booking-reminder-1h"),
  booking_cancellation: () => import("@/components/email/booking-cancellation"),
  admin_new_booking: () => import("@/components/email/admin-new-booking"),
  newsletter_welcome: () => import("@/components/email/newsletter-welcome"),
  contact_form_confirmation: () => import("@/components/email/contact-form-confirmation"),
  order_confirmation: () => import("@/components/email/order-confirmation"),
  admin_new_order: () => import("@/components/email/admin-new-order"),
  enrollment_confirmation: () => import("@/components/email/enrollment-confirmation"),
  admin_new_message: () => import("@/components/email/admin-new-message"),
  blindly_order_confirmation: () => import("@/components/email/blindly-order-confirmation"),
  blindly_supplier_order: () => import("@/components/email/blindly-supplier-order"),
};

// Subject line generators
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- subject generators access varied props
const subjects: Record<EmailTemplate, (props: Record<string, any>) => string> = {
  welcome: () => "Welcome! Your account is ready",
  booking_confirmed: (p) => `Booking confirmed — ${p.bookingType} on ${p.date}`,
  booking_reminder_24h: (p) => `Reminder: ${p.bookingType} tomorrow at ${p.time}`,
  booking_reminder_1h: (p) => `Starting soon: ${p.bookingType} at ${p.time}`,
  booking_cancellation: (p) => `Booking cancelled — ${p.bookingType} on ${p.date}`,
  admin_new_booking: (p) => `New booking — ${p.bookingType} on ${p.date} at ${p.time}`,
  newsletter_welcome: () => "Welcome to our newsletter!",
  contact_form_confirmation: (p) => `Thanks for reaching out, ${p.senderName}!`,
  order_confirmation: (p) => `Order Confirmed — ${p.orderReference}`,
  admin_new_order: (p) => `New Order — ${p.orderReference} (${p.total})`,
  enrollment_confirmation: (p) => `You're enrolled — ${p.courseName}`,
  admin_new_message: (p) => `New message from ${p.clientName}`,
  blindly_order_confirmation: (p) => `Order Confirmed — ${p.orderNumber}`,
  blindly_supplier_order: (p) => `New Blind Order — ${p.orderNumber} (${p.items?.length ?? 0} blinds)`,
};

// ─── Resend Instance ──────────────────────────────────────

const FROM_ADDRESS = process.env.RESEND_FROM || "noreply@example.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";

// ─── Send Function ────────────────────────────────────────

interface SendEmailOptions {
  to: string | string[];
  template: EmailTemplate;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- template props vary per template
  props: Record<string, any>;
  replyTo?: string;
  unsubscribeToken?: string;
}

export async function sendEmail({
  to,
  template,
  props,
  replyTo,
  unsubscribeToken,
}: SendEmailOptions) {
  try {
    const mod = await templates[template]();
    const EmailComponent = mod.default;
    const html = await render(createElement(EmailComponent, { ...props, unsubscribeToken }));
    const subject = subjects[template](props);
    const recipients = Array.isArray(to) ? to : [to];
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

    const headers: Record<string, string> = {};
    if (unsubscribeToken) {
      headers["List-Unsubscribe"] = `<${siteUrl}/api/email/unsubscribe?token=${unsubscribeToken}>`;
    }

    // Try Resend first
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: recipients,
        subject,
        html,
        replyTo,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
      });

      if (error) {
        console.error(`[Email] Resend failed for ${template}:`, error);
        // Fall through to SMTP if available
        if (!process.env.SMTP_HOST) {
          return { success: false, error };
        }
      } else {
        console.log(`[Email] Sent ${template} to ${to} via Resend — id: ${data?.id}`);
        return { success: true, id: data?.id };
      }
    }

    // SMTP fallback
    if (process.env.SMTP_HOST) {
      const nodemailer = await import("nodemailer");
      const transport = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transport.sendMail({
        from: FROM_ADDRESS,
        to: recipients.join(", "),
        subject,
        html,
        replyTo,
        headers,
      });

      console.log(`[Email] Sent ${template} to ${to} via SMTP`);
      return { success: true };
    }

    throw new Error("No email provider configured — set RESEND_API_KEY or SMTP_HOST");
  } catch (err) {
    console.error(`[Email] Exception sending ${template}:`, err);
    return { success: false, error: err };
  }
}

// ─── Send Raw HTML Email (for DB-backed templates) ───────

interface SendRawEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendRawEmail({ to, subject, html, replyTo }: SendRawEmailOptions) {
  const recipients = Array.isArray(to) ? to : [to];

  try {
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: recipients,
        subject,
        html,
        replyTo,
      });

      if (error) {
        console.error("[Email] Resend failed for raw email:", error);
        if (!process.env.SMTP_HOST) return { success: false, error };
      } else {
        console.log(`[Email] Sent raw email to ${to} via Resend — id: ${data?.id}`);
        return { success: true, id: data?.id };
      }
    }

    if (process.env.SMTP_HOST) {
      const nodemailer = await import("nodemailer");
      const transport = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      await transport.sendMail({
        from: FROM_ADDRESS,
        to: recipients.join(", "),
        subject,
        html,
        replyTo,
      });

      console.log(`[Email] Sent raw email to ${to} via SMTP`);
      return { success: true };
    }

    throw new Error("No email provider configured");
  } catch (err) {
    console.error("[Email] Exception sending raw email:", err);
    return { success: false, error: err };
  }
}

// ─── Send Email with File Attachment ──────────────────────

interface SendWithAttachmentOptions {
  to: string | string[];
  template: EmailTemplate;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  attachment: { filename: string; content: Buffer };
}

export async function sendEmailWithAttachment({
  to,
  template,
  props,
  attachment,
}: SendWithAttachmentOptions) {
  try {
    const mod = await templates[template]();
    const EmailComponent = mod.default;
    const html = await render(createElement(EmailComponent, props));
    const subject = subjects[template](props);
    const recipients = Array.isArray(to) ? to : [to];

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: recipients,
        subject,
        html,
        attachments: [
          {
            filename: attachment.filename,
            content: attachment.content,
            content_type: "application/vnd.ms-excel",
          },
        ],
      });

      if (error) {
        console.error(`[Email] Resend failed for ${template}:`, error);
        return { success: false, error };
      }

      console.log(`[Email] Sent ${template} with attachment to ${to} — id: ${data?.id}`);
      return { success: true, id: data?.id };
    }

    throw new Error("No email provider configured for attachments — set RESEND_API_KEY");
  } catch (err) {
    console.error(`[Email] Exception sending ${template} with attachment:`, err);
    return { success: false, error: err };
  }
}

// ─── Convenience: Send Admin Notification ─────────────────

export async function notifyAdmin(
  template: EmailTemplate,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- template props vary per template
  props: Record<string, any>
) {
  return sendEmail({
    to: ADMIN_EMAIL,
    template,
    props,
  });
}
