// components/email/booking-confirmed.tsx
// Sent when a client books a call/meeting

import * as React from "react";
import { Text, Hr } from "@react-email/components";

import {
  BaseLayout,
  CtaButton,
  InfoRow,
  styles,
  formatDate,
} from "./_base-layout";
import type { BookingConfirmedProps } from "@/lib/email-types";

export default function BookingConfirmed({
  clientName,
  bookingType,
  date,
  time,
  videoLink,
  portalUrl,
}: BookingConfirmedProps) {
  return (
    <BaseLayout
      preview={`Your ${bookingType} is booked for ${formatDate(date)} at ${time}`}
    >
      <Text style={styles.h1}>You&apos;re booked in, {clientName}!</Text>

      <Text style={styles.paragraph}>
        Your {bookingType.toLowerCase()} has been confirmed. Here are the
        details:
      </Text>

      <InfoRow label="What" value={bookingType} />
      <InfoRow label="Date" value={formatDate(date)} />
      <InfoRow label="Time" value={time} />
      {videoLink && <InfoRow label="Join Link" value={videoLink} />}

      <Hr style={styles.hr} />

      <Text style={styles.paragraph}>
        We&apos;ll send you a reminder 24 hours before and again 1 hour before
        the call. If you need to reschedule, you can do so from your portal.
      </Text>

      <CtaButton href={portalUrl}>View Your Bookings</CtaButton>
    </BaseLayout>
  );
}
