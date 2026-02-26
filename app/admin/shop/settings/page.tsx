"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateShopSetting } from "@/lib/shop/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SettingsForm {
  shipping_rate_cents: number;
  free_shipping_threshold_cents: number;
  tax_rate_percent: number;
}

const defaults: SettingsForm = {
  shipping_rate_cents: 5000,
  free_shipping_threshold_cents: 50000,
  tax_rate_percent: 15,
};

export default function ShopSettingsPage() {
  const [settings, setSettings] = useState<SettingsForm>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("shop_settings").select("key, value");
      if (data) {
        const s = { ...defaults };
        for (const row of data) {
          const val =
            typeof row.value === "number" ? row.value : Number(row.value);
          if (row.key in s) {
            (s as Record<string, number>)[row.key] = val;
          }
        }
        setSettings(s);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await Promise.all([
        updateShopSetting("shipping_rate_cents", settings.shipping_rate_cents),
        updateShopSetting(
          "free_shipping_threshold_cents",
          settings.free_shipping_threshold_cents
        ),
        updateShopSetting("tax_rate_percent", settings.tax_rate_percent),
      ]);
      toast.success("Shop settings saved!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-bold text-foreground">Shop Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure shipping, tax, and payment settings.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Shipping Rate (cents)
            </label>
            <Input
              type="number"
              value={settings.shipping_rate_cents}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  shipping_rate_cents: Number(e.target.value),
                }))
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">
              e.g. 5000 = R 50.00
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Free Shipping Threshold (cents)
            </label>
            <Input
              type="number"
              value={settings.free_shipping_threshold_cents}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  free_shipping_threshold_cents: Number(e.target.value),
                }))
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Orders above this amount get free shipping. e.g. 50000 = R 500.00
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Tax Rate (%)
            </label>
            <Input
              type="number"
              value={settings.tax_rate_percent}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  tax_rate_percent: Number(e.target.value),
                }))
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">
              e.g. 15 = 15% VAT
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
