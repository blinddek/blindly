/**
 * Config-driven booking cancel/reschedule policy engine.
 *
 * Reads thresholds from siteConfig.bookingPolicy with sensible defaults.
 * No hardcoded rules — every client site tunes their own policy.
 */

import { siteConfig } from "@/config/site";

const DEFAULT_POLICY = {
  cancelNoticeHours: 24,
  maxReschedules: 2,
  rescheduleNoticeHours: 24,
  lateCancelForfeit: true,
  allowSameDayBooking: true,
};

export function getPolicy() {
  return { ...DEFAULT_POLICY, ...siteConfig.bookingPolicy };
}

interface BookingForCancel {
  date: string | Date;
  start_time: string;
  status: string;
}

interface CancelResult {
  allowed: boolean;
  type?: "normal" | "late";
  reason?: string;
}

export function evaluateCancel(booking: BookingForCancel): CancelResult {
  const policy = getPolicy();
  const dateStr =
    typeof booking.date === "string"
      ? booking.date
      : booking.date.toISOString().split("T")[0];
  const sessionStart = new Date(`${dateStr}T${booking.start_time}`);
  const hoursUntil =
    (sessionStart.getTime() - Date.now()) / (1000 * 60 * 60);

  if (booking.status === "cancelled") {
    return { allowed: false, reason: "Already cancelled" };
  }
  if (hoursUntil < 0) {
    return { allowed: false, reason: "Session already started" };
  }

  if (hoursUntil < policy.cancelNoticeHours) {
    return {
      allowed: true,
      type: "late",
      reason: policy.lateCancelForfeit
        ? `Less than ${policy.cancelNoticeHours}h notice — credit will be forfeited`
        : `Less than ${policy.cancelNoticeHours}h notice`,
    };
  }

  return { allowed: true, type: "normal" };
}

interface BookingForReschedule {
  date: string | Date;
  start_time: string;
  reschedule_count: number;
}

interface RescheduleResult {
  allowed: boolean;
  reason?: string;
}

export function evaluateReschedule(
  booking: BookingForReschedule
): RescheduleResult {
  const policy = getPolicy();

  if (booking.reschedule_count >= policy.maxReschedules) {
    return {
      allowed: false,
      reason: `Maximum ${policy.maxReschedules} reschedules reached`,
    };
  }

  const dateStr =
    typeof booking.date === "string"
      ? booking.date
      : booking.date.toISOString().split("T")[0];
  const sessionStart = new Date(`${dateStr}T${booking.start_time}`);
  const hoursUntil =
    (sessionStart.getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntil < policy.rescheduleNoticeHours) {
    return {
      allowed: false,
      reason: `Must reschedule at least ${policy.rescheduleNoticeHours}h before the session`,
    };
  }

  return { allowed: true };
}
