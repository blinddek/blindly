/**
 * Availability engine — calculates available dates and time slots.
 *
 * All calculations use the site timezone (from siteConfig.timezone).
 * Never trust client-side availability — always compute server-side.
 */

import { siteConfig } from "@/config/site";
import {
  getAvailabilityRules,
  getBlockedDates,
  getBookingsForDate,
  getServiceById,
  type AvailabilityRule,
  type BlockedDate,
} from "./queries";

const TZ = siteConfig.timezone; // e.g. "Africa/Johannesburg"

// ---------- Public API ----------

export interface TimeSlot {
  start: string; // "09:00"
  end: string; // "10:00"
}

/**
 * Get available dates for a service within a date range.
 * Returns date strings (YYYY-MM-DD) that have at least one available slot.
 */
export async function getAvailableDates(
  serviceId: string,
  rangeStart: string,
  rangeEnd: string
): Promise<string[]> {
  const service = await getServiceById(serviceId);
  if (!service) return [];

  const rules = await getAvailabilityRules(serviceId);
  const blockedDates = await getBlockedDates(rangeStart, rangeEnd);

  const availableDates: string[] = [];
  const start = new Date(rangeStart);
  const end = new Date(rangeEnd);

  // Minimum notice: can't book today if min notice > 0
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: TZ })
  );

  // Max advance date
  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + service.max_advance_days);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDateStr(d);

    // Skip dates beyond max advance
    if (d > maxDate) continue;

    // Skip past dates
    if (d < new Date(formatDateStr(now))) continue;

    // Check if day of week has rules
    const dayOfWeek = getDayOfWeek(d);
    const dayRules = rules.filter((r) => r.day_of_week === dayOfWeek);
    if (dayRules.length === 0) continue;

    // Check if entire day is blocked
    if (isDateBlocked(dateStr, blockedDates)) continue;

    // Check if at least one slot exists
    const slots = await computeSlots(
      service,
      dateStr,
      dayRules,
      blockedDates,
      now
    );
    if (slots.length > 0) {
      availableDates.push(dateStr);
    }
  }

  return availableDates;
}

/**
 * Get available time slots for a service on a specific date.
 */
export async function getAvailableSlots(
  serviceId: string,
  date: string
): Promise<TimeSlot[]> {
  const service = await getServiceById(serviceId);
  if (!service) return [];

  const rules = await getAvailabilityRules(serviceId);
  const blockedDates = await getBlockedDates(date, date);

  const d = new Date(date);
  const dayOfWeek = getDayOfWeek(d);
  const dayRules = rules.filter((r) => r.day_of_week === dayOfWeek);
  if (dayRules.length === 0) return [];

  if (isDateBlocked(date, blockedDates)) return [];

  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: TZ })
  );

  return computeSlots(service, date, dayRules, blockedDates, now);
}

// ---------- Internal Helpers ----------

async function computeSlots(
  service: {
    id: string;
    duration_minutes: number;
    buffer_minutes: number;
  },
  date: string,
  dayRules: AvailabilityRule[],
  blockedDates: BlockedDate[],
  now: Date
): Promise<TimeSlot[]> {
  // Get existing bookings for this date
  const existingBookings = await getBookingsForDate(date);

  const slots: TimeSlot[] = [];
  const slotDuration = service.duration_minutes;
  const buffer = service.buffer_minutes;

  // Partial-day blocks for this date
  const partialBlocks = blockedDates.filter(
    (b) => b.date === date && !b.all_day && b.start_time && b.end_time
  );

  for (const rule of dayRules) {
    const ruleStart = timeToMinutes(rule.start_time);
    const ruleEnd = timeToMinutes(rule.end_time);

    // Generate slots within this rule's window
    let slotStart = ruleStart;
    while (slotStart + slotDuration <= ruleEnd) {
      const slotEnd = slotStart + slotDuration;
      const startStr = minutesToTime(slotStart);
      const endStr = minutesToTime(slotEnd);

      // Check: is this slot in the past?
      if (isSlotInPast(date, startStr, now)) {
        slotStart = slotEnd + buffer;
        continue;
      }

      // Check: does this slot overlap with a partial-day block?
      if (
        partialBlocks.some((b) =>
          rangesOverlap(
            slotStart,
            slotEnd,
            timeToMinutes(b.start_time!),
            timeToMinutes(b.end_time!)
          )
        )
      ) {
        slotStart = slotEnd + buffer;
        continue;
      }

      // Check: does this slot conflict with existing bookings (including buffer)?
      const conflictsWithBooking = existingBookings.some((booking) => {
        const bookStart = timeToMinutes(booking.start_time);
        const bookEnd = timeToMinutes(booking.end_time);
        // Add buffer around existing booking
        return rangesOverlap(
          slotStart,
          slotEnd,
          bookStart - buffer,
          bookEnd + buffer
        );
      });

      if (!conflictsWithBooking) {
        slots.push({ start: startStr, end: endStr });
      }

      slotStart = slotEnd + buffer;
    }
  }

  return slots;
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDayOfWeek(d: Date): number {
  // 0=Sunday matching DB schema
  return d.getDay();
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function rangesOverlap(
  s1: number,
  e1: number,
  s2: number,
  e2: number
): boolean {
  return s1 < e2 && s2 < e1;
}

function isDateBlocked(date: string, blocks: BlockedDate[]): boolean {
  return blocks.some((b) => b.date === date && b.all_day);
}

function isSlotInPast(date: string, startTime: string, now: Date): boolean {
  const slotDate = new Date(`${date}T${startTime}:00`);
  return slotDate <= now;
}
