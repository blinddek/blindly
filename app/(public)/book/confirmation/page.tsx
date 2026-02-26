import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getBookingByToken } from "@/lib/booking/queries";
import { getServiceById } from "@/lib/booking/queries";

interface ConfirmationPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function BookingConfirmationPage({
  searchParams,
}: ConfirmationPageProps) {
  const params = await searchParams;
  const token = params.token;

  let booking = null;
  let service = null;

  if (token) {
    booking = await getBookingByToken(token);
    if (booking) {
      service = await getServiceById(booking.service_id);
    }
  }

  const dateDisplay = booking
    ? new Date(booking.date + "T00:00:00").toLocaleDateString("en-ZA", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center md:px-8">
      <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
      <h1 className="mt-6 text-3xl font-bold text-foreground">
        Booking Confirmed!
      </h1>
      <p className="mt-4 text-muted-foreground">
        Your appointment has been booked. We&apos;ll send you a confirmation
        email shortly.
      </p>

      {booking && service && (
        <div className="mt-8 rounded-xl border p-5 text-left">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Service</p>
              <p className="font-medium">{service.name.en}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">{dateDisplay}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="font-medium">
                {booking.start_time} — {booking.end_time}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{booking.status}</p>
            </div>
          </div>
        </div>
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        We&apos;ll send you a reminder 24 hours before your appointment.
      </p>

      <div className="mt-8 flex justify-center gap-4">
        <Link href="/book">
          <Button>Book Another</Button>
        </Link>
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
