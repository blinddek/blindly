"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { ensureAdmin } from "@/lib/admin/auth";
import { getAvailableSlots } from "./availability";
import { sendEmail, notifyAdmin } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { siteConfig } from "@/config/site";
import type { LocalizedString } from "@/types/cms";

// ---------- Public: Create Booking ----------

export async function createBooking(data: {
  service_id: string;
  date: string;
  start_time: string;
  end_time: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  notes?: string;
  user_id?: string;
}): Promise<{ id: string; confirmation_token: string }> {
  // Rate limit booking creation
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(ip, { prefix: "booking", limit: 5, windowSeconds: 300 });
  if (!rl.success) {
    throw new Error("Too many booking attempts. Please try again in a few minutes.");
  }

  // Race condition guard: re-check slot availability before insert
  const slots = await getAvailableSlots(data.service_id, data.date);
  const slotAvailable = slots.some(
    (s) => s.start === data.start_time && s.end === data.end_time
  );
  if (!slotAvailable) {
    throw new Error(
      "This time slot is no longer available. Please choose another."
    );
  }

  const supabase = createAdminClient();

  // Get service details for email
  const { data: service } = await supabase
    .from("booking_services")
    .select("name, duration_minutes, price_cents")
    .eq("id", data.service_id)
    .single();

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      service_id: data.service_id,
      user_id: data.user_id ?? null,
      client_name: data.client_name,
      client_email: data.client_email,
      client_phone: data.client_phone,
      date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      notes: data.notes ?? null,
      status: "pending",
    })
    .select("id, confirmation_token")
    .single();

  if (error) throw new Error(error.message);

  // TODO: Google Calendar sync — see INTEGRATION_GOOGLE_CALENDAR_SYNC.md
  // If isEnabled("googleCalendar") && isGoogleCalendarConnected():
  //   const eventId = await createCalendarEvent(booking);
  //   await supabase.from("bookings").update({ google_calendar_event_id: eventId }).eq("id", booking.id);

  const serviceName =
    service?.name && typeof service.name === "object"
      ? (service.name as { en?: string }).en ?? "Appointment"
      : "Appointment";

  // Send confirmation email to client
  try {
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${siteConfig.domain}`;
    await sendEmail({
      to: data.client_email,
      template: "booking_confirmed",
      props: {
        clientName: data.client_name,
        bookingType: serviceName,
        date: data.date,
        time: data.start_time,
        portalUrl: `${siteUrl}/portal/bookings`,
      },
    });
  } catch (err) {
    console.error("[booking] Failed to send confirmation email:", err);
  }

  // Notify admin
  try {
    await notifyAdmin("admin_new_booking", {
      clientName: data.client_name,
      clientEmail: data.client_email,
      bookingType: serviceName,
      date: data.date,
      time: data.start_time,
      adminUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/admin/booking/${booking.id}`,
    });
  } catch (err) {
    console.error("[booking] Failed to notify admin:", err);
  }

  revalidatePath("/admin/booking");
  return booking;
}

// ---------- Customer: Cancel Own Booking ----------

