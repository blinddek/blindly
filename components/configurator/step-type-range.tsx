"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { TypeOption, RangeOption } from "./blind-configurator";
import { BlindIllustration, ColourSwatch, SwatchTextureDefs, getMaterialType } from "./blind-illustrations";

interface Props {
  types: TypeOption[];
  ranges: RangeOption[];
  typeId: string;
  rangeId: string;
  categorySlug: string;
  onChangeType: (id: string) => void;
  onChangeRange: (id: string) => void;
}

export function StepTypeRange({
  types,
  ranges,
  typeId,
  rangeId,
  categorySlug,
  onChangeType,
  onChangeRange,
}: Props) {
  const materialType = getMaterialType(categorySlug);
  return (
    <div className="space-y-6">
      <SwatchTextureDefs />
      {/* Type selection */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Choose size & material</h2>
          <p className="text-sm text-muted-foreground">
            Select the slat size or material type.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {types.map((t) => (
            <button
              key={t.id}
              onClick={() => onChangeType(t.id)}
              className={cn(
                "overflow-hidden rounded-lg border text-left transition-all hover:border-primary/50",
                typeId === t.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border"
              )}
            >
              {t.image_url ? (
                <div className="relative h-28 w-full overflow-hidden bg-muted">
                  <Image
                    src={t.image_url}
                    alt={t.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </div>
              ) : (
                <div className="flex justify-center px-3 pt-3">
                  <BlindIllustration
                    categorySlug={categorySlug}
                    size="sm"
                    colour={typeId === t.id ? "#C4663A" : "#8B8178"}
                  />
                </div>
              )}
              <div className="p-3">
                <div className="font-medium">{t.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {t.material && <span className="capitalize">{t.material}</span>}
                  {t.slat_size_mm && <span> · {t.slat_size_mm}mm slats</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Range selection (only when type is selected) */}
      {typeId && ranges.length > 0 && (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Choose your range</h2>
            <p className="text-sm text-muted-foreground">
              Each range offers different fabrics, textures, and colour palettes.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {ranges.map((r) => (
              <button
                key={r.id}
                onClick={() => onChangeRange(r.id)}
                className={cn(
                  "overflow-hidden rounded-lg border text-left transition-all hover:border-primary/50",
                  rangeId === r.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border"
                )}
              >
                {r.lifestyle_image_url && (
                  <div className="relative h-28 w-full overflow-hidden bg-muted">
                    <Image
                      src={r.lifestyle_image_url}
                      alt={r.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                    {r.starting_price_cents != null && r.starting_price_cents > 0 && (
                      <span className="absolute bottom-2 right-2 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium backdrop-blur-sm">
                        From R{(r.starting_price_cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}
                      </span>
                    )}
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium">{r.name}</div>
                    {!r.lifestyle_image_url && r.starting_price_cents != null && r.starting_price_cents > 0 && (
                      <span className="shrink-0 text-xs font-medium text-primary">
                        From R{(r.starting_price_cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}
                      </span>
                    )}
                  </div>
                  {r.description && (
                    <div className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                      {r.description}
                    </div>
                  )}
                  {r.colour_options.length > 0 && (
                    <div className="mt-2 flex items-center gap-1">
                      {r.colour_options.slice(0, 6).map((c) => (
                        <ColourSwatch
                          key={c.name}
                          hex={c.hex}
                          name={c.name}
                          materialType={materialType}
                          size="sm"
                        />
                      ))}
                      {r.colour_options.length > 6 && (
                        <span className="text-xs text-muted-foreground">
                          +{r.colour_options.length - 6}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
