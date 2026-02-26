// components/email/booking-cancellation.tsx
// Sent when an admin cancels a client's booking

import * as React from "react";
import { Text, Hr } from "@react-email/components";

import {
  BaseLayout,
  CtaButton,
  InfoRow,
  styles,
  formatDate,
} from "./_base-layout";
import type { BookingCancellationProps } from "@/lib/email-types";

export default function BookingCancellation({
  clientName,
  bookingType,
  date,
  time,
  bookingUrl,
}: BookingCancellationProps) {
  return (
    <BaseLayout
      preview={`Your ${bookingType} on ${formatDate(date)} has been cancelled`}
    >
      <Text style={styles.h1}>Booking Cancelled</Text>

      <Text style={styles.paragraph}>
        Hi {clientName}, your {bookingType.toLowerCase()} has been cancelled.
      </Text>

      <InfoRow label="What" value={bookingType} />
      <InfoRow label="Date" value={formatDate(date)} />
      <InfoRow label="Time" value={time} />

      <Hr style={styles.hr} />

      <Text style={styles.paragraph}>
        If you&apos;d like to reschedule, you can book a new appointment at any
        time.
      </Text>

      <CtaButton href={bookingUrl}>Book Again</CtaButton>
    </BaseLayout>
  );
}
