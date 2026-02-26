// components/email/admin-new-message.tsx
// Sent to admin when a client sends a new message

import * as React from "react";
import { Text, Section } from "@react-email/components";
import {
  BaseLayout,
  CtaButton,
  InfoRow,
  styles,
  brand,
} from "./_base-layout";
import type { AdminNewMessageProps } from "@/lib/email-types";

export default function AdminNewMessage({
  clientName,
  projectName,
  messagePreview,
  adminUrl,
}: AdminNewMessageProps) {
  return (
    <BaseLayout
      preview={`New message from ${clientName}`}
      showPortalLink={false}
    >
      <Text style={styles.h1}>New message from {clientName}</Text>

      <InfoRow label="Project" value={projectName} />

      <Section style={styles.infoBox}>
        <Text
          style={{
            color: brand.textSecondary,
            fontSize: "14px",
            lineHeight: "1.6",
            margin: "0",
            fontStyle: "italic",
          }}
        >
          &ldquo;{messagePreview}&rdquo;
        </Text>
      </Section>

      <CtaButton href={adminUrl}>Reply in Admin</CtaButton>
    </BaseLayout>
  );
}
