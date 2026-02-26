"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";

interface TimeSlot {
  start: string;
  end: string;
}

interface TimeSlotStepProps {
  serviceId: string;
  date: string;
  selected: TimeSlot | null;
  onSelect: (slot: TimeSlot) => void;
  onBack: () => void;
}

export function TimeSlotStep({
  serviceId,
  date,
  selected,
  onSelect,
  onBack,
}: TimeSlotStepProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSlots() {
      setLoading(true);
      const res = await fetch(
        `/api/booking/available-slots?serviceId=${serviceId}&date=${date}`
      );
      const data = await res.json();
      setSlots(data.slots ?? []);
      setLoading(false);
    }
    fetchSlots();
  }, [serviceId, date]);

  const dateDisplay = new Date(date + "T00:00:00").toLocaleDateString(
    "en-ZA",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">Pick a Time</h2>
      <p className="mt-1 text-sm text-muted-foreground">{dateDisplay}</p>

      {loading ? (
        <div className="mt-8 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : slots.length === 0 ? (
        <p className="mt-8 text-center text-muted-foreground">
          No available time slots for this date.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slots.map((slot) => {
            const isSelected =
              selected?.start === slot.start && selected?.end === slot.end;
            return (
              <button
                key={slot.start}
                type="button"
                onClick={() => onSelect(slot)}
                className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                {slot.start}
              </button>
            );
          })}
        </div>
      )}

      <Button variant="outline" className="mt-6" onClick={onBack}>
        <ChevronLeft className="mr-1 h-4 w-4" /> Back
      </Button>
    </div>
  );
}
