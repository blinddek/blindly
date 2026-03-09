"use client";

import { useEffect, useState } from "react";
import { SettingsLayout } from "@/components/admin/settings-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save, ChevronDown, ChevronUp, Layers, Blinds, Palette } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { upsertCategory, deleteCategory, upsertType, deleteType, upsertRange, deleteRange } from "./actions";

// ─── Types ────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
}

interface BlindType {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  material: string;
  slat_size_mm: number | null;
  description: string;
  min_width_cm: number;
  max_width_cm: number;
  min_drop_cm: number;
  max_drop_cm: number;
  min_frame_depth_mm: number | null;
  display_order: number;
  is_active: boolean;
}

interface ColourOption {
  name: string;
  hex: string;
}

interface Range {
  id: string;
  blind_type_id: string;
  name: string;
  slug: string;
  description: string;
  lifestyle_image_url: string;
  starting_price_cents: number | null;
  supplier: string;
  colour_options: ColourOption[];
  display_order: number;
  is_active: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────

function slugify(text: string) {
  return text.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/(^-|-$)/g, "");
}

// ─── Page ─────────────────────────────────────────────────────

export default function AdminProductsPage() {
  return (
    <SettingsLayout
      title="Products"
      description="Manage blind categories, types, and ranges."
      tabs={[
        { key: "categories", label: "Categories", icon: Layers },
        { key: "types", label: "Types", icon: Blinds },
        { key: "ranges", label: "Ranges", icon: Palette },
      ]}
    >
      {(activeTab) => (
        <>
          {activeTab === "categories" && <CategoriesTab />}
          {activeTab === "types" && <TypesTab />}
          {activeTab === "ranges" && <RangesTab />}
        </>
      )}
    </SettingsLayout>
  );
}

// ─── Categories Tab ───────────────────────────────────────────

function emptyCategory(): Omit<Category, "id"> {
  return { name: "", slug: "", description: "", image_url: "", display_order: 0, is_active: true };
}

