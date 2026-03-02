"use client";

import { cn } from "@/lib/utils";
import type { DaySchedule } from "@/types/cms";

const DAYS = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
] as const;

const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 22; h++) {
  for (const m of ["00", "30"]) {
    if (h === 22 && m === "30") continue;
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${m}`);
  }
}

const DEFAULT_SCHEDULE: DaySchedule[] = DAYS.map((d) => ({
  day: d.key,
  open: d.key !== "saturday" && d.key !== "sunday",
  from: "08:00",
  to: "17:00",
}));

interface BusinessHoursEditorProps {
  value: DaySchedule[] | string | undefined;
  onChange: (schedule: DaySchedule[]) => void;
}

export function BusinessHoursEditor({ value, onChange }: BusinessHoursEditorProps) {
  const schedule: DaySchedule[] = Array.isArray(value) ? value : DEFAULT_SCHEDULE;

  function toggleDay(index: number) {
    const updated = [...schedule];
    updated[index] = {
      ...updated[index],
      open: !updated[index].open,
      from: !updated[index].open ? "08:00" : "",
      to: !updated[index].open ? "17:00" : "",
    };
    onChange(updated);
  }

  function updateTime(index: number, field: "from" | "to", val: string) {
    const updated = [...schedule];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">Business Hours</label>
      <div className="space-y-1.5 rounded-md border p-3">
        {schedule.map((day, index) => {
          const dayInfo = DAYS[index];
          return (
            <div key={day.day} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleDay(index)}
                className={cn(
                  "flex h-8 w-12 shrink-0 items-center justify-center rounded-md border text-xs font-medium transition-colors",
                  day.open
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted-foreground/20 text-muted-foreground"
                )}
              >
                {dayInfo.label}
              </button>

              {day.open ? (
                <div className="flex items-center gap-1.5">
                  <select
                    value={day.from}
                    onChange={(e) => updateTime(index, "from", e.target.value)}
                    className="h-8 rounded-md border bg-background px-2 font-sans text-xs"
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-muted-foreground">–</span>
                  <select
                    value={day.to}
                    onChange={(e) => updateTime(index, "to", e.target.value)}
                    className="h-8 rounded-md border bg-background px-2 font-sans text-xs"
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Closed</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
