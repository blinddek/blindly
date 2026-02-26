// components/email/booking-reminder-24h.tsx
// Sent 24 hours before a scheduled booking

import * as React from "react";
import { Text } from "@react-email/components";

import {
  BaseLayout,
  CtaButton,
  InfoRow,
  styles,
  formatDate,
} from "./_base-layout";
import type { BookingReminder24hProps } from "@/lib/email-types";

export default function BookingReminder24h({
  clientName,
  bookingType,
  date,
  time,
  videoLink,
  portalUrl,
}: BookingReminder24hProps) {
  return (
    <BaseLayout preview={`Reminder: ${bookingType} tomorrow at ${time}`}>
      <Text style={styles.h1}>Reminder: call tomorrow</Text>

      <Text style={styles.paragraph}>
        Hi {clientName}, just a heads-up — your {bookingType.toLowerCase()} is
        tomorrow.
      </Text>

      <InfoRow label="Date" value={formatDate(date)} />
      <InfoRow label="Time" value={time} />
      {videoLink && <InfoRow label="Join Link" value={videoLink} />}

      <CtaButton href={videoLink || portalUrl}>
        {videoLink ? "Join Call" : "View Booking"}
      </CtaButton>
    </BaseLayout>
  );
}
