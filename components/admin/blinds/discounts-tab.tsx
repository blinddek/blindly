"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { saveVolumeDiscounts } from "@/lib/pricing-rules-actions";
import {
  DEFAULT_VOLUME_DISCOUNTS,
  type VolumeDiscounts,
  type VolumeDiscountTier,
} from "@/types/pricing-rules";

function formatRand(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function DiscountsTab() {
  const [config, setConfig] = useState<VolumeDiscounts>(DEFAULT_VOLUME_DISCOUNTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/pricing-rules")
      .then((r) => r.json())
      .then((d) => { if (d.volume_discounts) setConfig(d.volume_discounts); })
      .finally(() => setLoading(false));
  }, []);

  function setTierField(idx: number, key: keyof VolumeDiscountTier, value: number | null) {
    setConfig((c) => ({
      tiers: c.tiers.map((t, i) => (i === idx ? { ...t, [key]: value } : t)),
    }));
  }

  function addTier() {
    setConfig((c) => ({
      tiers: [...c.tiers, { min_cents: 0, max_cents: null, rate: 0.025 }],
    }));
  }

  function removeTier(idx: number) {
    setConfig((c) => ({ tiers: c.tiers.filter((_, i) => i !== idx) }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveVolumeDiscounts(config);
      toast.success("Volume discounts saved");
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
        <h2 className="text-base font-semibold">Volume Discounts</h2>
        <p className="text-sm text-muted-foreground">
          Automatically applied to cart totals (VAT-inclusive). Customers see the discount
          broken out on their cart and at checkout.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Discount Tiers</CardTitle>
              <CardDescription>
                Tier is matched against the cart total (inc. VAT). Only the highest matching tier applies.
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
            <span>From (R)</span>
            <span>To (R)</span>
            <span>Discount %</span>
            <span />
          </div>

          {config.tiers.map((tier, idx) => (
            <div key={idx} className="grid grid-cols-4 gap-2 items-center">
              <Input
                type="number"
                min={0}
                step={1000}
                value={(tier.min_cents / 100).toFixed(0)}
                onChange={(e) =>
                  setTierField(idx, "min_cents", Math.round(Number.parseFloat(e.target.value) * 100))
                }
              />
              <Input
                type="number"
                min={0}
                step={1000}
                placeholder="No limit"
                value={tier.max_cents === null ? "" : (tier.max_cents / 100).toFixed(0)}
                onChange={(e) =>
                  setTierField(
                    idx,
                    "max_cents",
                    e.target.value === "" ? null : Math.round(Number.parseFloat(e.target.value) * 100)
                  )
                }
              />
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={(tier.rate * 100).toFixed(1)}
                  onChange={(e) =>
                    setTierField(idx, "rate", Number.parseFloat(e.target.value) / 100)
                  }
                  className="pr-6"
                />
                <span className="absolute right-2 top-2 text-xs text-muted-foreground">%</span>
              </div>
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
            <p className="text-sm text-muted-foreground py-2">No discount tiers configured.</p>
          )}

          {/* Preview */}
          {config.tiers.length > 0 && (
            <div className="mt-4 rounded-md border bg-muted/30 p-3 text-xs space-y-1">
              <p className="font-medium text-muted-foreground mb-2">Preview</p>
              {config.tiers.map((t, i) => (
                <div key={i} className="flex justify-between">
                  <span>
                    {formatRand(t.min_cents)}
                    {t.max_cents ? ` – ${formatRand(t.max_cents)}` : "+"}
                  </span>
                  <span className="font-medium text-primary">{(t.rate * 100).toFixed(1)}% off</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save Volume Discounts
      </Button>
    </div>
  );
}
