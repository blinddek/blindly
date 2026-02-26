"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  upsertBookingService,
  deleteBookingService,
} from "@/lib/booking/actions";
import { LocalizedInput } from "@/components/admin/localized-input";
import type { LocalizedString } from "@/types/cms";
import type { BookingService } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

const L = (en = "", af = ""): LocalizedString => ({ en, af });

type ServiceForm = Omit<BookingService, "created_at" | "updated_at">;

const emptyService = (): ServiceForm => ({
  id: "",
  name: L(),
  description: null,
  duration_minutes: 60,
  buffer_minutes: 15,
  price_cents: 0,
  cancellation_cutoff_hours: 24,
  max_advance_days: 30,
  is_active: true,
});

export default function BookingServicesPage() {
  const [items, setItems] = useState<ServiceForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("booking_services")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      else if (data) setItems(data as ServiceForm[]);
      setLoading(false);
    }
    load();
  }, []);

  function addItem() {
    setItems((prev) => [...prev, emptyService()]);
  }

  function updateItem(index: number, key: string, value: unknown) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  }

  async function handleSave(index: number) {
    setSaving((prev) => ({ ...prev, [index]: true }));
    try {
      const item = items[index];
      await upsertBookingService({
        ...(item.id ? { id: item.id } : {}),
        name: item.name,
        description: item.description,
        duration_minutes: item.duration_minutes,
        buffer_minutes: item.buffer_minutes,
        price_cents: item.price_cents,
        cancellation_cutoff_hours: item.cancellation_cutoff_hours,
        max_advance_days: item.max_advance_days,
        is_active: item.is_active,
      });
      const supabase = createClient();
      const { data } = await supabase
        .from("booking_services")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setItems(data as ServiceForm[]);
      toast.success("Service saved!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving((prev) => ({ ...prev, [index]: false }));
    }
  }

  async function handleDelete(item: ServiceForm) {
    if (!item.id) {
      setItems((prev) => prev.filter((i) => i !== item));
      return;
    }
    try {
      await deleteBookingService(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success("Service deactivated!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Booking Services
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure the services clients can book.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-2 h-4 w-4" /> Add Service
        </Button>
      </div>

      {items.map((item, i) => (
        <Card key={item.id || `new-${i}`}>
          <CardContent className="space-y-4 pt-6">
            <LocalizedInput
              label="Name"
              value={item.name}
              onChange={(v) => updateItem(i, "name", v)}
            />

            <LocalizedInput
              label="Description"
              value={item.description ?? L()}
              onChange={(v) => updateItem(i, "description", v)}
              multiline
              rows={3}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Duration (minutes)
                </label>
                <Input
                  type="number"
                  value={item.duration_minutes}
                  onChange={(e) =>
                    updateItem(i, "duration_minutes", Number(e.target.value))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Buffer (minutes)
                </label>
                <Input
                  type="number"
                  value={item.buffer_minutes}
                  onChange={(e) =>
                    updateItem(i, "buffer_minutes", Number(e.target.value))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Price (cents, 0 = free)
                </label>
                <Input
                  type="number"
                  value={item.price_cents}
                  onChange={(e) =>
                    updateItem(i, "price_cents", Number(e.target.value))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Cancellation Cutoff (hours)
                </label>
                <Input
                  type="number"
                  value={item.cancellation_cutoff_hours}
                  onChange={(e) =>
                    updateItem(
                      i,
                      "cancellation_cutoff_hours",
                      Number(e.target.value)
                    )
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Max Advance Booking (days)
                </label>
                <Input
                  type="number"
                  value={item.max_advance_days}
                  onChange={(e) =>
                    updateItem(i, "max_advance_days", Number(e.target.value))
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={item.is_active}
                  onChange={(e) =>
                    updateItem(i, "is_active", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-input"
                />
                Active
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleSave(i)}
                disabled={saving[i]}
              >
                {saving[i] && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Service
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(item)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Deactivate
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No services yet. Click &quot;Add Service&quot; to create one.
        </p>
      )}
    </div>
  );
}
