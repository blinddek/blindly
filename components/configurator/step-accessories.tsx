"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { ExtraWithPrice, SelectedExtra } from "@/types/blinds";

interface StepAccessoriesProps {
  readonly blindRangeId: string;
  readonly widthCm: number;
  readonly selected: SelectedExtra[];
  readonly onChange: (extras: SelectedExtra[]) => void;
}

function formatRand(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function StepAccessories({ blindRangeId, widthCm, selected, onChange }: StepAccessoriesProps) {
  const [extras, setExtras] = useState<ExtraWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/blinds/extras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blind_range_id: blindRangeId, width_cm: widthCm }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setExtras(data.extras ?? []);
      })
      .catch(() => setError("Failed to load accessories"))
      .finally(() => setLoading(false));
  }, [blindRangeId, widthCm]);

  function toggle(extra: ExtraWithPrice) {
    const isSelected = selected.some((s) => s.extra_id === extra.id);
    if (isSelected) {
      onChange(selected.filter((s) => s.extra_id !== extra.id));
    } else {
      onChange([...selected, { extra_id: extra.id, name: extra.name, price_cents: extra.price_cents }]);
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

  if (extras.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>No accessories available for this configuration.</p>
        <p className="mt-1 text-sm">Click Next to see your quote.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add optional accessories to your blind. Prices are ex-VAT — VAT will be calculated at checkout.
      </p>
      <div className="space-y-3">
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
                  onCheckedChange={() => toggle(extra)}
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
