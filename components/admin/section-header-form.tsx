"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateSiteContent } from "@/lib/cms/actions";
import { LocalizedInput } from "@/components/admin/localized-input";
import type { SectionMeta, LocalizedString } from "@/types/cms";
import { Loader2Icon } from "lucide-react";

interface SectionHeaderFormProps {
  sectionKey: string;
  initialData: SectionMeta;
}

export function SectionHeaderForm({
  sectionKey,
  initialData,
}: SectionHeaderFormProps) {
  const [heading, setHeading] = useState<LocalizedString>(initialData.heading);
  const [subheading, setSubheading] = useState<LocalizedString>(initialData.subheading);
  const [ctaLabel, setCtaLabel] = useState<LocalizedString>(initialData.cta_label ?? { en: "", af: "" });
  const [ctaUrl, setCtaUrl] = useState(initialData.cta_url ?? "");
  const [ctaIcon, setCtaIcon] = useState(initialData.cta_icon ?? "");
  const [footerNote, setFooterNote] = useState<LocalizedString>(initialData.footer_note ?? { en: "", af: "" });
  const [isPending, startTransition] = useTransition();

  const hasCtaFields =
    initialData.cta_label !== undefined ||
    initialData.cta_url !== undefined ||
    initialData.cta_icon !== undefined;
  const hasFooterNote = initialData.footer_note !== undefined;

  function handleSave() {
    startTransition(async () => {
      try {
        const payload: Record<string, unknown> = { heading, subheading };

        if (hasCtaFields) {
          payload.cta_label = ctaLabel;
          payload.cta_url = ctaUrl;
          payload.cta_icon = ctaIcon;
        }

        if (hasFooterNote) {
          payload.footer_note = footerNote;
        }

        await updateSiteContent(sectionKey, payload);
        toast.success("Section header saved successfully.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save changes."
        );
      }
    });
  }

  return (
    <div className="space-y-4">
      <LocalizedInput
        label="Heading"
        value={heading}
        onChange={setHeading}
        placeholder="Section heading"
      />

      <LocalizedInput
        label="Subheading"
        value={subheading}
        onChange={setSubheading}
        placeholder="Section subheading"
      />

      {hasCtaFields && (
        <>
          <LocalizedInput
            label="CTA Label"
            value={ctaLabel}
            onChange={setCtaLabel}
            placeholder="e.g. View All"
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              CTA URL
            </label>
            <Input
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="e.g. /services"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              CTA Icon
            </label>
            <Input
              value={ctaIcon}
              onChange={(e) => setCtaIcon(e.target.value)}
              placeholder="e.g. ArrowRight"
            />
          </div>
        </>
      )}

      {hasFooterNote && (
        <LocalizedInput
          label="Footer Note"
          value={footerNote}
          onChange={setFooterNote}
          placeholder="Optional note below the section"
        />
      )}

      <Button onClick={handleSave} disabled={isPending}>
        {isPending && <Loader2Icon className="animate-spin" />}
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