export async function cancelBookingByCustomer(
  bookingId: string,
  userId: string
): Promise<{ error?: string }> {
  const supabase = createAdminClient();

  // Verify the booking belongs to this user and is cancellable
  const { data: booking } = await supabase
    .from("bookings")
    .select("*, service:booking_services(name, cancellation_cutoff_hours)")
    .eq("id", bookingId)
    .eq("user_id", userId)
    .single();

  if (!booking) return { error: "Booking not found." };

  if (booking.status === "cancelled" || booking.status === "completed") {
    return { error: "This booking cannot be cancelled." };
  }

  // Check cancellation cutoff
  const cutoffHours = booking.service?.cancellation_cutoff_hours ?? 24;
  const bookingTime = new Date(`${booking.date}T${booking.start_time}`);
  const hoursUntil = (bookingTime.getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntil < cutoffHours) {
    return { error: `Cancellations must be made at least ${cutoffHours} hours in advance.` };
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", bookingId);

  if (error) return { error: error.message };

  revalidatePath("/portal/bookings");
  revalidatePath("/admin/booking");
  return {};
}

// ---------- Customer: Update Client Notes ----------

export async function updateClientNotes(
  bookingId: string,
  userId: string,
  notes: string
): Promise<{ error?: string }> {
  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, user_id, status")
    .eq("id", bookingId)
    .eq("user_id", userId)
    .single();

  if (!booking) return { error: "Booking not found." };

  if (booking.status === "cancelled") {
    return { error: "Cannot update notes for a cancelled booking." };
  }

  const { error } = await supabase
    .from("bookings")
    .update({ client_notes: notes.trim() || null, updated_at: new Date().toISOString() })
    .eq("id", bookingId);

  if (error) return { error: error.message };

  revalidatePath("/portal/bookings");
  return {};
}

// ---------- Admin: Update Booking Status ----------

export async function updateBookingStatus(
  id: string,
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show"
) {
  await ensureAdmin();
  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, service:booking_services(name)")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("bookings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  // Send cancellation email if cancelled
  if (status === "cancelled" && booking) {
    const serviceName =
      booking.service?.name && typeof booking.service.name === "object"
        ? (booking.service.name as { en?: string }).en ?? "Appointment"
        : "Appointment";

    // TODO: Google Calendar sync — delete calendar event on cancellation
    // if (booking.google_calendar_event_id) {
    //   await deleteCalendarEvent(booking.google_calendar_event_id);
    // }

    try {
      await sendEmail({
        to: booking.client_email,
        template: "booking_cancellation",
        props: {
          clientName: booking.client_name,
          bookingType: serviceName,
          date: booking.date,
          time: booking.start_time,
          bookingUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/book`,
        },
      });
    } catch (err) {
      console.error("[booking] Failed to send cancellation email:", err);
    }
  }

  revalidatePath("/admin/booking");
}

// ---------- Admin: Update Booking Notes ----------

export async function updateBookingNotes(id: string, adminNotes: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bookings")
    .update({ admin_notes: adminNotes, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/booking/${id}`);
}

// ---------- Admin: Delete Booking ----------

export async function deleteBooking(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();

  // TODO: Google Calendar sync — delete calendar event
  // const { data: booking } = await supabase.from("bookings").select("google_calendar_event_id").eq("id", id).single();
  // if (booking?.google_calendar_event_id) {
  //   await deleteCalendarEvent(booking.google_calendar_event_id);
  // }

  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/booking");
}

// ---------- Admin: Service CRUD ----------

export async function upsertBookingService(data: {
  id?: string;
  name: LocalizedString;
  description?: LocalizedString | null;
  duration_minutes: number;
  buffer_minutes: number;
  price_cents: number;
  cancellation_cutoff_hours: number;
  max_advance_days: number;
  is_active?: boolean;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("booking_services").upsert({
    ...data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/booking/services");
  revalidatePath("/book");
}

export async function deleteBookingService(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("booking_services")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/booking/services");
  revalidatePath("/book");
}

// ---------- Admin: Availability Rules ----------

export async function upsertAvailabilityRule(data: {
  id?: string;
  service_id?: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active?: boolean;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("availability_rules").upsert({
    ...data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/booking/availability");
  revalidatePath("/book");
}

export async function deleteAvailabilityRule(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("availability_rules")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/booking/availability");
  revalidatePath("/book");
}

// ---------- Admin: Blocked Dates ----------

export async function createBlockedDate(data: {
  date: string;
  reason?: { en: string; af: string };
  all_day?: boolean;
  start_time?: string;
  end_time?: string;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("blocked_dates").insert({
    date: data.date,
    reason: data.reason ?? { en: "", af: "" },
    all_day: data.all_day ?? true,
    start_time: data.start_time ?? null,
    end_time: data.end_time ?? null,
    source: "manual",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/booking/availability");
  revalidatePath("/book");
}

export async function deleteBlockedDate(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("blocked_dates")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/booking/availability");
  revalidatePath("/book");
}
