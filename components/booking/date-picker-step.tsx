"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface DatePickerStepProps {
  serviceId: string;
  selected: string;
  onSelect: (date: string) => void;
  onBack: () => void;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function DatePickerStep({
  serviceId,
  selected,
  onSelect,
  onBack,
}: DatePickerStepProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-indexed
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDates() {
      setLoading(true);
      const monthStr = `${year}-${String(month).padStart(2, "0")}`;
      const res = await fetch(
        `/api/booking/available-dates?serviceId=${serviceId}&month=${monthStr}`
      );
      const data = await res.json();
      setAvailableDates(new Set(data.dates ?? []));
      setLoading(false);
    }
    fetchDates();
  }, [serviceId, year, month]);

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];

  // Leading blanks
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">Pick a Date</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Available dates are highlighted.
      </p>

      <div className="mt-6 rounded-xl border p-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-md p-1 hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-semibold">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded-md p-1 hover:bg-muted"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="mt-4 grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-7 text-center">
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`blank-${i}`} />;
              }

              const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isAvailable = availableDates.has(dateStr);
              const isSelected = selected === dateStr;

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => onSelect(dateStr)}
                  className={`mx-auto my-1 flex h-10 w-10 items-center justify-center rounded-full text-sm transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isAvailable
                        ? "hover:bg-primary/10 text-foreground"
                        : "text-muted-foreground/40 cursor-not-allowed"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Button variant="outline" className="mt-6" onClick={onBack}>
        <ChevronLeft className="mr-1 h-4 w-4" /> Back
      </Button>
    </div>
  );
}
