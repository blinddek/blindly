"use client";

import { cn } from "@/lib/utils";
import type { ColourOption } from "./blind-configurator";

interface Props {
  colours: ColourOption[];
  rangeName: string;
  value: string;
  onChange: (colour: string) => void;
}

export function StepColour({ colours, rangeName, value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Choose your colour</h2>
        <p className="text-sm text-muted-foreground">
          Available colours for <span className="font-medium">{rangeName}</span>.
          Colours on screen are representative only — we recommend ordering a
          free swatch.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {colours.map((c) => (
          <button
            key={c.name}
            onClick={() => onChange(c.name)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border p-4 transition-all hover:border-primary/50",
              value === c.name
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border"
            )}
          >
            <span
              className="size-12 rounded-full border-2 shadow-sm"
              style={{ backgroundColor: c.hex }}
            />
            <span className="text-sm font-medium">{c.name}</span>
          </button>
        ))}
      </div>
      {value && (
        <p className="text-center text-sm text-muted-foreground">
          Selected:{" "}
          <span className="font-medium text-foreground">{value}</span>
        </p>
      )}
    </div>
  );
}
