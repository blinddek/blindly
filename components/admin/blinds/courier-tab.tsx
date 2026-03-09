"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { saveCourierPricing } from "@/lib/pricing-rules-actions";
import {
  DEFAULT_COURIER_PRICING,
  type CourierPricing,
  type CourierTier,
  type CategoryWeight,
} from "@/types/pricing-rules";

interface CategoryRow {
  id: string;
  name: string;
}

function formatRand(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function CourierTab() {
  const [config, setConfig] = useState<CourierPricing>(DEFAULT_COURIER_PRICING);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/pricing-rules").then((r) => r.json()),
      fetch("/api/admin/blinds/pricing").then((r) => r.json()),
    ]).then(([rules, pricingData]) => {
      if (rules.courier_pricing) setConfig(rules.courier_pricing as CourierPricing);
      const cats: CategoryRow[] = (pricingData.categories ?? []) as CategoryRow[];
      setCategories(cats);

      // Seed any missing categories into config's category_weights
      if (rules.courier_pricing) {
        const stored = rules.courier_pricing as CourierPricing;
        const merged = cats.map((cat) => {
          const existing = stored.category_weights.find((cw) => cw.category_id === cat.id);
          return existing ?? { category_id: cat.id, category_name: cat.name, weight_per_m2_kg: 0 };
        });
        setConfig({ ...stored, category_weights: merged });
      } else {
        setConfig((c) => ({
          ...c,
          category_weights: cats.map((cat) => ({
            category_id: cat.id,
            category_name: cat.name,
            weight_per_m2_kg: 0,
          })),
        }));
      }
    }).finally(() => setLoading(false));
  }, []);

  function setCategoryWeight(categoryId: string, value: number) {
    setConfig((c) => ({
      ...c,
      category_weights: c.category_weights.map((cw) =>
        cw.category_id === categoryId ? { ...cw, weight_per_m2_kg: value } : cw
      ),
    }));
  }

  function setTierField(idx: number, key: keyof CourierTier, value: number | null) {
    setConfig((c) => ({
      ...c,
      tiers: c.tiers.map((t, i) => (i === idx ? { ...t, [key]: value } : t)),
    }));
  }

  function addTier() {
    setConfig((c) => ({
      ...c,
      tiers: [...c.tiers, { min_kg: 0, max_kg: null, cost_cents: 0 }],
    }));
  }

  function removeTier(idx: number) {
    setConfig((c) => ({ ...c, tiers: c.tiers.filter((_, i) => i !== idx) }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveCourierPricing(config);
      toast.success("Courier pricing saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Courier Pricing</h2>
        <p className="text-sm text-muted-foreground">
          Used when customers choose self-installation. Weight = width × drop × kg/m² per category + packaging.
          The total weight is matched to a price tier.
        </p>
      </div>

      {/* Packaging weight */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Packaging</CardTitle>
          <CardDescription>Fixed packaging weight added to every shipment.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 max-w-xs">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="packaging-kg">Packaging weight (kg)</Label>
              <Input
                id="packaging-kg"
                type="number"
                min={0}
                step={0.1}
                value={config.packaging_kg}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, packaging_kg: Number.parseFloat(e.target.value) || 0 }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category weights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category Weight (kg/m²)</CardTitle>
          <CardDescription>
            Set the material weight per square metre for each product category.
            Used to calculate blind weight from width × drop dimensions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {config.category_weights.length === 0 ? (
            <p className="text-sm text-muted-foreground">No product categories found.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-medium text-muted-foreground">
                <span>Category</span>
                <span>kg / m²</span>
              </div>
              {config.category_weights.map((cw: CategoryWeight) => (
                <div key={cw.category_id} className="grid grid-cols-2 gap-2 items-center">
                  <Label className="text-sm font-normal">{cw.category_name}</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    placeholder="0.0"
                    value={cw.weight_per_m2_kg || ""}
                    onChange={(e) =>
                      setCategoryWeight(cw.category_id, Number.parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      {/* Weight tiers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Courier Rate Tiers</CardTitle>
              <CardDescription>
                Price tiers based on total shipment weight. Leave Max blank for the last tier (no upper limit).
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addTier}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Tier
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground">
            <span>Min kg</span>
            <span>Max kg</span>
            <span>Cost (R)</span>
            <span />
          </div>
          {config.tiers.map((tier: CourierTier, idx: number) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: tiers have no stable id
            <div key={idx} className="grid grid-cols-4 gap-2 items-center">
              <Input
                type="number"
                min={0}
                step={0.5}
                value={tier.min_kg}
                onChange={(e) => setTierField(idx, "min_kg", Number.parseFloat(e.target.value) || 0)}
              />
              <Input
                type="number"
                min={0}
                step={0.5}
                placeholder="∞"
                value={tier.max_kg ?? ""}
                onChange={(e) =>
                  setTierField(idx, "max_kg", e.target.value === "" ? null : Number.parseFloat(e.target.value))
                }
              />
              <Input
                type="number"
                min={0}
                step={50}
                value={(tier.cost_cents / 100).toFixed(0)}
                onChange={(e) =>
                  setTierField(idx, "cost_cents", Math.round(Number.parseFloat(e.target.value) * 100) || 0)
                }
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removeTier(idx)}
                aria-label="Remove tier"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}

          {config.tiers.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">No tiers yet. Add one above.</p>
          )}

          {config.tiers.length > 0 && (
            <div className="mt-4 rounded-md border bg-muted/30 p-3 text-xs space-y-1">
              <p className="font-medium text-muted-foreground mb-2">Preview</p>
              {config.tiers.map((t: CourierTier, i: number) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: tiers have no stable id
                <div key={i} className="flex justify-between">
                  <span>
                    {t.min_kg} kg – {t.max_kg != null ? `${t.max_kg} kg` : "∞"}
                  </span>
                  <span className="font-medium">
                    {t.cost_cents === 0 ? "Free" : formatRand(t.cost_cents)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save Courier Pricing
      </Button>
    </div>
  );
}
