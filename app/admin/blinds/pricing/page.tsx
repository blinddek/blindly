"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, RotateCcw, Percent } from "lucide-react";
import { toast } from "sonner";
import { setGlobalMarkup, setCategoryMarkup } from "./actions";

interface Category {
  id: string;
  name: string;
  markup_percent: number | null; // null = inherits global
}

interface PricingData {
  global_markup: number;
  categories: Category[];
}

export default function BlindsPricingPage() {
  const [data, setData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalValue, setGlobalValue] = useState("");
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [categoryValues, setCategoryValues] = useState<Record<string, string>>({});
  const [savingCategory, setSavingCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/blinds/pricing")
      .then((r) => r.json())
      .then((d: PricingData) => {
        setData(d);
        setGlobalValue(String(d.global_markup));
        const catVals: Record<string, string> = {};
        for (const cat of d.categories) {
          catVals[cat.id] = cat.markup_percent !== null ? String(cat.markup_percent) : "";
        }
        setCategoryValues(catVals);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveGlobal() {
    const val = parseFloat(globalValue);
    if (isNaN(val) || val < 0 || val > 1000) {
      toast.error("Enter a valid percentage (0–1000)");
      return;
    }
    setSavingGlobal(true);
    const result = await setGlobalMarkup(val);
    setSavingGlobal(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Global markup saved");
      setData((prev) => prev ? { ...prev, global_markup: val } : prev);
    }
  }

  async function handleSaveCategory(categoryId: string) {
    const raw = categoryValues[categoryId];
    const val = raw === "" ? null : parseFloat(raw);
    if (val !== null && (isNaN(val) || val < 0 || val > 1000)) {
      toast.error("Enter a valid percentage (0–1000)");
      return;
    }
    setSavingCategory(categoryId);
    const result = await setCategoryMarkup(categoryId, val);
    setSavingCategory(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(val === null ? "Category override removed" : "Category markup saved");
      setData((prev) =>
        prev
          ? {
              ...prev,
              categories: prev.categories.map((c) =>
                c.id === categoryId ? { ...c, markup_percent: val } : c
              ),
            }
          : prev
      );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading pricing config...
      </div>
    );
  }

  if (!data) return <p className="text-destructive">Failed to load pricing data.</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Blind Pricing — Profit Margin</h1>
        <p className="text-sm text-muted-foreground">
          Set the markup % added on top of supplier cost price. VAT is applied separately at checkout.
        </p>
      </div>

      {/* Global markup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Global Markup</CardTitle>
          <CardDescription>
            Applies to all blinds unless overridden per category below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="global-markup">Markup %</Label>
              <div className="relative">
                <Input
                  id="global-markup"
                  type="number"
                  min={0}
                  max={1000}
                  step={0.5}
                  value={globalValue}
                  onChange={(e) => setGlobalValue(e.target.value)}
                  className="pr-8"
                />
                <Percent className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <Button onClick={handleSaveGlobal} disabled={savingGlobal}>
              {savingGlobal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
          </div>

          {data.global_markup > 0 && (
            <p className="text-xs text-muted-foreground">
              Example: supplier cost R100 → selling price R{(100 * (1 + data.global_markup / 100)).toFixed(2)} (ex VAT)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Per-category overrides */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category Overrides</CardTitle>
          <CardDescription>
            Leave blank to inherit the global markup. Set a value to override for that category only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.categories.map((cat) => (
            <div key={cat.id} className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label>{cat.name}</Label>
                  {cat.markup_percent === null ? (
                    <Badge variant="secondary" className="text-xs">inherits {data.global_markup}%</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">{cat.markup_percent}% override</Badge>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    max={1000}
                    step={0.5}
                    placeholder={`Default: ${data.global_markup}%`}
                    value={categoryValues[cat.id] ?? ""}
                    onChange={(e) =>
                      setCategoryValues((prev) => ({ ...prev, [cat.id]: e.target.value }))
                    }
                    className="pr-8"
                  />
                  <Percent className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={() => handleSaveCategory(cat.id)}
                  disabled={savingCategory === cat.id}
                >
                  {savingCategory === cat.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
                {cat.markup_percent !== null && (
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Remove override"
                    disabled={savingCategory === cat.id}
                    onClick={() => {
                      setCategoryValues((prev) => ({ ...prev, [cat.id]: "" }));
                      handleSaveCategory(cat.id);
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
