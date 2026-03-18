// components/email/welcome.tsx
// Welcome email sent when a new client joins the platform

import * as React from "react";
import { Text, Hr } from "@react-email/components";
import {
  BaseLayout,
  CtaButton,
  styles,
} from "./_base-layout";
import type { WelcomeProps } from "@/lib/email-types";

export default function Welcome({ clientName, portalUrl }: WelcomeProps) {
  return (
    <BaseLayout preview={`Welcome to Blindly, ${clientName}! Your account is ready.`}>
      <Text style={styles.h1}>Welcome to Blindly, {clientName}!</Text>

      <Text style={styles.paragraph}>
        We&apos;re thrilled to have you on board. Your client portal is set up and
        ready to go — it&apos;s your one-stop spot to track your project, review
        milestones, share feedback, and stay in the loop every step of the way.
      </Text>

      <Text style={styles.paragraph}>
        No more back-and-forth emails or guessing where things stand. Everything
        you need is in one place, and you can check in anytime that suits you.
      </Text>

      <Hr style={styles.hr} />

      <Text style={styles.paragraph}>
        Jump in and have a look around — we&apos;ll be right here if you need
        anything.
      </Text>

      <CtaButton href={portalUrl}>Open Your Portal</CtaButton>
    </BaseLayout>
  );
}
