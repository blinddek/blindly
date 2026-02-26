"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  upsertBlogCategory,
  deleteBlogCategory,
} from "@/lib/cms/actions";
import { LocalizedInput } from "@/components/admin/localized-input";
import type { LocalizedString } from "@/types/cms";
import type { BlogCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

const L = (en = "", af = ""): LocalizedString => ({ en, af });

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function BlogCategoriesPage() {
  const [items, setItems] = useState<(BlogCategory & { isNew?: boolean })[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("name->en");
      if (error) toast.error(error.message);
      else if (data) setItems(data as BlogCategory[]);
      setLoading(false);
    }
    load();
  }, []);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: "", name: L(), slug: "", description: null, isNew: true } as BlogCategory & { isNew?: boolean },
    ]);
  }

  function updateItem(index: number, key: string, value: unknown) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  }

  function handleNameChange(index: number, value: LocalizedString) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, name: value };
        // Auto-slug for new items
        if (!item.id && value.en) {
          updated.slug = slugify(value.en);
        }
        return updated;
      })
    );
  }

  async function handleSave(index: number) {
    setSaving((prev) => ({ ...prev, [index]: true }));
    try {
      const item = items[index];
      await upsertBlogCategory({
        ...(item.id ? { id: item.id } : {}),
        name: item.name,
        slug: item.slug,
        description: item.description,
      });
      // Reload
      const supabase = createClient();
      const { data } = await supabase
        .from("blog_categories")
        .select("*")
        .order("name->en");
      if (data) setItems(data as BlogCategory[]);
      toast.success("Category saved!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving((prev) => ({ ...prev, [index]: false }));
    }
  }

  async function handleDelete(item: BlogCategory) {
    if (!item.id) {
      setItems((prev) => prev.filter((i) => i !== item));
      return;
    }
    try {
      await deleteBlogCategory(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success("Category deleted!");
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
            Blog Categories
          </h1>
          <p className="text-sm text-muted-foreground">
            Organize posts by category.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      {items.map((item, i) => (
        <Card key={item.id || `new-${i}`}>
          <CardContent className="space-y-4 pt-6">
            <LocalizedInput
              label="Name"
              value={item.name}
              onChange={(v) => handleNameChange(i, v)}
            />
            <div>
              <label className="mb-1 block text-sm font-medium">Slug</label>
              <Input
                value={item.slug}
                onChange={(e) => updateItem(i, "slug", e.target.value)}
                placeholder="auto-generated"
              />
            </div>
            <LocalizedInput
              label="Description"
              value={item.description ?? L()}
              onChange={(v) => updateItem(i, "description", v)}
              multiline
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleSave(i)}
                disabled={saving[i]}
              >
                {saving[i] && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(item)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No categories yet. Click &quot;Add Category&quot; to create one.
        </p>
      )}
    </div>
  );
}
