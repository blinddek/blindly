"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { upsertSiteContent } from "@/lib/cms/actions";
import { LocalizedInput } from "@/components/admin/localized-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Plus, Trash2, ArrowLeft } from "lucide-react";
import type { LocalizedString } from "@/types/cms";
import Link from "next/link";

const L = (en = "", af = ""): LocalizedString => ({ en, af });

interface ProcessStep {
  step: string;
  title: LocalizedString;
  description: LocalizedString;
}

interface ValueItem {
  title: LocalizedString;
  description: LocalizedString;
}

interface AboutForm {
  heading: LocalizedString;
  body: LocalizedString;
  mission: LocalizedString;
  process: ProcessStep[];
  values: ValueItem[];
  service_area: LocalizedString;
}

const defaultForm: AboutForm = {
  heading: L(),
  body: L(),
  mission: L(),
  process: [],
  values: [],
  service_area: L(),
};

export default function AboutPageEditor() {
  const [form, setForm] = useState<AboutForm>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("section_key", "about")
        .single();

      if (data?.content) {
        const c = data.content as Record<string, unknown>;
        setForm({
          heading: (c.heading as LocalizedString) || L(),
          body: (c.body as LocalizedString) || L(),
          mission: (c.mission as LocalizedString) || L(),
          process: (c.process as ProcessStep[]) || [],
          values: (c.values as ValueItem[]) || [],
          service_area: (c.service_area as LocalizedString) || L(),
        });
      }
      setLoading(false);
    }
    fetch();
  }, []);

  function setLocalized(key: keyof AboutForm, value: LocalizedString) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Process steps
  function addProcessStep() {
    setForm((prev) => ({
      ...prev,
      process: [
        ...prev.process,
        { step: String(prev.process.length + 1), title: L(), description: L() },
      ],
    }));
  }

  function removeProcessStep(index: number) {
    setForm((prev) => ({
      ...prev,
      process: prev.process.filter((_, i) => i !== index),
    }));
  }

  function updateProcessStep(index: number, field: string, value: unknown) {
    setForm((prev) => ({
      ...prev,
      process: prev.process.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      ),
    }));
  }

  // Values
  function addValue() {
    setForm((prev) => ({
      ...prev,
      values: [...prev.values, { title: L(), description: L() }],
    }));
  }

  function removeValue(index: number) {
    setForm((prev) => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index),
    }));
  }

  function updateValue(index: number, field: string, value: LocalizedString) {
    setForm((prev) => ({
      ...prev,
      values: prev.values.map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      ),
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await upsertSiteContent("about", form as unknown as Record<string, unknown>);
      toast.success("About page saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-foreground">About Page</h1>
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/pages" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">About Page</h1>
          <p className="mt-1 text-muted-foreground">
            Company story, mission, process, and values.
          </p>
        </div>
      </div>

      {/* Heading & Mission */}
      <Card>
        <CardHeader>
          <CardTitle>Heading & Mission</CardTitle>
          <CardDescription>Page title and mission statement shown at the top.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LocalizedInput label="Heading" value={form.heading} onChange={(v) => setLocalized("heading", v)} placeholder="About Nortier Cupboards" />
          <LocalizedInput label="Mission Statement" value={form.mission} onChange={(v) => setLocalized("mission", v)} placeholder="Crafting quality cupboards since..." multiline />
        </CardContent>
      </Card>

      {/* Our Story */}
      <Card>
        <CardHeader>
          <CardTitle>Our Story</CardTitle>
          <CardDescription>Main body text. Use blank lines for paragraphs.</CardDescription>
        </CardHeader>
        <CardContent>
          <LocalizedInput label="Body" value={form.body} onChange={(v) => setLocalized("body", v)} placeholder="Our story begins..." multiline rows={8} />
        </CardContent>
      </Card>

      {/* Process Steps */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>How We Work</CardTitle>
              <CardDescription>Step-by-step process shown to customers.</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={addProcessStep}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Step
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.process.length === 0 && (
            <p className="text-sm text-muted-foreground">No process steps yet.</p>
          )}
          {form.process.map((step, i) => (
            <div key={i} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Step {i + 1}</span>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeProcessStep(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={step.step}
                onChange={(e) => updateProcessStep(i, "step", e.target.value)}
                placeholder="Step number (e.g. 1)"
                className="w-20"
              />
              <LocalizedInput label="Title" value={step.title} onChange={(v) => updateProcessStep(i, "title", v)} placeholder="Consultation" />
              <LocalizedInput label="Description" value={step.description} onChange={(v) => updateProcessStep(i, "description", v)} placeholder="We visit your home..." multiline />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Values */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Why Choose Us</CardTitle>
              <CardDescription>Key differentiators and value propositions.</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={addValue}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Value
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.values.length === 0 && (
            <p className="text-sm text-muted-foreground">No values yet.</p>
          )}
          {form.values.map((val, i) => (
            <div key={i} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Value {i + 1}</span>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeValue(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <LocalizedInput label="Title" value={val.title} onChange={(v) => updateValue(i, "title", v)} placeholder="20+ Years Experience" />
              <LocalizedInput label="Description" value={val.description} onChange={(v) => updateValue(i, "description", v)} placeholder="Two decades of craftsmanship..." multiline />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Service Area */}
      <Card>
        <CardHeader>
          <CardTitle>Service Area</CardTitle>
          <CardDescription>Geographic area you serve.</CardDescription>
        </CardHeader>
        <CardContent>
          <LocalizedInput label="Service Area" value={form.service_area} onChange={(v) => setLocalized("service_area", v)} placeholder="We serve the greater Paarl and surrounding areas..." multiline />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save About Page"}
        </Button>
      </div>
    </div>
  );
}
