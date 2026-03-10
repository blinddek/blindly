"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { TypeOption } from "./blind-configurator";

interface Props {
  widthMm: number;
  dropMm: number;
  mountType: "inside" | "outside";
  controlSide: "left" | "right";
  rangeId: string;
  approved: boolean;
  onChangeWidth: (v: number) => void;
  onChangeDrop: (v: number) => void;
  onChangeMountType: (v: "inside" | "outside") => void;
  onChangeControlSide: (v: "left" | "right") => void;
  onApproveChange: (v: boolean) => void;
  selectedType?: TypeOption;
}

interface MatchResult {
  matched_width_cm: number;
  matched_drop_cm: number;
}

export function StepMeasurements({
  widthMm,
  dropMm,
  mountType,
  controlSide,
  rangeId,
  approved,
  onChangeWidth,
  onChangeDrop,
  onChangeMountType,
  onChangeControlSide,
  onApproveChange,
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

  const [match, setMatch] = useState<MatchResult | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch closest match whenever valid measurements + rangeId change
  useEffect(() => {
    if (!rangeId || !widthValid || !dropValid) {
      setMatch(null);
      onApproveChange(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoadingMatch(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/blinds/price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blind_range_id: rangeId,
            width_mm: widthMm,
            drop_mm: dropMm,
            mount_type: mountType,
          }),
        });
        const data = await res.json();
        if (data.matched_width_cm && data.matched_drop_cm) {
          const result: MatchResult = {
            matched_width_cm: data.matched_width_cm,
            matched_drop_cm: data.matched_drop_cm,
          };
          setMatch(result);
          // Auto-approve when it's an exact match
          const exactMatch =
            result.matched_width_cm === Math.ceil(widthMm / 10) &&
            result.matched_drop_cm === Math.ceil(dropMm / 10);
          if (exactMatch) onApproveChange(true);
          else onApproveChange(false);
        }
      } catch {
        setMatch(null);
      } finally {
        setLoadingMatch(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeId, widthMm, dropMm, mountType, widthValid, dropValid]);

  const matchedWidthMm = match ? match.matched_width_cm * 10 : null;
  const matchedDropMm = match ? match.matched_drop_cm * 10 : null;
  const widthDiff = matchedWidthMm !== null ? matchedWidthMm - widthMm : 0;
  const dropDiff = matchedDropMm !== null ? matchedDropMm - dropMm : 0;
  const isExactMatch = widthDiff === 0 && dropDiff === 0;
  const hasDifference = match !== null && !isExactMatch;

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

      {/* Size confirmation panel */}
      {widthValid && dropValid && rangeId && (
        <div className="space-y-3">
          {loadingMatch ? (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Checking nearest available size…
            </div>
          ) : match ? (
            <>
              {/* Side-by-side comparison */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Your measurements
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Width: </span>
                      <span className="font-semibold">{widthMm} mm</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Drop: </span>
                      <span className="font-semibold">{dropMm} mm</span>
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    "rounded-lg border p-4",
                    isExactMatch
                      ? "border-green-200 bg-green-50"
                      : "border-amber-200 bg-amber-50"
                  )}
                >
                  <p
                    className={cn(
                      "mb-2 text-xs font-medium uppercase tracking-wide",
                      isExactMatch ? "text-green-700" : "text-amber-700"
                    )}
                  >
                    Blind will be made to
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Width: </span>
                      <span className="font-semibold">{matchedWidthMm} mm</span>
                      {widthDiff !== 0 && (
                        <span className="ml-1 text-xs font-medium text-amber-700">
                          ({widthDiff > 0 ? "+" : ""}{widthDiff} mm)
                        </span>
                      )}
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Drop: </span>
                      <span className="font-semibold">{matchedDropMm} mm</span>
                      {dropDiff !== 0 && (
                        <span className="ml-1 text-xs font-medium text-amber-700">
                          ({dropDiff > 0 ? "+" : ""}{dropDiff} mm)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Exact match confirmation */}
              {isExactMatch && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                  <CheckCircle2 className="size-4 shrink-0" />
                  Your measurements match an available size exactly.
                </div>
              )}

              {/* Difference — requires approval */}
              {hasDifference && (
                <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-2 text-sm text-amber-800">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <span>
                      Your blind will be manufactured to the nearest available
                      standard size. Sizes are priced per grid step — the
                      dimensions shown above are what you will receive.
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="size-approval"
                      checked={approved}
                      onCheckedChange={(v) => onApproveChange(Boolean(v))}
                    />
                    <label
                      htmlFor="size-approval"
                      className="cursor-pointer text-sm font-medium text-amber-900"
                    >
                      I confirm the blind will be made to {matchedWidthMm} mm ×{" "}
                      {matchedDropMm} mm
                    </label>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

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
        <div className="flex items-center gap-3">
          {/* Drop label — rotated, left of box */}
          <div className="flex flex-col items-center gap-1">
            <span
              className="text-xs font-semibold text-primary"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              Drop: {dropMm} mm
            </span>
          </div>

          {/* Box + width label above */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-semibold text-primary">
              Width: {widthMm} mm
            </span>
            <div
              className="relative rounded border-2 border-dashed border-primary/30 bg-primary/5 transition-all overflow-hidden"
              style={{
                width: `${Math.min(Math.max(widthMm / 10, 60), 240)}px`,
                height: `${Math.min(Math.max(dropMm / 10, 60), 180)}px`,
              }}
            >
              {/* Chain/cord indicator */}
              <div
                className={cn(
                  "absolute top-2 bottom-2 w-px bg-primary/40",
                  controlSide === "left" ? "left-3" : "right-3"
                )}
              />
              {/* Chain links */}
              {[16, 30, 44, 58, 72].map((topPct) => (
                <div
                  key={topPct}
                  className={cn(
                    "absolute size-1.5 rounded-full bg-primary/50",
                    controlSide === "left" ? "left-[9px]" : "right-[9px]"
                  )}
                  style={{ top: `${topPct}%` }}
                />
              ))}
              {/* Side label */}
              <span
                className={cn(
                  "absolute bottom-1.5 text-[10px] font-medium text-primary/60 capitalize",
                  controlSide === "left" ? "left-1" : "right-1"
                )}
              >
                {controlSide}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
