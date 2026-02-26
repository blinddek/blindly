"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/shop/format";
import { trackSchedule } from "@/lib/integrations/facebook-pixel";
import { createBooking } from "@/lib/booking/actions";
import type { BookingData } from "./booking-widget";

interface BookingReviewStepProps {
  data: BookingData;
  onBack: () => void;
}

export function BookingReviewStep({ data, onBack }: BookingReviewStepProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = data.service!;

  const dateDisplay = new Date(data.date + "T00:00:00").toLocaleDateString(
    "en-ZA",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  async function handleConfirm() {
    setLoading(true);
    setError(null);

    try {
      const result = await createBooking({
        service_id: service.id,
        date: data.date,
        start_time: data.slot!.start,
        end_time: data.slot!.end,
        client_name: data.clientName,
        client_email: data.clientEmail,
        client_phone: data.clientPhone,
        notes: data.notes || undefined,
      });

      trackSchedule({ content_name: service.name.en });

      // Redirect to confirmation page
      router.push(`/book/confirmation?token=${result.confirmation_token}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">
        Review Your Booking
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Please confirm the details below.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-4 rounded-xl border p-5">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Service</p>
            <p className="font-medium">{service.name.en}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="font-medium">{service.duration_minutes} minutes</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="font-medium">{dateDisplay}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Time</p>
            <p className="font-medium">
              {data.slot?.start} — {data.slot?.end}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="font-medium">
              {service.price_cents > 0
                ? formatPrice(service.price_cents)
                : "Free"}
            </p>
          </div>
        </div>

        <hr className="border-border" />

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="font-medium">{data.clientName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="font-medium">{data.clientEmail}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="font-medium">{data.clientPhone}</p>
          </div>
          {data.notes && (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="font-medium">{data.notes}</p>
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        By confirming this booking you agree to our{" "}
        <a href="/terms" className="underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" className="underline">
          Privacy Policy
        </a>
        .
      </p>

      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={loading}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button
          className="flex-1"
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming...
            </>
          ) : (
            "Confirm Booking"
          )}
        </Button>
      </div>
    </div>
  );
}
