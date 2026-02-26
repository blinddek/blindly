"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  upsertProductCategory,
  deleteProductCategory,
} from "@/lib/shop/actions";
import { LocalizedInput } from "@/components/admin/localized-input";
import { ImageUpload } from "@/components/admin/image-upload";
import type { LocalizedString } from "@/types/cms";
import type { ProductCategory } from "@/types";
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

export default function ProductCategoriesPage() {
  const [items, setItems] = useState<
    (ProductCategory & { display_order?: number })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .is("deleted_at", null)
        .order("display_order");
      if (error) toast.error(error.message);
      else if (data) setItems(data as ProductCategory[]);
      setLoading(false);
    }
    load();
  }, []);

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        id: "",
        name: L(),
        slug: "",
        image: null,
        is_active: true,
        deleted_at: null,
        display_order: prev.length,
      } as ProductCategory & { display_order?: number },
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
      await upsertProductCategory({
        ...(item.id ? { id: item.id } : {}),
        name: item.name,
        slug: item.slug,
        image: item.image,
        display_order: item.display_order ?? index,
        is_active: item.is_active,
      });
      const supabase = createClient();
      const { data } = await supabase
        .from("product_categories")
        .select("*")
        .is("deleted_at", null)
        .order("display_order");
      if (data) setItems(data as ProductCategory[]);
      toast.success("Category saved!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving((prev) => ({ ...prev, [index]: false }));
    }
  }

  async function handleDelete(item: ProductCategory) {
    if (!item.id) {
      setItems((prev) => prev.filter((i) => i !== item));
      return;
    }
    try {
      await deleteProductCategory(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success("Category archived!");
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
            Product Categories
          </h1>
          <p className="text-sm text-muted-foreground">
            Organize products by category.
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Slug</label>
                <Input
                  value={item.slug}
                  onChange={(e) => updateItem(i, "slug", e.target.value)}
                  placeholder="auto-generated"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Display Order
                </label>
                <Input
                  type="number"
                  value={item.display_order ?? 0}
                  onChange={(e) =>
                    updateItem(i, "display_order", Number(e.target.value))
                  }
                />
              </div>
            </div>
            <ImageUpload
              label="Category Image"
              value={item.image}
              onChange={(url) => updateItem(i, "image", url)}
              folder="products"
            />
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
                Save
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(item)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Archive
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
