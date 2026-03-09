"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  FileText,
} from "lucide-react";
import {
  getSuppliers,
  createSupplier,
  parseUploadedFile,
  executeImport,
  getMappingsForSupplier,
  deleteMapping,
  getImportHistory,
} from "@/lib/blinds/import-actions";
import type { ImportSummary } from "@/lib/blinds/import";
import type {
  Supplier,
  ParsePreview,
  SheetPreview,
  ImportMapping,
  SheetMappingOverride,
} from "@/types/blinds";
import type { ImportHistoryEntry } from "@/lib/blinds/import-actions";
import { createClient } from "@/lib/supabase/client";

// ─── Shared Types ───────────────────────────────────────────

export interface RangeOption {
  id: string;
  name: string;
  slug: string;
  blind_type_id: string;
  blind_types: { name: string } | null;
}

type GroupEntry = [string, RangeOption[]];

// ─── Import Tab ─────────────────────────────────────────────

export function ImportTab() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ranges, setRanges] = useState<RangeOption[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [newSupplierName, setNewSupplierName] = useState("");
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsePreview | null>(null);
  const [overrides, setOverrides] = useState<Map<string, SheetMappingOverride>>(new Map());
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportSummary | null>(null);

  useEffect(() => {
    async function load() {
      const supplierData = await getSuppliers();
      setSuppliers(supplierData);
      if (supplierData.length > 0) setSelectedSupplier(supplierData[0].slug);

      const supabase = createClient();
      const { data } = await supabase
        .from("blind_ranges")
        .select("id, name, slug, blind_type_id, blind_types(name)")
        .eq("is_active", true)
        .order("name");
      setRanges((data as unknown as RangeOption[]) ?? []);
    }
    load();
  }, []);

  async function handleAddSupplier() {
    if (!newSupplierName.trim()) return;
    const slug = newSupplierName
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, "-")
      .replaceAll(/(^-)|(-$)/g, "");
    try {
      const supplier = await createSupplier(newSupplierName.trim(), slug);
      setSuppliers((prev) => [...prev, supplier]);
      setSelectedSupplier(slug);
      setNewSupplierName("");
      setShowNewSupplier(false);
      toast.success(`Supplier "${supplier.name}" created`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create supplier");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(null);
    setResult(null);
    setOverrides(new Map());
  }

  async function handleParse() {
    if (!file || !selectedSupplier) return;
    setParsing(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const prev = await parseUploadedFile(formData, selectedSupplier);
      setPreview(prev);

      const map = new Map<string, SheetMappingOverride>();
      for (const sheet of prev.sheets) {
        const existingId = sheet.existing_mapping?.maps_to_range_id;
        map.set(sheet.sheet_name, {
          sheet_name: sheet.sheet_name,
          parser_type: sheet.detected_parser,
          maps_to_range_ids: existingId ? [existingId] : [],
          skip: false,
        });
      }
      setOverrides(map);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Parse failed");
    } finally {
      setParsing(false);
    }
  }

  async function handleImport() {
    if (!file || !selectedSupplier) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const overrideList = Array.from(overrides.values());
      const res = await executeImport(formData, selectedSupplier, overrideList);
      setResult(res);
      toast.success(
        `Import complete: ${res.prices_created} prices imported, ${res.products_synced} products synced`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  function handleReset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setOverrides(new Map());
  }

  function updateOverride(sheetName: string, update: Partial<SheetMappingOverride>) {
    setOverrides((prev) => {
      const next = new Map(prev);
      const current = next.get(sheetName);
      if (current) next.set(sheetName, { ...current, ...update });
      return next;
    });
  }

  const grouped = ranges.reduce<Record<string, RangeOption[]>>((acc, r) => {
    const typeName = r.blind_types?.name ?? "Other";
    if (!acc[typeName]) acc[typeName] = [];
    acc[typeName].push(r);
    return acc;
  }, {});
  const groupEntries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      {/* Step 1: Supplier + File */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">1. Select Supplier & Upload File</h3>

          <div className="flex items-end gap-3">
            {!showNewSupplier ? (
              <>
                <div className="flex-1">
                  <label htmlFor="supplier-select" className="mb-1 block text-sm text-muted-foreground">Supplier</label>
                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger id="supplier-select">
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.slug}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowNewSupplier(true)}>
                  <Plus className="mr-1 size-3" /> New
                </Button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <label htmlFor="new-supplier-name" className="mb-1 block text-sm text-muted-foreground">New Supplier Name</label>
                  <Input
                    id="new-supplier-name"
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    placeholder="e.g. Blinds Direct"
                    onKeyDown={(e) => e.key === "Enter" && handleAddSupplier()}
                  />
                </div>
                <Button size="sm" onClick={handleAddSupplier}>Add</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowNewSupplier(false)}>Cancel</Button>
              </>
            )}
          </div>

          <div>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-6 text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors">
              <FileSpreadsheet className="size-5" />
              <span>{file ? file.name : "Choose XLS / XLSX file or drag & drop"}</span>
              <input
                type="file"
                accept=".xls,.xlsx,.xlsm"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <Button onClick={handleParse} disabled={!file || !selectedSupplier || parsing}>
            {parsing && <Loader2 className="mr-2 size-4 animate-spin" />}
            Parse & Preview
          </Button>
        </CardContent>
      </Card>

      {/* Step 2: Sheet Mapping */}
      {preview && !result && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                2. Map Sheets ({preview.sheets.length} detected)
              </h3>
              <Badge variant="secondary">
                {preview.sheets.reduce((s, sh) => s + sh.stats.prices, 0).toLocaleString()} total prices
              </Badge>
            </div>

            {preview.errors.length > 0 && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
                {preview.errors.map((err) => (
                  <p key={err} className="text-destructive">{err}</p>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {preview.sheets.map((sheet) => (
                <SheetMappingCard
                  key={sheet.sheet_name}
                  sheet={sheet}
                  groupEntries={groupEntries}
                  override={overrides.get(sheet.sheet_name)}
                  onUpdate={(update) => updateOverride(sheet.sheet_name, update)}
                />
              ))}
            </div>

            <Button onClick={handleImport} disabled={importing} size="lg">
              {importing && <Loader2 className="mr-2 size-4 animate-spin" />}
              Import All Sheets
            </Button>
          </CardContent>
        </Card>
      )}

      {result && <ImportResultCard result={result} onReset={handleReset} />}
    </div>
  );
}

// ─── Sheet Mapping Card ─────────────────────────────────────

function SheetMappingCard({
  sheet,
  groupEntries,
  override,
  onUpdate,
}: {
  sheet: SheetPreview;
  groupEntries: GroupEntry[];
  override?: SheetMappingOverride;
  onUpdate: (update: Partial<SheetMappingOverride>) => void;
}) {
  const needsRange =
    sheet.detected_parser === "standard_matrix" ||
    sheet.detected_parser === "vertical";

  const parserLabels: Record<string, string> = {
    standard_matrix: "Price Matrix",
    extras: "Extras",
    mechanisms: "Mechanisms",
    motorisation: "Motorisation",
    vertical: "Vertical",
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex items-center gap-2 sm:w-48">
        <Switch
          checked={!override?.skip}
          onCheckedChange={(checked) => onUpdate({ skip: !checked })}
        />
        <span className="text-sm font-medium truncate" title={sheet.sheet_name}>
          {sheet.sheet_name}
        </span>
      </div>

      <Badge variant="outline" className="w-fit text-xs">
        {parserLabels[sheet.detected_parser] ?? sheet.detected_parser}
      </Badge>

      <span className="text-xs text-muted-foreground">
        {sheet.stats.prices.toLocaleString()} prices &middot; {sheet.stats.rows}×{sheet.stats.cols}
      </span>

      {needsRange && !override?.skip && (
        <RangeSelector
          rangeIds={override?.maps_to_range_ids ?? []}
          groupEntries={groupEntries}
          onChange={(ids) => onUpdate({ maps_to_range_ids: ids })}
        />
      )}

      {override?.skip && (
        <span className="text-xs text-muted-foreground italic">Skipped</span>
      )}
    </div>
  );
}

// ─── Range Selector ─────────────────────────────────────────

function RangeSelector({
  rangeIds,
  groupEntries,
  onChange,
}: {
  rangeIds: string[];
  groupEntries: GroupEntry[];
  onChange: (ids: string[]) => void;
}) {
  function renderSelect(value: string, onSelect: (val: string) => void) {
    return (
      <Select value={value} onValueChange={onSelect}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Assign to range..." />
        </SelectTrigger>
        <SelectContent>
          {groupEntries.map(([typeName, items]) => (
            <SelectGroup key={typeName}>
              <SelectLabel>{typeName}</SelectLabel>
              {items.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-1.5">
      {rangeIds.map((rangeId, idx) => (
        <div key={`${rangeId}-${idx}`} className="flex items-center gap-1.5 sm:max-w-xs">
          {renderSelect(rangeId, (val) => {
            const next = [...rangeIds];
            next[idx] = val;
            onChange(next);
          })}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 shrink-0 p-0"
            onClick={() => onChange(rangeIds.filter((_, i) => i !== idx))}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      ))}
      {rangeIds.length === 0 ? (
        <div className="sm:max-w-xs">
          {renderSelect("", (val) => onChange([val]))}
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-fit gap-1 text-xs text-muted-foreground"
          onClick={() => onChange([...rangeIds, ""])}
        >
          <Plus className="size-3" /> Add range
        </Button>
      )}
    </div>
  );
}

// ─── Import Result Card ──────────────────────────────────────

function ImportResultCard({ result, onReset }: { result: ImportSummary; onReset: () => void }) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <h3 className="font-semibold">3. Import Results</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="size-3" /> {result.prices_created} Prices
          </Badge>
          <Badge variant="secondary" className="gap-1">{result.extras_synced} Extras</Badge>
          <Badge variant="secondary" className="gap-1">{result.mechanisms_synced} Mechanisms</Badge>
          <Badge variant="secondary" className="gap-1">{result.motors_synced} Motors</Badge>
          <Badge variant="secondary" className="gap-1">{result.products_synced} Products Synced</Badge>
        </div>
        {result.errors.length > 0 && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
            <p className="mb-2 font-medium text-destructive">
              <AlertCircle className="mr-1 inline size-3" />
              {result.errors.length} errors
            </p>
            <ul className="space-y-1 text-xs">
              {result.errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        )}
        <Button onClick={onReset} variant="outline">
          <Upload className="mr-2 size-4" />
          Import Another File
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Price Checker Tab ───────────────────────────────────────

interface PriceCell {
  width_cm: number;
  drop_cm: number;
  supplier_price_cents: number;
}

export function PriceCheckerTab() {
  const [ranges, setRanges] = useState<RangeOption[]>([]);
  const [selectedRange, setSelectedRange] = useState("");
  const [prices, setPrices] = useState<PriceCell[]>([]);
  const [loading, setLoading] = useState(false);
  const [rangesLoading, setRangesLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("blind_ranges")
        .select("id, name, slug, blind_type_id, blind_types(name)")
        .eq("is_active", true)
        .order("name");
      setRanges((data as unknown as RangeOption[]) ?? []);
      setRangesLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedRange) { setPrices([]); return; }
    let cancelled = false;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("price_matrices")
      .select("width_cm, drop_cm, supplier_price_cents")
      .eq("blind_range_id", selectedRange)
      .order("drop_cm")
      .order("width_cm")
      .then(({ data }) => {
        if (!cancelled) { setPrices((data as PriceCell[]) ?? []); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [selectedRange]);

  const widths = [...new Set(prices.map((p) => p.width_cm))].sort((a, b) => a - b);
  const drops = [...new Set(prices.map((p) => p.drop_cm))].sort((a, b) => a - b);
  const priceMap = new Map(prices.map((p) => [`${p.width_cm}:${p.drop_cm}`, p.supplier_price_cents]));

  const grouped = ranges.reduce<Record<string, RangeOption[]>>((acc, r) => {
    const typeName = r.blind_types?.name ?? "Other";
    if (!acc[typeName]) acc[typeName] = [];
    acc[typeName].push(r);
    return acc;
  }, {});
  const groupEntries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

  if (rangesLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label htmlFor="price-range-select" className="text-sm text-muted-foreground">Range:</label>
        <Select value={selectedRange} onValueChange={setSelectedRange}>
          <SelectTrigger id="price-range-select" className="w-64">
            <SelectValue placeholder="Select a range..." />
          </SelectTrigger>
          <SelectContent>
            {groupEntries.map(([typeName, items]) => (
              <SelectGroup key={typeName}>
                <SelectLabel>{typeName}</SelectLabel>
                {items.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading prices...
        </div>
      )}

      {!loading && selectedRange && prices.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No prices found for this range. Import a price list first.
        </p>
      )}

      {!loading && prices.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">{prices.length} prices</Badge>
            <Badge variant="secondary">{widths.length} widths ({widths[0]}–{widths[widths.length - 1]} cm)</Badge>
            <Badge variant="secondary">{drops.length} drops ({drops[0]}–{drops[drops.length - 1]} cm)</Badge>
          </div>
          <div className="overflow-auto rounded-md border" style={{ maxHeight: "60vh" }}>
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-background z-10">
                <tr>
                  <th className="sticky left-0 z-20 bg-muted px-2 py-1.5 text-left font-semibold">
                    Drop \ Width
                  </th>
                  {widths.map((w) => (
                    <th key={w} className="bg-muted px-2 py-1.5 text-right font-semibold whitespace-nowrap">
                      {w}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drops.map((d) => (
                  <tr key={d} className="border-t hover:bg-muted/50">
                    <td className="sticky left-0 z-10 bg-background px-2 py-1 font-medium border-r">
                      {d}
                    </td>
                    {widths.map((w) => {
                      const cents = priceMap.get(`${w}:${d}`);
                      return (
                        <td key={w} className="px-2 py-1 text-right tabular-nums whitespace-nowrap">
                          {cents != null
                            ? `R${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                            : <span className="text-muted-foreground/40">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Mappings Tab ────────────────────────────────────────────

export function MappingsTab() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [mappings, setMappings] = useState<ImportMapping[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getSuppliers();
      setSuppliers(data);
      if (data.length > 0) setSelectedSupplier(data[0].slug);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedSupplier) return;
    let cancelled = false;
    getMappingsForSupplier(selectedSupplier).then((data) => {
      if (!cancelled) setMappings(data);
    });
    return () => { cancelled = true; };
  }, [selectedSupplier]);

  async function handleDelete(id: string) {
    await deleteMapping(id);
    setMappings((prev) => prev.filter((m) => m.id !== id));
    toast.success("Mapping deleted");
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label htmlFor="mapping-supplier-select" className="text-sm text-muted-foreground">Supplier:</label>
        <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
          <SelectTrigger id="mapping-supplier-select" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={s.slug}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {mappings.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No saved mappings for this supplier. Import a file to create mappings automatically.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4">Sheet Name</th>
                <th className="pb-2 pr-4">Parser</th>
                <th className="pb-2 pr-4">Maps To Range</th>
                <th className="pb-2 pr-4">Active</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {mappings.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{m.sheet_name}</td>
                  <td className="py-2 pr-4">
                    <Badge variant="outline" className="text-xs">{m.parser_type}</Badge>
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">{m.maps_to_range_id ?? "—"}</td>
                  <td className="py-2 pr-4">
                    {m.is_active
                      ? <Badge variant="default" className="text-xs">Active</Badge>
                      : <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                  </td>
                  <td className="py-2">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)}>
                      <Trash2 className="size-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── History Tab ─────────────────────────────────────────────

export function HistoryTab() {
  const [history, setHistory] = useState<ImportHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getImportHistory();
      setHistory(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No imports yet. Use the Import tab to upload your first price list.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((entry) => (
        <Card key={entry.id}>
          <CardContent className="py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{entry.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.supplier} &middot; {new Date(entry.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-xs">{entry.sheets_processed} sheets</Badge>
              <Badge variant="default" className="text-xs">{entry.prices_created} prices</Badge>
              {entry.error_log && entry.error_log.errors.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {entry.error_log.errors.length} errors
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
