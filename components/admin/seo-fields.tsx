"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SeoFieldsProps {
  metaTitle?: string;
  metaDescription?: string;
  onMetaTitleChange?: (value: string) => void;
  onMetaDescriptionChange?: (value: string) => void;
}

function charClass(len: number, warn: number, max: number): string {
  if (len > max) return "text-destructive";
  if (len > warn) return "text-amber-600";
  return "text-muted-foreground";
}

/**
 * Collapsible SEO fields section for content editors.
 * Renders meta title + description inputs with character counters.
 * Only render when isEnabled("seoAdvanced").
 */
export function SeoFields({
  metaTitle = "",
  metaDescription = "",
  onMetaTitleChange,
  onMetaDescriptionChange,
}: SeoFieldsProps) {
  const [open, setOpen] = useState(!!(metaTitle || metaDescription));
  const [titleLen, setTitleLen] = useState(metaTitle.length);
  const [descLen, setDescLen] = useState(metaDescription.length);

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 text-left font-medium"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        SEO Settings
      </button>

      {open && (
        <div className="space-y-4 pt-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="seo-metaTitle">Meta Title</Label>
              <span className={`text-xs ${charClass(titleLen, 55, 60)}`}>
                {titleLen}/60
              </span>
            </div>
            <Input
              id="seo-metaTitle"
              name="meta_title"
              defaultValue={metaTitle}
              onChange={(e) => {
                setTitleLen(e.target.value.length);
                onMetaTitleChange?.(e.target.value);
              }}
              placeholder="Page title for search engines"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="seo-metaDescription">Meta Description</Label>
              <span className={`text-xs ${charClass(descLen, 150, 160)}`}>
                {descLen}/160
              </span>
            </div>
            <Textarea
              id="seo-metaDescription"
              name="meta_description"
              defaultValue={metaDescription}
              onChange={(e) => {
                setDescLen(e.target.value.length);
                onMetaDescriptionChange?.(e.target.value);
              }}
              placeholder="Brief description shown in search results"
              rows={3}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Leave blank to use the page&apos;s title and description as defaults.
          </p>
        </div>
      )}
    </div>
  );
}
