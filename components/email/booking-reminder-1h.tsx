// components/email/booking-reminder-1h.tsx
// Sent 1 hour before a scheduled booking

import * as React from "react";
import { Text } from "@react-email/components";

import { BaseLayout, CtaButton, InfoRow, styles } from "./_base-layout";
import type { BookingReminder1hProps } from "@/lib/email-types";

export default function BookingReminder1h({
  clientName,
  bookingType,
  time,
  videoLink,
  portalUrl,
}: BookingReminder1hProps) {
  return (
    <BaseLayout
      preview={`Starting in 1 hour: ${bookingType} at ${time}`}
    >
      <Text style={styles.h1}>Starting in 1 hour</Text>

      <Text style={styles.paragraph}>
        Hi {clientName}, your {bookingType.toLowerCase()} starts at{" "}
        <strong>{time}</strong> — that&apos;s in about an hour.
      </Text>

      {videoLink && <InfoRow label="Join Link" value={videoLink} />}

      <CtaButton href={videoLink || portalUrl}>
        {videoLink ? "Join Call" : "View Booking"}
      </CtaButton>
    </BaseLayout>
  );
}
