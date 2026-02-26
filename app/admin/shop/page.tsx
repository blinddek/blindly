"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { upsertProduct, deleteProduct } from "@/lib/shop/actions";
import { LocalizedInput } from "@/components/admin/localized-input";
import { DynamicStringList } from "@/components/admin/dynamic-string-list";
import { ImageUpload } from "@/components/admin/image-upload";
import type { LocalizedString } from "@/types/cms";
import type { ProductCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, FolderOpen, Package } from "lucide-react";
import Link from "next/link";

const L = (en = "", af = ""): LocalizedString => ({ en, af });

interface ProductForm {
  id?: string;
  slug: string;
  name: LocalizedString;
  description: LocalizedString;
  price_cents: number;
  images: string[];
  category_id: string | null;
  stock_quantity: number;
  is_active: boolean;
}

const emptyProduct = (): ProductForm => ({
  slug: "",
  name: L(),
  description: L(),
  price_cents: 0,
  images: [],
  category_id: null,
  stock_quantity: 0,
  is_active: false,
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-)|(-$)/g, "");
}

export default function AdminProductsPage() {
  const [items, setItems] = useState<ProductForm[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingItems, setSavingItems] = useState<Record<number, boolean>>({});
  const [deletingItems, setDeletingItems] = useState<Record<string, boolean>>({});
  const autoSlugged = useRef<Set<number>>(new Set());

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [productsRes, catsRes] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .is("deleted_at", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("product_categories")
          .select("*")
          .is("deleted_at", null)
          .order("display_order"),
      ]);

      if (productsRes.error) toast.error(productsRes.error.message);
      else if (productsRes.data) setItems(productsRes.data as ProductForm[]);

      if (catsRes.data) setCategories(catsRes.data as ProductCategory[]);
      setLoading(false);
    }
    load();
  }, []);

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
        const shouldAutoSlug = item.slug === "" || autoSlugged.current.has(index);
        if (shouldAutoSlug && value.en) {
          updated.slug = slugify(value.en);
          autoSlugged.current.add(index);
        } else if (shouldAutoSlug && !value.en) {
          updated.slug = "";
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
    setItems((prev) => [...prev, emptyProduct()]);
    autoSlugged.current.add(items.length);
  }

  async function handleSave(index: number) {
    setSavingItems((prev) => ({ ...prev, [index]: true }));
    try {
      const item = items[index];
      await upsertProduct({
        ...(item.id ? { id: item.id } : {}),
        name: item.name,
        slug: item.slug,
        description: item.description || null,
        price_cents: item.price_cents,
        images: item.images,
        category_id: item.category_id || null,
        stock_quantity: item.stock_quantity,
        is_active: item.is_active,
      });

      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (data) setItems(data as ProductForm[]);
      autoSlugged.current.clear();
      toast.success("Product saved!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingItems((prev) => ({ ...prev, [index]: false }));
    }
  }

  async function handleDelete(item: ProductForm) {
    if (!item.id) {
      setItems((prev) => prev.filter((i) => i !== item));
      return;
    }
    setDeletingItems((prev) => ({ ...prev, [item.id!]: true }));
    try {
      await deleteProduct(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success("Product archived!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      if (item.id) setDeletingItems((prev) => ({ ...prev, [item.id!]: false }));
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
        <p className="text-sm text-muted-foreground">
          Manage your product catalog.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/shop/categories"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <FolderOpen className="h-3 w-3" /> Categories
          </Link>
          <Link
            href="/admin/shop/orders"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Package className="h-3 w-3" /> Orders
          </Link>
          <Link
            href="/admin/shop/settings"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Settings
          </Link>
        </div>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      {items.map((item, i) => (
        <Card key={item.id ?? `new-${i}`}>
          <CardContent className="space-y-4 pt-6">
            <div>
              <label htmlFor={`product-slug-${item.id ?? i}`} className="mb-1 block text-sm font-medium">Slug</label>
              <Input
                id={`product-slug-${item.id ?? i}`}
                value={item.slug}
                onChange={(e) => handleSlugChange(i, e.target.value)}
                placeholder="auto-generated-from-name"
              />
            </div>

            <LocalizedInput
              label="Name"
              value={item.name}
              onChange={(v) => handleNameChange(i, v)}
            />

            <LocalizedInput
              label="Description"
              value={item.description}
              onChange={(v) => updateItem(i, "description", v)}
              multiline
              rows={4}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor={`product-price-${item.id ?? i}`} className="mb-1 block text-sm font-medium">
                  Price (cents)
                </label>
                <Input
                  id={`product-price-${item.id ?? i}`}
                  type="number"
                  value={item.price_cents}
                  onChange={(e) =>
                    updateItem(i, "price_cents", Number(e.target.value))
                  }
                  placeholder="e.g. 15000 = R 150.00"
                />
              </div>
              <div>
                <label htmlFor={`product-stock-${item.id ?? i}`} className="mb-1 block text-sm font-medium">
                  Stock Quantity
                </label>
                <Input
                  id={`product-stock-${item.id ?? i}`}
                  type="number"
                  value={item.stock_quantity}
                  onChange={(e) =>
                    updateItem(i, "stock_quantity", Number(e.target.value))
                  }
                />
              </div>
              <div>
                <label htmlFor={`product-category-${item.id ?? i}`} className="mb-1 block text-sm font-medium">
                  Category
                </label>
                <select
                  id={`product-category-${item.id ?? i}`}
                  value={item.category_id ?? ""}
                  onChange={(e) =>
                    updateItem(i, "category_id", e.target.value || null)
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name.en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <ImageUpload
              label="Primary Image"
              value={item.images?.[0] ?? null}
              onChange={(url) => {
                const imgs = [...(item.images ?? [])];
                if (url) {
                  imgs[0] = url;
                } else {
                  imgs.splice(0, 1);
                }
                updateItem(i, "images", imgs);
              }}
              folder="products"
            />

            <div>
              <p className="mb-1 text-sm font-medium">
                Additional Images
              </p>
              <DynamicStringList
                value={item.images?.slice(1) ?? []}
                onChange={(urls) =>
                  updateItem(i, "images", [
                    item.images?.[0] ?? "",
                    ...urls,
                  ].filter(Boolean))
                }
                placeholder="Paste image URL"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={item.is_active}
                  onChange={(e) => updateItem(i, "is_active", e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />{" "}
                <span>Active (visible in shop)</span>
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleSave(i)}
                disabled={savingItems[i]}
              >
                {savingItems[i] && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Product
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(item)}
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
          No products yet. Click &quot;Add Product&quot; to create one.
        </p>
      )}
    </div>
  );
}
