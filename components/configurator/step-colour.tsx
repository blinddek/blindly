"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ColourOption } from "./blind-configurator";
import { ColourSwatch, SwatchTextureDefs, getMaterialType } from "./blind-illustrations";

interface Props {
  colours: ColourOption[];
  rangeName: string;
  categorySlug: string;
  value: string;
  onChange: (colour: string) => void;
}

export function StepColour({ colours, rangeName, categorySlug, value, onChange }: Props) {
  const materialType = getMaterialType(categorySlug);

  return (
    <div className="space-y-4">
      <SwatchTextureDefs />
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">Choose your colour</h2>
          <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
            Representative colours
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Available colours for <span className="font-medium">{rangeName}</span>.
          Colours on screen are approximate — we recommend ordering a free swatch
          for an exact match.
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
            <ColourSwatch
              hex={c.hex}
              name={c.name}
              materialType={materialType}
              size="lg"
              selected={value === c.name}
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
