// components/email/newsletter-welcome.tsx
// Sent when someone subscribes to the newsletter

import * as React from "react";
import { Text } from "@react-email/components";

import { BaseLayout, styles } from "./_base-layout";
import type { NewsletterWelcomeProps } from "@/lib/email-types";

export default function NewsletterWelcome({
  subscriberName,
  unsubscribeToken,
}: NewsletterWelcomeProps) {
  return (
    <BaseLayout
      preview="Thanks for subscribing!"
      unsubscribeToken={unsubscribeToken}
    >
      <Text style={styles.h1}>
        You&apos;re in{subscriberName ? `, ${subscriberName}` : ""}!
      </Text>

      <Text style={styles.paragraph}>
        Thanks for subscribing to our newsletter. We&apos;ll keep you in the
        loop with useful updates, tips, and the occasional behind-the-scenes
        look at what we&apos;re working on.
      </Text>

      <Text style={styles.paragraph}>
        No spam, no fluff — just useful stuff delivered straight to your inbox.
      </Text>
    </BaseLayout>
  );
}
