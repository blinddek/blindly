"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { CategoryOption } from "./blind-configurator";
import { BlindIllustration } from "./blind-illustrations";

interface Props {
  readonly categories: CategoryOption[];
  readonly value: string;
  readonly onChange: (id: string, slug: string) => void;
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
              "overflow-hidden rounded-lg border text-left transition-all hover:border-primary/50 hover:shadow-sm",
              value === cat.id
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border"
            )}
          >
            {cat.image_url ? (
              <div className="relative h-36 w-full overflow-hidden bg-muted">
                <Image
                  src={cat.image_url}
                  alt={cat.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="flex justify-center p-4">
                <BlindIllustration
                  categorySlug={cat.slug}
                  size="md"
                  colour={value === cat.id ? "#C4663A" : "#8B8178"}
                />
              </div>
            )}
            <div className="p-4">
              <div className="font-medium">{cat.name}</div>
              {cat.description && (
                <div className="mt-1 text-sm text-muted-foreground">
                  {cat.description}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
