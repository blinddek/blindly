"use client";

import { useLocale } from "@/lib/locale";
import type { LocalizedString } from "@/types/cms";

interface LegalContentProps {
  readonly title: string | null;
  readonly content: string | null;
  readonly updatedAt: string | null;
  readonly fallbackHeading: LocalizedString;
  readonly fallbackText: LocalizedString;
}

export function LegalContent({ title, content, updatedAt, fallbackHeading, fallbackText }: LegalContentProps) {
  const { t } = useLocale();

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 md:px-8">
      <h1 className="text-3xl font-bold">
        {title || t(fallbackHeading)}
      </h1>

      {updatedAt && (
        <p className="mt-1 text-sm text-muted-foreground">
          {t({ en: "Last updated:", af: "Laas opgedateer:" })}{" "}
          {new Date(updatedAt).toLocaleDateString("en-ZA", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      )}

      {content ? (
        <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-foreground/80">
          {content.split("\n\n").map((block, i) => {
            const lines = block.split("\n");
            const isList = lines.every((l) => l.startsWith("- ") || l.trim() === "");

            if (isList) {
              return (
                <ul key={i} className="list-disc space-y-1.5 pl-6">
                  {lines
                    .filter((l) => l.startsWith("- "))
                    .map((l, j) => (
                      <li key={j}>{l.slice(2)}</li>
                    ))}
                </ul>
              );
            }

            // Single-line block that looks like a heading (no punctuation at end, short)
            if (lines.length === 1 && block.length < 80 && !block.endsWith(".") && !block.startsWith("-")) {
              return (
                <h2 key={i} className="mt-8 text-xl font-semibold text-foreground">
                  {block}
                </h2>
              );
            }

            // Mixed content — paragraph with inline list items
            const hasListItems = lines.some((l) => l.startsWith("- "));
            if (hasListItems) {
              const paraParts = lines.filter((l) => !l.startsWith("- ")).join(" ");
              const listItems = lines.filter((l) => l.startsWith("- "));
              return (
                <div key={i} className="space-y-3">
                  {paraParts && <p>{paraParts}</p>}
                  <ul className="list-disc space-y-1.5 pl-6">
                    {listItems.map((l, j) => (
                      <li key={j}>{l.slice(2)}</li>
                    ))}
                  </ul>
                </div>
              );
            }

            return <p key={i}>{lines.join(" ")}</p>;
          })}
        </div>
      ) : (
        <p className="mt-4 text-muted-foreground">
          {t(fallbackText)}
        </p>
      )}
    </section>
  );
}
