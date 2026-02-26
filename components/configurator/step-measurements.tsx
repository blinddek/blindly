"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { TypeOption } from "./blind-configurator";

interface Props {
  widthMm: number;
  dropMm: number;
  mountType: "inside" | "outside";
  controlSide: "left" | "right";
  onChangeWidth: (v: number) => void;
  onChangeDrop: (v: number) => void;
  onChangeMountType: (v: "inside" | "outside") => void;
  onChangeControlSide: (v: "left" | "right") => void;
  selectedType?: TypeOption;
}

export function StepMeasurements({
  widthMm,
  dropMm,
  mountType,
  controlSide,
  onChangeWidth,
  onChangeDrop,
  onChangeMountType,
  onChangeControlSide,
  selectedType,
}: Props) {
  const widthCm = widthMm / 10;
  const dropCm = dropMm / 10;
  const minW = selectedType?.min_width_cm ?? 30;
  const maxW = selectedType?.max_width_cm ?? 300;
  const minD = selectedType?.min_drop_cm ?? 30;
  const maxD = selectedType?.max_drop_cm ?? 300;
  const widthValid = widthCm >= minW && widthCm <= maxW;
  const dropValid = dropCm >= minD && dropCm <= maxD;

  return (
    <div className="space-y-6">
      {/* Mount type */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Mounting type</h2>
          <p className="text-sm text-muted-foreground">
            Inside mount fits within the window frame. Outside mount covers the
            frame opening.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(["inside", "outside"] as const).map((mt) => (
            <button
              key={mt}
              onClick={() => onChangeMountType(mt)}
              className={cn(
                "rounded-lg border p-3 text-center font-medium capitalize transition-all",
                mountType === mt
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/50"
              )}
            >
              {mt} Mount
            </button>
          ))}
        </div>
        {mountType === "inside" && selectedType?.min_frame_depth_mm && (
          <p className="text-xs text-amber-600">
            Inside mount requires minimum frame depth of{" "}
            {selectedType.min_frame_depth_mm}mm.
          </p>
        )}
      </div>

      {/* Dimensions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Measurements</h2>
        <p className="text-sm text-muted-foreground">
          {mountType === "inside"
            ? "Measure the exact inside width and drop of your window frame in millimetres."
            : "Measure the total width and drop you want the blind to cover in millimetres. We recommend +50mm overlap on each side."}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="blind-width">Width (mm)</Label>
            <Input
              id="blind-width"
              type="number"
              min={minW * 10}
              max={maxW * 10}
              step={10}
              value={widthMm}
              onChange={(e) => onChangeWidth(Number(e.target.value))}
            />
            {!widthValid && widthMm > 0 && (
              <p className="text-xs text-destructive">
                Width must be {minW}–{maxW}cm ({minW * 10}–{maxW * 10}mm)
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="blind-drop">Drop (mm)</Label>
            <Input
              id="blind-drop"
              type="number"
              min={minD * 10}
              max={maxD * 10}
              step={10}
              value={dropMm}
              onChange={(e) => onChangeDrop(Number(e.target.value))}
            />
            {!dropValid && dropMm > 0 && (
              <p className="text-xs text-destructive">
                Drop must be {minD}–{maxD}cm ({minD * 10}–{maxD * 10}mm)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Control side */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Control side</h2>
        <p className="text-sm text-muted-foreground">
          Which side should the chain or cord be on? (As viewed from inside the room.)
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(["left", "right"] as const).map((side) => (
            <button
              key={side}
              onClick={() => onChangeControlSide(side)}
              className={cn(
                "rounded-lg border p-3 text-center font-medium capitalize transition-all",
                controlSide === side
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/50"
              )}
            >
              {side}
            </button>
          ))}
        </div>
      </div>

      {/* Visual preview */}
      <div className="flex items-center justify-center">
        <div
          className="relative rounded border-2 border-dashed border-primary/30 bg-primary/5 transition-all"
          style={{
            width: `${Math.min(Math.max(widthMm / 10, 40), 240)}px`,
            height: `${Math.min(Math.max(dropMm / 10, 40), 180)}px`,
          }}
        >
          <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            {widthMm}mm × {dropMm}mm
          </span>
        </div>
      </div>
    </div>
  );
}
