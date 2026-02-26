"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  upsertAvailabilityRule,
  deleteAvailabilityRule,
  createBlockedDate,
  deleteBlockedDate,
} from "@/lib/booking/actions";
import type { BookingService } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface Rule {
  id: string;
  service_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface BlockedDateRow {
  id: string;
  date: string;
  reason: { en: string; af: string } | null;
  all_day: boolean;
  source: string;
}

export default function AvailabilityPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [blocked, setBlocked] = useState<BlockedDateRow[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRule, setSavingRule] = useState<Record<number, boolean>>({});

  // New blocked date form
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [addingBlock, setAddingBlock] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [rulesRes, blockedRes, servicesRes] = await Promise.all([
        supabase
          .from("availability_rules")
          .select("*")
          .order("day_of_week")
          .order("start_time"),
        supabase
          .from("blocked_dates")
          .select("*")
          .gte("date", new Date().toISOString().split("T")[0])
          .order("date"),
        supabase.from("booking_services").select("*"),
      ]);
      if (rulesRes.data) setRules(rulesRes.data as Rule[]);
      if (blockedRes.data) setBlocked(blockedRes.data as BlockedDateRow[]);
      if (servicesRes.data) setServices(servicesRes.data as BookingService[]);
      setLoading(false);
    }
    load();
  }, []);

  function addRule() {
    setRules((prev) => [
      ...prev,
      {
        id: "",
        service_id: null,
        day_of_week: 1, // Monday
        start_time: "09:00",
        end_time: "17:00",
        is_active: true,
      },
    ]);
  }

  function updateRule(index: number, key: string, value: unknown) {
    setRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [key]: value } : r))
    );
  }

  async function handleSaveRule(index: number) {
    setSavingRule((prev) => ({ ...prev, [index]: true }));
    try {
      const rule = rules[index];
      await upsertAvailabilityRule({
        ...(rule.id ? { id: rule.id } : {}),
        service_id: rule.service_id || null,
        day_of_week: rule.day_of_week,
        start_time: rule.start_time,
        end_time: rule.end_time,
        is_active: rule.is_active,
      });
      // Reload
      const supabase = createClient();
      const { data } = await supabase
        .from("availability_rules")
        .select("*")
        .order("day_of_week")
        .order("start_time");
      if (data) setRules(data as Rule[]);
      toast.success("Rule saved!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingRule((prev) => ({ ...prev, [index]: false }));
    }
  }

  async function handleDeleteRule(rule: Rule) {
    if (!rule.id) {
      setRules((prev) => prev.filter((r) => r !== rule));
      return;
    }
    try {
      await deleteAvailabilityRule(rule.id);
      setRules((prev) => prev.filter((r) => r.id !== rule.id));
      toast.success("Rule deleted!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleAddBlock() {
    if (!newDate) return;
    setAddingBlock(true);
    try {
      await createBlockedDate({
        date: newDate,
        reason: { en: newReason, af: "" },
        all_day: true,
      });
      // Reload
      const supabase = createClient();
      const { data } = await supabase
        .from("blocked_dates")
        .select("*")
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date");
      if (data) setBlocked(data as BlockedDateRow[]);
      setNewDate("");
      setNewReason("");
      toast.success("Date blocked!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setAddingBlock(false);
    }
  }

  async function handleRemoveBlock(id: string) {
    try {
      await deleteBlockedDate(id);
      setBlocked((prev) => prev.filter((b) => b.id !== id));
      toast.success("Block removed!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Availability Rules */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Availability
            </h1>
            <p className="text-sm text-muted-foreground">
              Weekly schedule and blocked dates.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={addRule}>
            <Plus className="mr-2 h-4 w-4" /> Add Rule
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {rules.map((rule, i) => (
            <Card key={rule.id || `new-${i}`}>
              <CardContent className="flex flex-wrap items-end gap-3 pt-4">
                <div>
                  <label className="mb-1 block text-xs font-medium">Day</label>
                  <select
                    value={rule.day_of_week}
                    onChange={(e) =>
                      updateRule(i, "day_of_week", Number(e.target.value))
                    }
                    className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    {DAY_NAMES.map((name, d) => (
                      <option key={d} value={d}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Start
                  </label>
                  <Input
                    type="time"
                    value={rule.start_time}
                    onChange={(e) =>
                      updateRule(i, "start_time", e.target.value)
                    }
                    className="w-28"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">End</label>
                  <Input
                    type="time"
                    value={rule.end_time}
                    onChange={(e) =>
                      updateRule(i, "end_time", e.target.value)
                    }
                    className="w-28"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Service
                  </label>
                  <select
                    value={rule.service_id ?? ""}
                    onChange={(e) =>
                      updateRule(
                        i,
                        "service_id",
                        e.target.value || null
                      )
                    }
                    className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="">All services</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name.en}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={rule.is_active}
                    onChange={(e) =>
                      updateRule(i, "is_active", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-input"
                  />
                  Active
                </label>
                <Button
                  size="sm"
                  onClick={() => handleSaveRule(i)}
                  disabled={savingRule[i]}
                >
                  {savingRule[i] && (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  )}
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteRule(rule)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {rules.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No availability rules. Add rules to enable booking.
            </p>
          )}
        </div>
      </div>

      {/* Blocked Dates */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Blocked Dates</h2>
        <p className="text-sm text-muted-foreground">
          Block specific dates from booking.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-44"
          />
          <Input
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            placeholder="Reason (optional)"
            className="w-48"
          />
          <Button
            size="sm"
            onClick={handleAddBlock}
            disabled={!newDate || addingBlock}
          >
            {addingBlock && (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            )}
            Block Date
          </Button>
        </div>

        {blocked.length > 0 && (
          <div className="mt-4 space-y-2">
            {blocked.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-lg border px-4 py-2 text-sm"
              >
                <div>
                  <span className="font-medium">{b.date}</span>
                  {b.reason?.en && (
                    <span className="ml-2 text-muted-foreground">
                      — {b.reason.en}
                    </span>
                  )}
                  {b.source === "google_calendar" && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (Google Calendar)
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveBlock(b.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
