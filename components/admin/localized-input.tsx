"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { LocalizedString } from "@/types/cms";

interface LocalizedInputProps {
  label: string;
  value: LocalizedString;
  onChange: (value: LocalizedString) => void;
  multiline?: boolean;
  placeholder?: string;
  rows?: number;
}

export function LocalizedInput({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
  rows,
}: LocalizedInputProps) {
  const Component = multiline ? Textarea : Input;
  const extraProps = multiline && rows ? { rows } : {};

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <span className="mb-1 block text-xs font-medium text-muted-foreground">English</span>
          <Component
            value={value.en}
            onChange={(e) => onChange({ ...value, en: e.target.value })}
            placeholder={placeholder ? `${placeholder} (EN)` : undefined}
            {...extraProps}
          />
        </div>
        <div>
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Afrikaans</span>
          <Component
            value={value.af}
            onChange={(e) => onChange({ ...value, af: e.target.value })}
            placeholder={placeholder ? `${placeholder} (AF)` : undefined}
            {...extraProps}
          />
        </div>
      </div>
    </div>
  );
}
