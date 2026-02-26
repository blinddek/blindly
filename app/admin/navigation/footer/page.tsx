"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  upsertFooterSection,
  deleteFooterSection,
} from "@/lib/cms/actions";
import type { FooterSection, LocalizedString } from "@/types/cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { LocalizedInput } from "@/components/admin/localized-input";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";

const L = (en = "", af = ""): LocalizedString => ({ en, af });

export default function FooterPage() {
  const [sections, setSections] = useState<FooterSection[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchSections() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("footer_sections")
      .select("*")
      .order("display_order");

    if (error) {
      toast.error(error.message);
    } else {
      setSections(data as FooterSection[]);
    }
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate data-fetch-on-mount
  useEffect(() => { fetchSections(); }, []);

  /* ---- Section-level mutations ---- */

  function handleSectionTitleChange(sectionId: string, title: LocalizedString) {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, title } : s))
    );
  }

  async function handleSaveSection(section: FooterSection) {
    try {
      await upsertFooterSection({
        id: section.id,
        title: section.title,
        links: section.links,
        display_order: section.display_order,
        is_active: section.is_active,
      });
      toast.success("Saved!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save";
      toast.error(message);
    }
  }

  async function handleDeleteSection(id: string) {
    try {
      await deleteFooterSection(id);
      setSections((prev) => prev.filter((s) => s.id !== id));
      toast.success("Section deleted!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete";
      toast.error(message);
    }
  }

  async function handleAddSection() {
    const nextOrder =
      sections.length > 0
        ? Math.max(...sections.map((s) => s.display_order)) + 1
        : 0;

    try {
      await upsertFooterSection({
        title: L("New Section", "Nuwe Afdeling"),
        links: [],
        display_order: nextOrder,
        is_active: true,
      });
      toast.success("Section added!");
      await fetchSections();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add";
      toast.error(message);
    }
  }

  /* ---- Link-level mutations (local state only, saved with section) ---- */

  function handleLinkChange(
    sectionId: string,
    linkIndex: number,
    field: string,
    value: string | LocalizedString
  ) {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const updatedLinks = [...s.links];
        updatedLinks[linkIndex] = {
          ...updatedLinks[linkIndex],
          [field]: value,
        };
        return { ...s, links: updatedLinks };
      })
    );
  }

  function handleAddLink(sectionId: string) {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          links: [...s.links, { label: L(), href: "" }],
        };
      })
    );
  }

  function handleRemoveLink(sectionId: string, linkIndex: number) {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const updatedLinks = s.links.filter((_, i) => i !== linkIndex);
        return { ...s, links: updatedLinks };
      })
    );
  }

  /* ---- Render ---- */

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-foreground">Footer Sections</h1>
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Footer Sections</h1>
        <Button onClick={handleAddSection} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Add Section
        </Button>
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        Manage footer column sections and their links. Remember to save after
        making changes.
      </p>

      <div className="mt-6 space-y-6">
        {sections.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No footer sections yet. Add one to get started.
          </p>
        )}

        {sections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <LocalizedInput
                    label="Section Title"
                    value={section.title}
                    onChange={(v) => handleSectionTitleChange(section.id, v)}
                  />
                </div>
                <div className="flex items-center gap-1 pt-5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSaveSection(section)}
                  >
                    <Save className="mr-1 h-3.5 w-3.5" />
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDeleteSection(section.id)}
                    aria-label="Delete section"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {section.links.map((link, linkIndex) => (
                  <div
                    key={linkIndex}
                    className="rounded-md border border-border p-3 space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <LocalizedInput
                          label="Link Label"
                          value={link.label}
                          onChange={(v) =>
                            handleLinkChange(
                              section.id,
                              linkIndex,
                              "label",
                              v
                            )
                          }
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="mt-6"
                        onClick={() => handleRemoveLink(section.id, linkIndex)}
                        aria-label="Remove link"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex min-w-[180px] flex-col gap-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        URL
                      </label>
                      <Input
                        value={link.href}
                        onChange={(e) =>
                          handleLinkChange(
                            section.id,
                            linkIndex,
                            "href",
                            e.target.value
                          )
                        }
                        placeholder="/page"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => handleAddLink(section.id)}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Link
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
