"use client";

import { useState } from "react";
import { ServicePicker } from "./service-picker";
import { DatePickerStep } from "./date-picker-step";
import { TimeSlotStep } from "./time-slot-step";
import { BookingFormStep } from "./booking-form-step";
import { BookingReviewStep } from "./booking-review-step";
import type { BookingService } from "@/types";

export type BookingStep =
  | "service"
  | "date"
  | "time"
  | "details"
  | "review";

const STEPS: { key: BookingStep; label: string }[] = [
  { key: "service", label: "Service" },
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "details", label: "Details" },
  { key: "review", label: "Review" },
];

export interface BookingData {
  service: BookingService | null;
  date: string;
  slot: { start: string; end: string } | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes: string;
}

interface BookingWidgetProps {
  services: BookingService[];
}

export function BookingWidget({ services }: BookingWidgetProps) {
  const [step, setStep] = useState<BookingStep>("service");
  const [data, setData] = useState<BookingData>({
    service: null,
    date: "",
    slot: null,
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    notes: "",
  });

  const currentIndex = STEPS.findIndex((s) => s.key === step);

  function goBack() {
    if (currentIndex > 0) {
      setStep(STEPS[currentIndex - 1].key);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                i <= currentIndex
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`ml-1 hidden text-xs sm:inline ${
                i <= currentIndex
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 h-px w-6 ${
                  i < currentIndex ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === "service" && (
        <ServicePicker
          services={services}
          selected={data.service}
          onSelect={(service) => {
            setData((d) => ({ ...d, service, date: "", slot: null }));
            setStep("date");
          }}
        />
      )}

      {step === "date" && data.service && (
        <DatePickerStep
          serviceId={data.service.id}
          selected={data.date}
          onSelect={(date) => {
            setData((d) => ({ ...d, date, slot: null }));
            setStep("time");
          }}
          onBack={goBack}
        />
      )}

      {step === "time" && data.service && data.date && (
        <TimeSlotStep
          serviceId={data.service.id}
          date={data.date}
          selected={data.slot}
          onSelect={(slot) => {
            setData((d) => ({ ...d, slot }));
            setStep("details");
          }}
          onBack={goBack}
        />
      )}

      {step === "details" && (
        <BookingFormStep
          data={data}
          onChange={(updates) => setData((d) => ({ ...d, ...updates }))}
          onNext={() => setStep("review")}
          onBack={goBack}
        />
      )}

      {step === "review" && (
        <BookingReviewStep data={data} onBack={goBack} />
      )}
    </div>
  );
}