function CategoriesTab() {
  const [items, setItems] = useState<(Category | Omit<Category, "id">)[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const supabase = createClient();
    supabase.from("blind_categories").select("*").order("display_order").then(({ data }) => {
      setItems(data ?? []);
      setLoading(false);
    });
  }, []);

  function update(i: number, key: string, value: unknown) {
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [key]: value } : item));
  }

  function handleNameChange(i: number, name: string) {
    setItems((prev) => prev.map((item, idx) => {
      if (idx !== i) return item;
      const updated = { ...item, name };
      if (!("id" in item) || item.slug === "" || item.slug === slugify((item as Category).name ?? "")) {
        (updated as Category).slug = slugify(name);
      }
      return updated;
    }));
  }

  async function handleSave(i: number) {
    const item = items[i];
    if (!item.name.trim()) { toast.error("Name is required"); return; }
    setSaving((s) => ({ ...s, [i]: true }));
    const result = await upsertCategory({
      ...("id" in item ? { id: item.id } : {}),
      name: item.name,
      slug: item.slug || slugify(item.name),
      description: item.description,
      image_url: item.image_url,
      display_order: item.display_order,
      is_active: item.is_active,
    });
    setSaving((s) => ({ ...s, [i]: false }));
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Category saved");
    }
  }

  async function handleDelete(i: number) {
    const item = items[i];
    if (!("id" in item)) { setItems((prev) => prev.filter((_, idx) => idx !== i)); return; }
    setDeleting((s) => ({ ...s, [item.id]: true }));
    const result = await deleteCategory(item.id);
    setDeleting((s) => ({ ...s, [item.id]: false }));
    if (result.error) { toast.error(result.error); return; }
    setItems((prev) => prev.filter((_, idx) => idx !== i));
    toast.success("Category deleted");
  }

  if (loading) return <TabLoading />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setItems((p) => [...p, emptyCategory()])}>
          <Plus className="mr-1 h-3 w-3" /> Add Category
        </Button>
      </div>

      {items.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">No categories yet. Add one above.</p>
      )}

      {items.map((item, i) => (
        <Card key={"id" in item ? item.id : `new-${i}`}>
          <CardContent className="pt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={item.name} onChange={(e) => handleNameChange(i, e.target.value)} placeholder="e.g. Roller Blinds" />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input value={item.slug} onChange={(e) => update(i, "slug", e.target.value)} placeholder="roller-blinds" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Description</Label>
                <Input value={item.description} onChange={(e) => update(i, "description", e.target.value)} placeholder="Short description for the category page" />
              </div>
              <div className="space-y-1.5">
                <Label>Image URL</Label>
                <Input value={item.image_url ?? ""} onChange={(e) => update(i, "image_url", e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label>Display Order</Label>
                <Input type="number" value={item.display_order} onChange={(e) => update(i, "display_order", Number(e.target.value))} className="w-24" />
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={item.is_active} onCheckedChange={(v) => update(i, "is_active", v)} />
                Active
              </label>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => handleDelete(i)} disabled={"id" in item && deleting[item.id]}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => handleSave(i)} disabled={saving[i]}>
                  {saving[i] ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Types Tab ────────────────────────────────────────────────

function emptyType(categoryId: string): Omit<BlindType, "id"> {
  return {
    category_id: categoryId, name: "", slug: "", material: "", slat_size_mm: null, description: "",
    min_width_cm: 30, max_width_cm: 300, min_drop_cm: 30, max_drop_cm: 300,
    min_frame_depth_mm: null, display_order: 0, is_active: true,
  };
}

function TypesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState("");
  const [items, setItems] = useState<(BlindType | Omit<BlindType, "id">)[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const supabase = createClient();
    supabase.from("blind_categories").select("id,name").order("display_order").then(({ data }) => {
      const cats = (data ?? []) as Category[];
      setCategories(cats);
      if (cats.length > 0) setSelectedCat(cats[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedCat) return;
    const supabase = createClient();
    supabase.from("blind_types").select("*").eq("category_id", selectedCat).order("display_order")
      .then(({ data }) => setItems((data ?? []) as BlindType[]));
  }, [selectedCat]);

  function update(i: number, key: string, value: unknown) {
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [key]: value } : item));
  }

  function handleNameChange(i: number, name: string) {
    setItems((prev) => prev.map((item, idx) => {
      if (idx !== i) return item;
      const updated = { ...item, name };
      if (!("id" in item) || (item as BlindType).slug === "" || (item as BlindType).slug === slugify((item as BlindType).name ?? "")) {
        (updated as BlindType).slug = slugify(name);
      }
      return updated;
    }));
  }

  async function handleSave(i: number) {
    const item = items[i];
    if (!item.name.trim()) { toast.error("Name is required"); return; }
    setSaving((s) => ({ ...s, [i]: true }));
    const result = await upsertType({
      ...("id" in item ? { id: item.id } : {}),
      category_id: item.category_id,
      name: item.name,
      slug: item.slug || slugify(item.name),
      material: item.material,
      slat_size_mm: item.slat_size_mm,
      description: item.description,
      min_width_cm: item.min_width_cm,
      max_width_cm: item.max_width_cm,
      min_drop_cm: item.min_drop_cm,
      max_drop_cm: item.max_drop_cm,
      min_frame_depth_mm: item.min_frame_depth_mm,
      display_order: item.display_order,
      is_active: item.is_active,
    });
    setSaving((s) => ({ ...s, [i]: false }));
    if (result.error) { toast.error(result.error); } else { toast.success("Type saved"); }
  }

  async function handleDelete(i: number) {
    const item = items[i];
    if (!("id" in item)) { setItems((prev) => prev.filter((_, idx) => idx !== i)); return; }
    setDeleting((s) => ({ ...s, [item.id]: true }));
    const result = await deleteType(item.id);
    setDeleting((s) => ({ ...s, [item.id]: false }));
    if (result.error) { toast.error(result.error); return; }
    setItems((prev) => prev.filter((_, idx) => idx !== i));
    toast.success("Type deleted");
  }

  if (loading) return <TabLoading />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={selectedCat} onValueChange={setSelectedCat}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={() => setItems((p) => [...p, emptyType(selectedCat)])}>
          <Plus className="mr-1 h-3 w-3" /> Add Type
        </Button>
      </div>

      {items.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">No types for this category yet.</p>
      )}

      {items.map((item, i) => (
        <Card key={"id" in item ? item.id : `new-${i}`}>
          <CardContent className="pt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={item.name} onChange={(e) => handleNameChange(i, e.target.value)} placeholder="e.g. 25mm Aluminium" />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input value={item.slug} onChange={(e) => update(i, "slug", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Material</Label>
                <Input value={item.material} onChange={(e) => update(i, "material", e.target.value)} placeholder="aluminium / wood / fabric" />
              </div>
              <div className="space-y-1.5">
                <Label>Slat Size (mm)</Label>
                <Input type="number" value={item.slat_size_mm ?? ""} onChange={(e) => update(i, "slat_size_mm", e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 25 (blank = roller)" />
              </div>
              <div className="space-y-1.5">
                <Label>Min Frame Depth (mm)</Label>
                <Input type="number" value={item.min_frame_depth_mm ?? ""} onChange={(e) => update(i, "min_frame_depth_mm", e.target.value ? Number(e.target.value) : null)} placeholder="optional" />
              </div>
              <div className="space-y-1.5">
                <Label>Display Order</Label>
                <Input type="number" value={item.display_order} onChange={(e) => update(i, "display_order", Number(e.target.value))} className="w-24" />
              </div>
            </div>

            {/* Dimension bounds */}
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Dimension Limits</p>
              <div className="grid gap-3 sm:grid-cols-4">
                {(["min_width_cm", "max_width_cm", "min_drop_cm", "max_drop_cm"] as const).map((key) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{key.replaceAll("_", " ").replace("cm", "(cm)")}</Label>
                    <Input type="number" step={0.5} value={(item as BlindType)[key]} onChange={(e) => update(i, key, Number(e.target.value))} />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={item.description} onChange={(e) => update(i, "description", e.target.value)} placeholder="Optional short description" />
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={item.is_active} onCheckedChange={(v) => update(i, "is_active", v)} />
                Active
              </label>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => handleDelete(i)} disabled={"id" in item && deleting[item.id]}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => handleSave(i)} disabled={saving[i]}>
                  {saving[i] ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Ranges Tab ───────────────────────────────────────────────

function emptyRange(typeId: string): Omit<Range, "id"> {
  return {
    blind_type_id: typeId, name: "", slug: "", description: "", lifestyle_image_url: "",
    starting_price_cents: null, supplier: "shademaster", colour_options: [], display_order: 0, is_active: true,
  };
}

function RangesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<BlindType[]>([]);
  const [selectedCat, setSelectedCat] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [items, setItems] = useState<(Range | Omit<Range, "id">)[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const supabase = createClient();
    supabase.from("blind_categories").select("id,name").order("display_order").then(({ data }) => {
      const cats = (data ?? []) as Category[];
      setCategories(cats);
      if (cats.length > 0) setSelectedCat(cats[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedCat) return;
    const supabase = createClient();
    supabase.from("blind_types").select("id,name,category_id").eq("category_id", selectedCat).order("display_order")
      .then(({ data }) => {
        const t = (data ?? []) as BlindType[];
        setTypes(t);
        setSelectedType(t.length > 0 ? t[0].id : "");
      });
  }, [selectedCat]);

  useEffect(() => {
    if (!selectedType) { setItems([]); return; }
    const supabase = createClient();
    supabase.from("blind_ranges").select("*").eq("blind_type_id", selectedType).order("display_order")
      .then(({ data }) => setItems(
        (data ?? []).map((r) => ({
          ...r,
          colour_options: Array.isArray(r.colour_options) ? r.colour_options : [],
        })) as Range[]
      ));
  }, [selectedType]);

  function update(i: number, key: string, value: unknown) {
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [key]: value } : item));
  }

  function handleNameChange(i: number, name: string) {
    setItems((prev) => prev.map((item, idx) => {
      if (idx !== i) return item;
      const updated = { ...item, name };
      if (!("id" in item) || (item as Range).slug === "" || (item as Range).slug === slugify((item as Range).name ?? "")) {
        (updated as Range).slug = slugify(name);
      }
      return updated;
    }));
  }

  function updateColour(i: number, ci: number, key: "name" | "hex", value: string) {
    setItems((prev) => prev.map((item, idx) => {
      if (idx !== i) return item;
      const colours = [...item.colour_options];
      colours[ci] = { ...colours[ci], [key]: value };
      return { ...item, colour_options: colours };
    }));
  }

  function addColour(i: number) {
    setItems((prev) => prev.map((item, idx) =>
      idx === i ? { ...item, colour_options: [...item.colour_options, { name: "", hex: "#ffffff" }] } : item
    ));
  }

  function removeColour(i: number, ci: number) {
    setItems((prev) => prev.map((item, idx) =>
      idx === i ? { ...item, colour_options: item.colour_options.filter((_, j) => j !== ci) } : item
    ));
  }

  async function handleSave(i: number) {
    const item = items[i];
    if (!item.name.trim()) { toast.error("Name is required"); return; }
    setSaving((s) => ({ ...s, [i]: true }));
    const result = await upsertRange({
      ...("id" in item ? { id: item.id } : {}),
      blind_type_id: item.blind_type_id,
      name: item.name,
      slug: item.slug || slugify(item.name),
      description: item.description,
      lifestyle_image_url: item.lifestyle_image_url,
      starting_price_cents: item.starting_price_cents,
      supplier: item.supplier,
      colour_options: item.colour_options,
      display_order: item.display_order,
      is_active: item.is_active,
    });
    setSaving((s) => ({ ...s, [i]: false }));
    if (result.error) { toast.error(result.error); } else { toast.success("Range saved"); }
  }

  async function handleDelete(i: number) {
    const item = items[i];
    if (!("id" in item)) { setItems((prev) => prev.filter((_, idx) => idx !== i)); return; }
    setDeleting((s) => ({ ...s, [item.id]: true }));
    const result = await deleteRange(item.id);
    setDeleting((s) => ({ ...s, [item.id]: false }));
    if (result.error) { toast.error(result.error); return; }
    setItems((prev) => prev.filter((_, idx) => idx !== i));
    toast.success("Range deleted");
  }

  if (loading) return <TabLoading />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Select value={selectedCat} onValueChange={setSelectedCat}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedType} onValueChange={setSelectedType} disabled={types.length === 0}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {types.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" variant="outline" disabled={!selectedType} onClick={() => {
          setItems((p) => [...p, emptyRange(selectedType)]);
          setExpanded((e) => ({ ...e, [items.length]: true }));
        }}>
          <Plus className="mr-1 h-3 w-3" /> Add Range
        </Button>
      </div>

      {!selectedType && (
        <p className="py-8 text-center text-sm text-muted-foreground">Select a category and type to manage ranges.</p>
      )}
      {selectedType && items.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">No ranges for this type yet.</p>
      )}

      {items.map((item, i) => (
        <Card key={"id" in item ? item.id : `new-${i}`}>
          {/* Header row — always visible */}
          <div
            className="flex cursor-pointer items-center justify-between px-5 py-4"
            onClick={() => setExpanded((e) => ({ ...e, [i]: !e[i] }))}
          >
            <div className="flex items-center gap-3">
              <span className="font-medium">{item.name || <span className="text-muted-foreground italic">New range</span>}</span>
              <Badge variant={item.is_active ? "default" : "secondary"} className="text-xs">
                {item.is_active ? "Active" : "Inactive"}
              </Badge>
              {item.colour_options.length > 0 && (
                <div className="hidden sm:flex items-center gap-1">
                  {item.colour_options.slice(0, 6).map((c, ci) => (
                    <span key={ci} className="h-3.5 w-3.5 rounded-full border border-border/50 inline-block" style={{ background: c.hex }} title={c.name} />
                  ))}
                  {item.colour_options.length > 6 && (
                    <span className="text-xs text-muted-foreground">+{item.colour_options.length - 6}</span>
                  )}
                </div>
              )}
            </div>
            {expanded[i] ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>

          {expanded[i] && (
            <CardContent className="border-t pt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={item.name} onChange={(e) => handleNameChange(i, e.target.value)} placeholder="e.g. Plain & Designer" />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug</Label>
                  <Input value={item.slug} onChange={(e) => update(i, "slug", e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Description</Label>
                  <Input value={item.description} onChange={(e) => update(i, "description", e.target.value)} placeholder="Short description shown on the product page" />
                </div>
                <div className="space-y-1.5">
                  <Label>Lifestyle Image URL</Label>
                  <Input value={item.lifestyle_image_url} onChange={(e) => update(i, "lifestyle_image_url", e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Supplier</Label>
                  <Input value={item.supplier} onChange={(e) => update(i, "supplier", e.target.value)} placeholder="shademaster" />
                </div>
                <div className="space-y-1.5">
                  <Label>Starting Price (cents)</Label>
                  <Input type="number" value={item.starting_price_cents ?? ""} onChange={(e) => update(i, "starting_price_cents", e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 45000 = R450" />
                </div>
                <div className="space-y-1.5">
                  <Label>Display Order</Label>
                  <Input type="number" value={item.display_order} onChange={(e) => update(i, "display_order", Number(e.target.value))} className="w-24" />
                </div>
              </div>

              {/* Colour options */}
              <div className="rounded-md border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Colours ({item.colour_options.length})</p>
                  <Button size="sm" variant="outline" onClick={() => addColour(i)}>
                    <Plus className="mr-1 h-3 w-3" /> Add Colour
                  </Button>
                </div>
                {item.colour_options.length === 0 && (
                  <p className="text-xs text-muted-foreground">No colours defined. Colours are usually imported with the price sheet.</p>
                )}
                <div className="space-y-2">
                  {item.colour_options.map((c, ci) => (
                    <div key={ci} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={c.hex}
                        onChange={(e) => updateColour(i, ci, "hex", e.target.value)}
                        className="h-8 w-8 cursor-pointer rounded border p-0.5"
                        title="Colour hex"
                      />
                      <Input
                        value={c.name}
                        onChange={(e) => updateColour(i, ci, "name", e.target.value)}
                        placeholder="Colour name"
                        className="flex-1"
                      />
                      <span className="w-20 text-xs text-muted-foreground font-mono">{c.hex}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeColour(i, ci)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={item.is_active} onCheckedChange={(v) => update(i, "is_active", v)} />
                  Active
                </label>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(i)} disabled={"id" in item && deleting[item.id]}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={() => handleSave(i)} disabled={saving[i]}>
                    {saving[i] ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}

// ─── Shared ───────────────────────────────────────────────────

function TabLoading() {
  return (
    <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading...
    </div>
  );
}
