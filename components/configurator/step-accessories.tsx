"use client";

import { useEffect, useState } from "react";
import { Loader2, Zap } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { ExtraWithPrice, MotorOptionWithPrice, SelectedExtra } from "@/types/blinds";

interface StepAccessoriesProps {
  readonly blindRangeId: string;
  readonly widthCm: number;
  readonly dropCm: number;
  readonly selected: SelectedExtra[];
  readonly onChange: (extras: SelectedExtra[]) => void;
}

function formatRand(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function StepAccessories({ blindRangeId, widthCm, dropCm, selected, onChange }: StepAccessoriesProps) {
  const [extras, setExtras] = useState<ExtraWithPrice[]>([]);
  const [motors, setMotors] = useState<MotorOptionWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch("/api/blinds/extras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blind_range_id: blindRangeId, width_cm: widthCm }),
      }).then((r) => r.json()),
      fetch("/api/blinds/motors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ width_cm: widthCm, drop_cm: dropCm }),
      }).then((r) => r.json()),
    ])
      .then(([extrasData, motorsData]) => {
        if (extrasData.error) setError(extrasData.error);
        else setExtras(extrasData.extras ?? []);
        setMotors(motorsData.motors ?? []);
      })
      .catch(() => setError("Failed to load accessories"))
      .finally(() => setLoading(false));
  }, [blindRangeId, widthCm, dropCm]);

  function toggleExtra(extra: ExtraWithPrice) {
    const isSelected = selected.some((s) => s.extra_id === extra.id);
    if (isSelected) {
      onChange(selected.filter((s) => s.extra_id !== extra.id));
    } else {
      // Remove any mutually exclusive extras (bidirectional: what this replaces, or what replaces this)
      const exclusiveIds = new Set<string>();
      if (extra.replaces_extra_id) exclusiveIds.add(extra.replaces_extra_id);
      extras.forEach((e) => {
        if (e.replaces_extra_id === extra.id) exclusiveIds.add(e.id);
      });
      const filtered = exclusiveIds.size > 0
        ? selected.filter((s) => !exclusiveIds.has(s.extra_id))
        : selected;
      onChange([...filtered, { extra_id: extra.id, name: extra.name, price_cents: extra.price_cents }]);
    }
  }

  function toggleMotor(motor: MotorOptionWithPrice) {
    const motorName = `${motor.brand} ${motor.model}`.trim();
    const isSelected = selected.some((s) => s.extra_id === motor.id);
    if (isSelected) {
      // Deselect
      onChange(selected.filter((s) => s.extra_id !== motor.id));
    } else {
      // Single-select: remove any other motor, then add this one
      const withoutMotors = selected.filter(
        (s) => !motors.some((m) => m.id === s.extra_id)
      );
      onChange([...withoutMotors, { extra_id: motor.id, name: motorName, price_cents: motor.price_cents }]);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="ml-2">Loading accessories...</span>
      </div>
    );
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-destructive">{error}</p>;
  }

  const hasAnything = extras.length > 0 || motors.length > 0;

  if (!hasAnything) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>No accessories available for this configuration.</p>
        <p className="mt-1 text-sm">Click Next to see your quote.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Add optional accessories to your blind. Prices are ex-VAT — VAT will be calculated at checkout.
      </p>

      {/* Accessories */}
      {extras.length > 0 && (
        <div className="space-y-3">
          {motors.length > 0 && (
            <h3 className="text-sm font-semibold text-foreground">Accessories</h3>
          )}
          {extras.map((extra) => {
            const isSelected = selected.some((s) => s.extra_id === extra.id);
            return (
              <div
                key={extra.id}
                data-selected={isSelected}
                className="rounded-lg border p-4 transition-colors data-[selected=true]:border-primary data-[selected=true]:bg-primary/5"
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={extra.id}
                    checked={isSelected}
                    onCheckedChange={() => toggleExtra(extra)}
                    className="mt-0.5"
                  />
                  <label htmlFor={extra.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{extra.name}</span>
                      <span className="text-sm font-semibold text-primary">
                        + {formatRand(extra.price_cents)}
                      </span>
                    </div>
                    {extra.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{extra.description}</p>
                    )}
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Motorisation */}
      {motors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Motorisation</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Upgrade to a motorised blind — compatible options are shown first.
          </p>
          {motors.map((motor) => {
            const isSelected = selected.some((s) => s.extra_id === motor.id);
            const motorName = `${motor.brand} ${motor.model}`.trim();
            return (
              <div
                key={motor.id}
                data-selected={isSelected}
                data-incompatible={!motor.compatible}
                className="rounded-lg border p-4 transition-colors data-[selected=true]:border-primary data-[selected=true]:bg-primary/5 data-[incompatible=true]:opacity-60"
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={motor.id}
                    checked={isSelected}
                    onCheckedChange={() => toggleMotor(motor)}
                    disabled={!motor.compatible}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={motor.id}
                    className={`flex-1 ${motor.compatible ? "cursor-pointer" : "cursor-not-allowed"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{motorName}</span>
                        {motor.is_rechargeable && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            Rechargeable
                          </span>
                        )}
                        {!motor.compatible && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            Incompatible
                          </span>
                        )}
                      </div>
                      {motor.price_cents > 0 && (
                        <span className="text-sm font-semibold text-primary">
                          + {formatRand(motor.price_cents)}
                        </span>
                      )}
                    </div>
                    {motor.incompatible_reason && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{motor.incompatible_reason}</p>
                    )}
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected.length > 0 && (
        <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Accessories subtotal (ex-VAT): </span>
          <span className="font-semibold">
            {formatRand(selected.reduce((s, e) => s + e.price_cents, 0))}
          </span>
        </div>
      )}
    </div>
  );
}
