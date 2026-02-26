"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft } from "lucide-react";
import type { BookingData } from "./booking-widget";

interface BookingFormStepProps {
  data: BookingData;
  onChange: (updates: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function BookingFormStep({
  data,
  onChange,
  onNext,
  onBack,
}: BookingFormStepProps) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onNext();
  }

  const isValid =
    data.clientName.trim() !== "" &&
    data.clientEmail.trim() !== "" &&
    data.clientPhone.trim() !== "";

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">Your Details</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Please provide your contact information.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="clientName">Full Name</Label>
          <Input
            id="clientName"
            value={data.clientName}
            onChange={(e) => onChange({ clientName: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="clientEmail">Email</Label>
          <Input
            id="clientEmail"
            type="email"
            value={data.clientEmail}
            onChange={(e) => onChange({ clientEmail: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="clientPhone">Phone</Label>
          <Input
            id="clientPhone"
            type="tel"
            value={data.clientPhone}
            onChange={(e) => onChange({ clientPhone: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            value={data.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            rows={3}
            placeholder="Any additional information..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onBack}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <Button type="submit" disabled={!isValid} className="flex-1">
            Review Booking
          </Button>
        </div>
      </form>
    </div>
  );
}
