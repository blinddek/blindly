"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { saveInstallationPricing } from "@/lib/pricing-rules-actions";
import {
  DEFAULT_INSTALLATION_PRICING,
  type InstallationPricing,
  type InstallationTier,
} from "@/types/pricing-rules";

function formatRand(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function InstallationTab() {
  const [config, setConfig] = useState<InstallationPricing>(DEFAULT_INSTALLATION_PRICING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/pricing-rules")
      .then((r) => r.json())
      .then((d) => { if (d.installation_pricing) setConfig(d.installation_pricing); })
      .finally(() => setLoading(false));
  }, []);

  function setField<K extends keyof InstallationPricing>(key: K, value: InstallationPricing[K]) {
    setConfig((c) => ({ ...c, [key]: value }));
  }

  function setTierField(idx: number, key: keyof InstallationTier, value: number | null) {
    setConfig((c) => ({
      ...c,
      tiers: c.tiers.map((t, i) => (i === idx ? { ...t, [key]: value } : t)),
    }));
  }

  function addTier() {
    setConfig((c) => ({
      ...c,
      tiers: [...c.tiers, { min_blinds: 1, max_blinds: null, cost_cents: 0 }],
    }));
  }

  function removeTier(idx: number) {
    setConfig((c) => ({ ...c, tiers: c.tiers.filter((_, i) => i !== idx) }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveInstallationPricing(config);
      toast.success("Installation pricing saved");
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
        <h2 className="text-base font-semibold">Installation & Transport Pricing</h2>
        <p className="text-sm text-muted-foreground">
          Applies when customers select professional installation at checkout.
          Transport = distance × price/km × 2 (round trip). Free within the radius below.
        </p>
      </div>

      {/* Transport config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transport Rules</CardTitle>
          <CardDescription>
            Distance charged round-trip. No fee within the free radius.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="free-radius">Free radius (km)</Label>
            <Input
              id="free-radius"
              type="number"
              min={0}
              value={config.transport_free_radius_km}
              onChange={(e) => setField("transport_free_radius_km", Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">Deliveries within this distance have no transport fee.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="km-rate">Rate per km (R)</Label>
            <Input
              id="km-rate"
              type="number"
              min={0}
              step={0.5}
              value={(config.price_per_km_cents / 100).toFixed(2)}
              onChange={(e) => setField("price_per_km_cents", Math.round(Number.parseFloat(e.target.value) * 100))}
            />
            <p className="text-xs text-muted-foreground">
              Charged per km one-way × 2 = round trip. E.g. 60 km at R{(config.price_per_km_cents / 100).toFixed(2)}/km = {formatRand(60 * config.price_per_km_cents * 2)} total.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Installation tiers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Installation Cost Tiers</CardTitle>
              <CardDescription>
                Cost based on number of blinds being installed. Set cost to R0 for free installation.
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
            <span>Min blinds</span>
            <span>Max blinds</span>
            <span>Cost (R)</span>
            <span />
          </div>
          {config.tiers.map((tier, idx) => (
            <div key={idx} className="grid grid-cols-4 gap-2 items-center">
              <Input
                type="number"
                min={1}
                value={tier.min_blinds}
                onChange={(e) => setTierField(idx, "min_blinds", Number(e.target.value))}
              />
              <Input
                type="number"
                min={1}
                placeholder="∞"
                value={tier.max_blinds ?? ""}
                onChange={(e) =>
                  setTierField(idx, "max_blinds", e.target.value === "" ? null : Number(e.target.value))
                }
              />
              <Input
                type="number"
                min={0}
                step={50}
                value={(tier.cost_cents / 100).toFixed(0)}
                onChange={(e) => setTierField(idx, "cost_cents", Math.round(Number.parseFloat(e.target.value) * 100))}
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

          {/* Preview table */}
          {config.tiers.length > 0 && (
            <div className="mt-4 rounded-md border bg-muted/30 p-3 text-xs space-y-1">
              <p className="font-medium text-muted-foreground mb-2">Preview</p>
              {config.tiers.map((t, i) => (
                <div key={i} className="flex justify-between">
                  <span>
                    {t.min_blinds}
                    {t.max_blinds ? `–${t.max_blinds}` : "+"} blind{(t.max_blinds ?? 2) > 1 ? "s" : ""}
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
        Save Installation Pricing
      </Button>
    </div>
  );
}
