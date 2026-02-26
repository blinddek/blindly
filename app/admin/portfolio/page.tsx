"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  upsertPortfolioItem,
  deletePortfolioItem,
} from "@/lib/cms/actions";
import { LocalizedInput } from "@/components/admin/localized-input";
import { LocalizedStringList } from "@/components/admin/localized-string-list";
import { DynamicStringList } from "@/components/admin/dynamic-string-list";
import { ImageUpload } from "@/components/admin/image-upload";
import type { PortfolioItem, LocalizedString } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

const L = (en = "", af = ""): LocalizedString => ({ en, af });

type PortfolioForm = Omit<PortfolioItem, "id" | "created_at" | "updated_at" | "deleted_at"> & {
  id?: string;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const emptyItem = (): PortfolioForm => ({
  slug: "",
  title: L(),
  description: L(),
  hero_image_url: null,
  images: [],
  alt_text: null,
  industry: null,
  features: [],
  tech_stack: [],
  live_url: null,
  is_featured: false,
  is_published: true,
  display_order: 0,
});

export default function PortfolioAdmin() {
  const [items, setItems] = useState<(PortfolioItem | PortfolioForm)[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingItems, setSavingItems] = useState<Record<number, boolean>>({});
  const [deletingItems, setDeletingItems] = useState<Record<string, boolean>>({});
  const autoSlugged = useRef<Set<number>>(new Set());

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("*")
        .is("deleted_at", null)
        .order("display_order");

      if (error) toast.error(error.message);
      else if (data) setItems(data as PortfolioItem[]);

      setLoading(false);
    }
    load();
  }, []);

  function updateItem(index: number, key: string, value: unknown) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  }

  function handleTitleChange(index: number, value: LocalizedString) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, title: value };
        const shouldAutoSlug =
          item.slug === "" || autoSlugged.current.has(index);
        if (shouldAutoSlug && value.en) {
          updated.slug = slugify(value.en);
          autoSlugged.current.add(index);
        }
        return updated;
      })
    );
  }

  function handleSlugChange(index: number, value: string) {
    autoSlugged.current.delete(index);
    updateItem(index, "slug", value);
  }

  function addItem() {
    const item = emptyItem();
    item.display_order = items.length;
    setItems((prev) => [...prev, item]);
    autoSlugged.current.add(items.length);
  }

  async function handleSaveItem(index: number) {
    setSavingItems((prev) => ({ ...prev, [index]: true }));
    try {
      const item = items[index];
      await upsertPortfolioItem({
        ...(item.id ? { id: item.id } : {}),
        slug: item.slug,
        title: item.title,
        description: (item.description as LocalizedString) ?? undefined,
        hero_image_url: item.hero_image_url,
        images: item.images,
        alt_text: item.alt_text,
        industry: item.industry,
        features: item.features,
        tech_stack: item.tech_stack,
        live_url: item.live_url,
        is_featured: item.is_featured,
        display_order: item.display_order,
        is_published: item.is_published,
      });

      const supabase = createClient();
      const { data } = await supabase
        .from("portfolio_items")
        .select("*")
        .is("deleted_at", null)
        .order("display_order");
      if (data) setItems(data as PortfolioItem[]);
      autoSlugged.current.clear();
      toast.success("Portfolio item saved!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingItems((prev) => ({ ...prev, [index]: false }));
    }
  }

  async function handleDeleteItem(item: PortfolioItem | PortfolioForm) {
    if (!item.id) {
      setItems((prev) => prev.filter((i) => i !== item));
      return;
    }
    setDeletingItems((prev) => ({ ...prev, [item.id!]: true }));
    try {
      await deletePortfolioItem(item.id!);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success("Portfolio item archived!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      if (item.id)
        setDeletingItems((prev) => ({ ...prev, [item.id!]: false }));
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
          <h1 className="text-2xl font-bold text-foreground">Portfolio</h1>
          <p className="text-sm text-muted-foreground">
            Manage portfolio items and case studies.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>

      {items.map((item, i) => (
        <Card key={item.id ?? `new-${i}`}>
          <CardContent className="space-y-4 pt-6">
            <div>
              <label className="mb-1 block text-sm font-medium">Slug</label>
              <Input
                value={item.slug}
                onChange={(e) => handleSlugChange(i, e.target.value)}
                placeholder="auto-generated-from-title"
              />
            </div>

            <LocalizedInput
              label="Title"
              value={item.title}
              onChange={(v) => handleTitleChange(i, v)}
            />

            <LocalizedInput
              label="Description"
              value={(item.description as LocalizedString) ?? L()}
              onChange={(v) => updateItem(i, "description", v)}
              multiline
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Industry
                </label>
                <Input
                  value={item.industry ?? ""}
                  onChange={(e) =>
                    updateItem(i, "industry", e.target.value || null)
                  }
                  placeholder="e.g. E-commerce, Healthcare"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Live URL
                </label>
                <Input
                  value={item.live_url ?? ""}
                  onChange={(e) =>
                    updateItem(i, "live_url", e.target.value || null)
                  }
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <LocalizedStringList
              label="Features"
              items={item.features}
              onChange={(features) => updateItem(i, "features", features)}
            />

            <div>
              <label className="mb-1 block text-sm font-medium">
                Tech Stack
              </label>
              <DynamicStringList
                value={item.tech_stack ?? []}
                onChange={(stack) => updateItem(i, "tech_stack", stack)}
                placeholder="e.g. Next.js, Tailwind CSS"
              />
            </div>

            <ImageUpload
              label="Hero Image"
              value={item.hero_image_url}
              onChange={(url) => updateItem(i, "hero_image_url", url)}
              folder="portfolio"
            />

            <div>
              <label className="mb-1 block text-sm font-medium">
                Gallery Images
              </label>
              <DynamicStringList
                value={item.images ?? []}
                onChange={(imgs) => updateItem(i, "images", imgs)}
                placeholder="Paste image URL"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Add URLs for additional project screenshots.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={item.is_published}
                    onChange={(e) =>
                      updateItem(i, "is_published", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-input"
                  />
                  Published
                </label>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={item.is_featured}
                    onChange={(e) =>
                      updateItem(i, "is_featured", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-input"
                  />
                  Featured
                </label>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Display Order
                </label>
                <Input
                  type="number"
                  value={item.display_order}
                  onChange={(e) =>
                    updateItem(
                      i,
                      "display_order",
                      Number.parseInt(e.target.value) || 0
                    )
                  }
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleSaveItem(i)}
                disabled={savingItems[i]}
              >
                {savingItems[i] && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Item
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteItem(item)}
                disabled={item.id ? deletingItems[item.id] : false}
              >
                {item.id && deletingItems[item.id] ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Archive
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No portfolio items yet. Click &quot;Add Item&quot; to create one.
        </p>
      )}
    </div>
  );
}
