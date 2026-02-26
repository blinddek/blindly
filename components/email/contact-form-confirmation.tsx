// components/email/contact-form-confirmation.tsx
// Sent to the person who submitted the contact form

import * as React from "react";
import { Text, Hr } from "@react-email/components";

import { BaseLayout, styles } from "./_base-layout";
import type { ContactFormConfirmationProps } from "@/lib/email-types";

export default function ContactFormConfirmation({
  senderName,
}: ContactFormConfirmationProps) {
  return (
    <BaseLayout
      preview={`Thanks for reaching out, ${senderName} — we'll be in touch soon`}
    >
      <Text style={styles.h1}>Thanks for reaching out, {senderName}!</Text>

      <Text style={styles.paragraph}>
        We&apos;ve received your message and we&apos;ll get back to you within
        24 hours — usually much sooner. If it&apos;s urgent, feel free to
        WhatsApp us directly.
      </Text>

      <Hr style={styles.hr} />

      <Text style={styles.paragraph}>
        In the meantime, feel free to browse our website to learn more about
        what we offer.
      </Text>
    </BaseLayout>
  );
}
