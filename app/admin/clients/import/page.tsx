"use client";

import { useState } from "react";
import { importClients, parseCSV } from "@/lib/admin/client-import-actions";
import type { ImportRow, ImportResult } from "@/lib/admin/client-import-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ClientImportPage() {
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handlePreview() {
    const rows = await parseCSV(csvText);
    if (rows.length === 0) {
      toast.error("No valid rows found. CSV must have 'email' and 'name' columns.");
      return;
    }
    setPreview(rows);
    setResult(null);
  }

  async function handleImport() {
    if (preview.length === 0) return;
    setImporting(true);
    try {
      const res = await importClients(preview);
      setResult(res);
      toast.success(`Import complete: ${res.created} created, ${res.skipped} skipped`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
    setPreview([]);
    setResult(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Import Clients</h1>
        <p className="text-sm text-muted-foreground">
          Upload a CSV file with client data. Required columns: <strong>name</strong>, <strong>email</strong>. Optional: <strong>phone</strong>, <strong>company</strong>.
        </p>
      </div>

      {/* Upload / Paste */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors">
              <Upload className="h-4 w-4" />
              <span>Choose CSV file or drag & drop</span>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
          <div className="text-center text-xs text-muted-foreground">or paste CSV below</div>
          <Textarea
            value={csvText}
            onChange={(e) => { setCsvText(e.target.value); setPreview([]); setResult(null); }}
            rows={6}
            placeholder={`name,email,phone,company\nJohn Doe,john@example.com,+27821234567,Acme Inc`}
            className="font-mono text-xs"
          />
          <Button onClick={handlePreview} disabled={!csvText.trim()}>
            <FileText className="mr-2 h-4 w-4" /> Preview
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      {preview.length > 0 && !result && (
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Preview ({preview.length} rows)
              </h2>
              <Button onClick={handleImport} disabled={importing}>
                {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import {preview.length} Clients
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Email</th>
                    <th className="pb-2 pr-4">Phone</th>
                    <th className="pb-2">Company</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 20).map((row) => (
                    <tr key={row.email} className="border-b last:border-0">
                      <td className="py-2 pr-4">{row.full_name}</td>
                      <td className="py-2 pr-4">{row.email}</td>
                      <td className="py-2 pr-4">{row.phone || "\u2014"}</td>
                      <td className="py-2">{row.company_name || "\u2014"}</td>
                    </tr>
                  ))}
                  {preview.length > 20 && (
                    <tr>
                      <td colSpan={4} className="py-2 text-center text-xs text-muted-foreground">
                        ...and {preview.length - 20} more rows
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-lg font-semibold">Import Results</h2>
            <div className="flex flex-wrap gap-3">
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> {result.created} Created
              </Badge>
              {result.skipped > 0 && (
                <Badge variant="secondary" className="gap-1">
                  {result.skipped} Skipped (already exist)
                </Badge>
              )}
              {result.errors.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" /> {result.errors.length} Errors
                </Badge>
              )}
            </div>
            {result.errors.length > 0 && (
              <div className="rounded-md border bg-destructive/10 p-3 text-sm">
                <p className="mb-2 font-medium text-destructive">Errors:</p>
                <ul className="space-y-1 text-xs">
                  {result.errors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
