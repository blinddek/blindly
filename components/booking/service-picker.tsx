"use client";

import { Clock, Banknote } from "lucide-react";
import { formatPrice } from "@/lib/shop/format";
import type { BookingService } from "@/types";

interface ServicePickerProps {
  services: BookingService[];
  selected: BookingService | null;
  onSelect: (service: BookingService) => void;
}

export function ServicePicker({
  services,
  selected,
  onSelect,
}: ServicePickerProps) {
  if (services.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        No services available at the moment.
      </p>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">
        Select a Service
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose the service you&apos;d like to book.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {services.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelect(service)}
            className={`flex flex-col rounded-xl border p-5 text-left transition-all hover:shadow-md ${
              selected?.id === service.id
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-primary/50"
            }`}
          >
            <h3 className="text-lg font-semibold text-foreground">
              {service.name.en}
            </h3>
            {service.description?.en && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {service.description.en}
              </p>
            )}
            <div className="mt-auto flex items-center gap-4 pt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {service.duration_minutes} min
              </span>
              <span className="flex items-center gap-1">
                <Banknote className="h-4 w-4" />
                {service.price_cents > 0
                  ? formatPrice(service.price_cents)
                  : "Free"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
