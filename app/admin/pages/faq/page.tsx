"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { upsertFaq, deleteFaq } from "@/lib/cms/actions";
import { LocalizedInput } from "@/components/admin/localized-input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { Save, Plus, Trash2, GripVertical, ArrowLeft } from "lucide-react";
import type { LocalizedString, Faq } from "@/types/cms";
import Link from "next/link";

const L = (en = "", af = ""): LocalizedString => ({ en, af });

export default function FaqPageEditor() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("display_order");

      if (error) toast.error(error.message);
      else setFaqs((data as Faq[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function addFaq() {
    setFaqs((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        question: L(),
        answer: L(),
        display_order: prev.length,
        is_active: true,
      },
    ]);
  }

  function updateFaq(index: number, field: "question" | "answer", value: LocalizedString) {
    setFaqs((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
  }

  function removeFaq(index: number) {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const supabase = createClient();

      // Fetch current FAQs from DB to determine deletions
      const { data: existing } = await supabase.from("faqs").select("id");
      const currentIds = new Set(faqs.filter((f) => !f.id.startsWith("new-")).map((f) => f.id));

      // Delete removed FAQs
      for (const row of existing ?? []) {
        if (!currentIds.has(row.id)) {
          await deleteFaq(row.id);
        }
      }

      // Upsert all current FAQs
      for (let i = 0; i < faqs.length; i++) {
        const faq = faqs[i];
        await upsertFaq({
          ...(faq.id.startsWith("new-") ? {} : { id: faq.id }),
          question: faq.question,
          answer: faq.answer,
          display_order: i,
          is_active: true,
        });
      }

      // Reload to get proper IDs
      const { data: refreshed } = await supabase
        .from("faqs")
        .select("*")
        .order("display_order");
      setFaqs((refreshed as Faq[]) ?? []);
      toast.success("FAQs saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-foreground">FAQ Page</h1>
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
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">FAQ Page</h1>
          <p className="mt-1 text-muted-foreground">
            Manage frequently asked questions displayed on the /faq page.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save FAQs"}
        </Button>
      </div>

      <div className="space-y-3">
        {faqs.length === 0 && (
          <p className="text-sm text-muted-foreground">No FAQs yet. Add one below.</p>
        )}
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem key={faq.id} value={faq.id} className="rounded-lg border px-4">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                <AccordionTrigger className="flex-1 text-left text-sm">
                  {faq.question.en || `FAQ #${i + 1}`}
                </AccordionTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFaq(i);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <AccordionContent className="space-y-3 pb-4">
                <LocalizedInput
                  label="Question"
                  value={faq.question}
                  onChange={(v) => updateFaq(i, "question", v)}
                  placeholder="How long does installation take?"
                />
                <LocalizedInput
                  label="Answer"
                  value={faq.answer}
                  onChange={(v) => updateFaq(i, "answer", v)}
                  placeholder="Installation typically takes..."
                  multiline
                  rows={3}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <Button variant="outline" size="sm" onClick={addFaq}>
          <Plus className="mr-2 h-4 w-4" /> Add FAQ
        </Button>
      </div>
    </div>
  );
}
