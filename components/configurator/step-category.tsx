"use client";

import { cn } from "@/lib/utils";
import type { CategoryOption } from "./blind-configurator";

const ICONS: Record<string, string> = {
  roller: "↕",
  "aluminium-venetian": "≡",
  "wood-venetian": "☰",
  vertical: "║",
};

interface Props {
  categories: CategoryOption[];
  value: string;
  onChange: (id: string, slug: string) => void;
}

export function StepCategory({ categories, value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">What type of blind?</h2>
        <p className="text-sm text-muted-foreground">
          Choose a category to get started.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id, cat.slug)}
            className={cn(
              "rounded-lg border p-5 text-left transition-all hover:border-primary/50 hover:shadow-sm",
              value === cat.id
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border"
            )}
          >
            <div className="mb-1 text-2xl">{ICONS[cat.slug] ?? "▪"}</div>
            <div className="font-medium">{cat.name}</div>
            {cat.description && (
              <div className="mt-1 text-sm text-muted-foreground">
                {cat.description}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
