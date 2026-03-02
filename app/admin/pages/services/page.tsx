"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { upsertSiteContent } from "@/lib/cms/actions";
import { LocalizedInput } from "@/components/admin/localized-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Plus, Trash2, ArrowLeft, X } from "lucide-react";
import type { LocalizedString } from "@/types/cms";
import Link from "next/link";

const L = (en = "", af = ""): LocalizedString => ({ en, af });

interface ServiceItem {
  icon?: string;
  image?: string;
  title: LocalizedString;
  description: LocalizedString;
  features?: string[];
}

interface ServicesForm {
  heading: LocalizedString;
  intro: LocalizedString;
  items: ServiceItem[];
}

const defaultForm: ServicesForm = {
  heading: L(),
  intro: L(),
  items: [],
};

export default function ServicesPageEditor() {
  const [form, setForm] = useState<ServicesForm>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("section_key", "services_detail")
        .single();

      if (data?.content) {
        const c = data.content as Record<string, unknown>;
        setForm({
          heading: (c.heading as LocalizedString) || L(),
          intro: (c.intro as LocalizedString) || L(),
          items: (c.items as ServiceItem[]) || [],
        });
      }
      setLoading(false);
    }
    fetch();
  }, []);

  function setLocalized(key: keyof ServicesForm, value: LocalizedString) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addItem() {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { icon: "", image: "", title: L(), description: L(), features: [] },
      ],
    }));
  }

  function removeItem(index: number) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }

  function updateItem(index: number, field: string, value: unknown) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  // Feature tag management
  function addFeature(itemIndex: number, feature: string) {
    if (!feature.trim()) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === itemIndex
          ? { ...item, features: [...(item.features || []), feature.trim()] }
          : item
      ),
    }));
  }

  function removeFeature(itemIndex: number, featureIndex: number) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === itemIndex
          ? {
              ...item,
              features: (item.features || []).filter(
                (_, fi) => fi !== featureIndex
              ),
            }
          : item
      ),
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await upsertSiteContent(
        "services_detail",
        form as unknown as Record<string, unknown>
      );
      toast.success("Services page saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-foreground">Services Page</h1>
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/pages"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Services Page</h1>
          <p className="mt-1 text-muted-foreground">
            Page heading, intro, and individual service detail items.
          </p>
        </div>
      </div>

      {/* Heading & Intro */}
      <Card>
        <CardHeader>
          <CardTitle>Heading & Introduction</CardTitle>
          <CardDescription>
            Shown at the top of the services page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LocalizedInput
            label="Heading"
            value={form.heading}
            onChange={(v) => setLocalized("heading", v)}
            placeholder="Our Services"
          />
          <LocalizedInput
            label="Introduction"
            value={form.intro}
            onChange={(v) => setLocalized("intro", v)}
            placeholder="We offer a full range of custom cabinetry..."
            multiline
          />
        </CardContent>
      </Card>

      {/* Service Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Services</CardTitle>
              <CardDescription>
                Each service is shown as a section with image, description, and
                feature tags.
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={addItem}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Service
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {form.items.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No services yet. Click "Add Service" to get started.
            </p>
          )}
          {form.items.map((item, i) => (
            <ServiceItemEditor
              key={i}
              index={i}
              item={item}
              onUpdate={updateItem}
              onRemove={removeItem}
              onAddFeature={addFeature}
              onRemoveFeature={removeFeature}
            />
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Services Page"}
        </Button>
      </div>
    </div>
  );
}

function ServiceItemEditor({
  index,
  item,
  onUpdate,
  onRemove,
  onAddFeature,
  onRemoveFeature,
}: {
  index: number;
  item: ServiceItem;
  onUpdate: (index: number, field: string, value: unknown) => void;
  onRemove: (index: number) => void;
  onAddFeature: (itemIndex: number, feature: string) => void;
  onRemoveFeature: (itemIndex: number, featureIndex: number) => void;
}) {
  const [newFeature, setNewFeature] = useState("");

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Service {index + 1}</span>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Emoji Icon
          </label>
          <Input
            value={item.icon || ""}
            onChange={(e) => onUpdate(index, "icon", e.target.value)}
            placeholder="🏠"
            className="w-20"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Image URL
          </label>
          <Input
            value={item.image || ""}
            onChange={(e) => onUpdate(index, "image", e.target.value)}
            placeholder="https://images.unsplash.com/..."
          />
        </div>
      </div>

      <LocalizedInput
        label="Title"
        value={item.title}
        onChange={(v) => onUpdate(index, "title", v)}
        placeholder="Kitchen Cupboards"
      />
      <LocalizedInput
        label="Description"
        value={item.description}
        onChange={(v) => onUpdate(index, "description", v)}
        placeholder="Custom-designed kitchen cabinets..."
        multiline
        rows={4}
      />

      {/* Feature Tags */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Feature Tags
        </label>
        <div className="flex flex-wrap gap-1.5">
          {(item.features || []).map((f, fi) => (
            <span
              key={fi}
              className="inline-flex items-center gap-1 rounded-full border bg-muted px-2.5 py-0.5 text-xs"
            >
              {f}
              <button
                type="button"
                onClick={() => onRemoveFeature(index, fi)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            placeholder="Add a feature tag..."
            className="max-w-xs text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddFeature(index, newFeature);
                setNewFeature("");
              }
            }}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onAddFeature(index, newFeature);
              setNewFeature("");
            }}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
