"use client";

import { useEffect, useState } from "react";
import { SettingsLayout } from "@/components/admin/settings-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, RotateCcw, Percent, Truck, Upload, Search, ListChecks, Clock, Plus } from "lucide-react";
import { toast } from "sonner";
import { setGlobalMarkup, setCategoryMarkup, setSupplierMarkup, addSupplier } from "./actions";
import { ImportTab, PriceCheckerTab, MappingsTab, HistoryTab } from "@/components/admin/blinds/import-tabs";

// ─── Types ──────────────────────────────────────────────────

interface SupplierRow {
  id: string;
  name: string;
  slug: string;
  markup_percent: number | null;
}

interface CategoryRow {
  id: string;
  name: string;
  markup_percent: number | null;
}

interface PricingData {
  global_markup: number;
  suppliers: SupplierRow[];
  categories: CategoryRow[];
}

// ─── Page ────────────────────────────────────────────────────

export default function BlindsPricingPage() {
  return (
    <SettingsLayout
      title="Pricing"
      description="Manage supplier price imports and configure profit margins."
      tabs={[
        { key: "import", label: "Import", icon: Upload },
        { key: "prices", label: "Prices", icon: Search },
        { key: "margins", label: "Profit Margins", icon: Percent },
        { key: "mappings", label: "Mappings", icon: ListChecks },
        { key: "history", label: "History", icon: Clock },
      ]}
    >
      {(activeTab) => (
        <>
          {activeTab === "margins" && <ProfitMarginsTab />}
          {activeTab === "import" && <ImportTab />}
          {activeTab === "prices" && <PriceCheckerTab />}
          {activeTab === "mappings" && <MappingsTab />}
          {activeTab === "history" && <HistoryTab />}
        </>
      )}
    </SettingsLayout>
  );
}

// ─── Profit Margins Tab ──────────────────────────────────────

function ProfitMarginsTab() {
  const [data, setData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);

  // Global
  const [globalValue, setGlobalValue] = useState("");
  const [savingGlobal, setSavingGlobal] = useState(false);

  // Suppliers
  const [supplierValues, setSupplierValues] = useState<Record<string, string>>({});
  const [savingSupplier, setSavingSupplier] = useState<string | null>(null);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);

  // Categories
  const [categoryValues, setCategoryValues] = useState<Record<string, string>>({});
  const [savingCategory, setSavingCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/blinds/pricing")
      .then((r) => r.json())
      .then((d: PricingData) => {
        setData(d);
        setGlobalValue(String(d.global_markup));

        const supVals: Record<string, string> = {};
        for (const s of d.suppliers) {
          supVals[s.id] = s.markup_percent === null ? "" : String(s.markup_percent);
        }
        setSupplierValues(supVals);

        const catVals: Record<string, string> = {};
        for (const cat of d.categories) {
          catVals[cat.id] = cat.markup_percent === null ? "" : String(cat.markup_percent);
        }
        setCategoryValues(catVals);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveGlobal() {
    const val = Number.parseFloat(globalValue);
    if (Number.isNaN(val) || val < 0 || val > 1000) {
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

  async function handleSaveSupplier(supplierId: string) {
    const raw = supplierValues[supplierId];
    const val = raw === "" ? null : Number.parseFloat(raw);
    if (val !== null && (Number.isNaN(val) || val < 0 || val > 1000)) {
      toast.error("Enter a valid percentage (0–1000)");
      return;
    }
    setSavingSupplier(supplierId);
    const result = await setSupplierMarkup(supplierId, val);
    setSavingSupplier(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(val === null ? "Supplier override removed" : "Supplier markup saved");
      setData((prev) =>
        prev
          ? {
              ...prev,
              suppliers: prev.suppliers.map((s) =>
                s.id === supplierId ? { ...s, markup_percent: val } : s
              ),
            }
          : prev
      );
    }
  }

  async function handleAddSupplier() {
    if (!newSupplierName.trim()) return;
    setAddingSupplier(true);
    const result = await addSupplier(newSupplierName.trim());
    setAddingSupplier(false);
    if (result.error) {
      toast.error(result.error);
    } else if (result.supplier) {
      const s = result.supplier;
      setData((prev) =>
        prev
          ? { ...prev, suppliers: [...prev.suppliers, { id: s.id, name: s.name, slug: s.slug, markup_percent: null }] }
          : prev
      );
      setSupplierValues((prev) => ({ ...prev, [s.id]: "" }));
      setNewSupplierName("");
      setShowAddSupplier(false);
      toast.success(`Supplier "${s.name}" added`);
    }
  }

  async function handleSaveCategory(categoryId: string) {
    const raw = categoryValues[categoryId];
    const val = raw === "" ? null : Number.parseFloat(raw);
    if (val !== null && (Number.isNaN(val) || val < 0 || val > 1000)) {
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
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Profit Margin Configuration</h2>
        <p className="text-sm text-muted-foreground">
          Set the markup % added on top of supplier cost price. VAT is applied separately at checkout.
          Cascade: Range → Type → Category → Supplier → Global.
        </p>
      </div>

      {/* Global markup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Global Markup</CardTitle>
          <CardDescription>
            Applies to all blinds unless overridden at a more specific level.
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

      {/* Per-supplier overrides */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Supplier Overrides
              </CardTitle>
              <CardDescription>
                Set a tighter margin for competitive suppliers. Overrides the global, but is overridden by category/type/range.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAddSupplier((v) => !v)}>
              <Plus className="mr-1 h-3 w-3" />
              Add Supplier
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddSupplier && (
            <div className="flex items-end gap-3 rounded-md border bg-muted/30 p-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="new-supplier">New Supplier Name</Label>
                <Input
                  id="new-supplier"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="e.g. Blinds Direct"
                  onKeyDown={(e) => e.key === "Enter" && handleAddSupplier()}
                />
              </div>
              <Button onClick={handleAddSupplier} disabled={addingSupplier || !newSupplierName.trim()}>
                {addingSupplier ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
              </Button>
              <Button variant="ghost" onClick={() => { setShowAddSupplier(false); setNewSupplierName(""); }}>
                Cancel
              </Button>
            </div>
          )}

          {data.suppliers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No suppliers yet. Add one above.</p>
          ) : (
            data.suppliers.map((s) => (
              <div key={s.id} className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Label>{s.name}</Label>
                    {s.markup_percent === null ? (
                      <Badge variant="secondary" className="text-xs">inherits {data.global_markup}%</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">{s.markup_percent}% override</Badge>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={1000}
                      step={0.5}
                      placeholder={`Default: ${data.global_markup}%`}
                      value={supplierValues[s.id] ?? ""}
                      onChange={(e) =>
                        setSupplierValues((prev) => ({ ...prev, [s.id]: e.target.value }))
                      }
                      className="pr-8"
                    />
                    <Percent className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={() => handleSaveSupplier(s.id)}
                    disabled={savingSupplier === s.id}
                  >
                    {savingSupplier === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                  {s.markup_percent !== null && (
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Remove override"
                      disabled={savingSupplier === s.id}
                      onClick={() => {
                        setSupplierValues((prev) => ({ ...prev, [s.id]: "" }));
                        handleSaveSupplier(s.id);
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Per-category overrides */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category Overrides</CardTitle>
          <CardDescription>
            Leave blank to inherit. Set a value to override for that category only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories found.</p>
          ) : (
            data.categories.map((cat) => (
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
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
