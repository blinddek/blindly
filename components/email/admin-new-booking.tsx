// components/email/admin-new-booking.tsx
// Sent to admin when a new booking is created

import * as React from "react";
import { Text } from "@react-email/components";

import {
  BaseLayout,
  CtaButton,
  InfoRow,
  styles,
  formatDate,
} from "./_base-layout";
import type { AdminNewBookingProps } from "@/lib/email-types";

export default function AdminNewBooking({
  clientName,
  clientEmail,
  bookingType,
  date,
  time,
  adminUrl,
}: AdminNewBookingProps) {
  return (
    <BaseLayout preview={`New booking: ${bookingType} on ${formatDate(date)}`}>
      <Text style={styles.h1}>New Booking</Text>

      <Text style={styles.paragraph}>
        A new booking has been made by {clientName} ({clientEmail}).
      </Text>

      <InfoRow label="Service" value={bookingType} />
      <InfoRow label="Date" value={formatDate(date)} />
      <InfoRow label="Time" value={time} />

      <CtaButton href={adminUrl}>View Booking</CtaButton>
    </BaseLayout>
  );
}
