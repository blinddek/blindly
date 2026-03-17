"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocalizedInput } from "@/components/admin/localized-input";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Save, GripVertical } from "lucide-react";
import Link from "next/link";
import type { LocalizedString } from "@/types/cms";

interface TestimonialItem {
  name: string;
  role: string;
  quote: LocalizedString;
}

interface TestimonialsContent {
  heading: LocalizedString;
  items: TestimonialItem[];
}

const emptyItem = (): TestimonialItem => ({
  name: "",
  role: "",
  quote: { en: "", af: "" },
});

const defaultContent: TestimonialsContent = {
  heading: { en: "What Our Customers Say", af: "Wat Ons Kliënte Sê" },
  items: [],
};

export default function TestimonialsEditor() {
  const [content, setContent] = useState<TestimonialsContent>(defaultContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("homepage_sections")
        .select("content")
        .eq("section_key", "testimonials")
        .single();

      if (data?.content) {
        const c = data.content as TestimonialsContent;
        setContent({
          heading: c.heading || defaultContent.heading,
          items: c.items || [],
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  function updateItem(index: number, field: string, value: unknown) {
    setContent((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function addItem() {
    setContent((prev) => ({
      ...prev,
      items: [...prev.items, emptyItem()],
    }));
  }

  function removeItem(index: number) {
    setContent((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= content.items.length) return;
    setContent((prev) => {
      const items = [...prev.items];
      [items[index], items[newIndex]] = [items[newIndex], items[index]];
      return { ...prev, items };
    });
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("homepage_sections")
      .upsert(
        {
          section_key: "testimonials",
          content: content as unknown as Record<string, unknown>,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "section_key" }
      );

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Testimonials saved.");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-foreground">Testimonials</h1>
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/homepage" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Testimonials</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage customer reviews displayed on the homepage.
          </p>
        </div>
      </div>

      {/* Section heading */}
      <Card>
        <CardHeader>
          <CardTitle>Section Heading</CardTitle>
        </CardHeader>
        <CardContent>
          <LocalizedInput
            label="Heading"
            value={content.heading}
            onChange={(v) => setContent((prev) => ({ ...prev, heading: v }))}
            placeholder="What Our Customers Say"
          />
        </CardContent>
      </Card>

      {/* Testimonial items */}
      {content.items.map((item, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveItem(i, -1)}
                    disabled={i === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                </div>
                <CardTitle className="text-base">
                  {item.name || `Testimonial ${i + 1}`}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItem(i)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={item.name}
                  onChange={(e) => updateItem(i, "name", e.target.value)}
                  placeholder="Sarah M."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Role / Location</label>
                <Input
                  value={item.role}
                  onChange={(e) => updateItem(i, "role", e.target.value)}
                  placeholder="Cape Town"
                />
              </div>
            </div>
            <LocalizedInput
              label="Quote"
              value={item.quote}
              onChange={(v) => updateItem(i, "quote", v)}
              multiline
              rows={3}
              placeholder="What the customer said..."
            />
          </CardContent>
        </Card>
      ))}

      {/* Add + Save */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={addItem}>
          <Plus className="mr-2 h-4 w-4" />
          Add Testimonial
        </Button>
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Testimonials"}
        </Button>
      </div>
    </div>
  );
}
