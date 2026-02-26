import { createClient } from "@/lib/supabase/server";
import { getUserBookings } from "@/lib/booking/queries";
import { BookingsClient } from "@/components/portal/bookings-client";
import type { LocalizedString } from "@/types";

export default async function PortalBookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const bookings = await getUserBookings(user.id);

  // Load services for name + duration + cancellation cutoff
  const { data: services } = await supabase
    .from("booking_services")
    .select("id, name, duration_minutes, cancellation_cutoff_hours");

  const serviceMap = new Map(
    (services ?? []).map(
      (s: {
        id: string;
        name: LocalizedString;
        duration_minutes: number;
        cancellation_cutoff_hours: number;
      }) => [s.id, s]
    )
  );

  // Serialize bookings with service info for the client component
  const serialized = bookings.map((b) => {
    const service = serviceMap.get(b.service_id);
    return {
      id: b.id,
      date: b.date,
      startTime: b.start_time,
      endTime: b.end_time,
      status: b.status,
      serviceName: service?.name?.en ?? "Appointment",
      durationMinutes: service?.duration_minutes ?? 60,
      cutoffHours: service?.cancellation_cutoff_hours ?? 24,
      clientNotes: b.client_notes,
      meetingUrl: b.meeting_url,
    };
  });

  return <BookingsClient bookings={serialized} userId={user.id} />;
}
