import { generatePageMetadata } from "@/lib/seo/metadata";
import { getActiveServices } from "@/lib/booking/queries";
import { BookingWidget } from "@/components/booking/booking-widget";

export async function generateMetadata() {
  return generatePageMetadata("book");
}

export default async function BookingPage() {
  const services = await getActiveServices();

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-16 md:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">
          Book an Appointment
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Select a service, pick a date and time, and we&apos;ll confirm your booking.
        </p>
      </div>

      <div className="mt-12">
        <BookingWidget services={services} />
      </div>
    </div>
  );
}
