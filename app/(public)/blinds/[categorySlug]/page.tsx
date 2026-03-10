import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Palette } from "lucide-react";
import { getCategoryBySlug, getTypesByCategory, getRangesByType } from "@/lib/blinds/queries";
import type { BlindType, BlindRange } from "@/types/blinds";

interface Props {
  params: Promise<{ categorySlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return { title: "Not Found" };
  return {
    title: `${category.name} — Blindly`,
    description:
      category.description ??
      `Browse our ${category.name.toLowerCase()} range. Choose your colour and get an instant made-to-measure price.`,
  };
}

interface TypeWithRanges extends BlindType {
  ranges: BlindRange[];
}

export default async function CategoryPage({ params }: Readonly<Props>) {
  const { categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  if (!category) notFound();

  const types = await getTypesByCategory(category.id);
  const typesWithRanges: TypeWithRanges[] = await Promise.all(
    types.map(async (type) => ({
      ...type,
      ranges: await getRangesByType(type.id),
    }))
  );

  const allRanges = typesWithRanges.flatMap((t) => t.ranges);
  const showTypeHeaders = typesWithRanges.length > 1;

  // Build the configure URL for a given range + optional colour
  function configureUrl(type: BlindType, range: BlindRange, colour?: string) {
    const params = new URLSearchParams({
      category_id: category.id,
      category_slug: category.slug,
      type_id: type.id,
      range_id: range.id,
    });
    if (colour) params.set("colour", colour);
    return `/configure?${params.toString()}`;
  }

  return (
    <>
      {/* Header photo */}
      {category.image_url && (
        <div className="relative h-56 w-full overflow-hidden sm:h-72 lg:h-80">
          <Image
            src={category.image_url}
            alt={category.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-end">
            <div className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
              <h1 className="text-4xl font-bold tracking-tight text-white">{category.name}</h1>
              {category.description && (
                <p className="mt-1 text-lg text-white/80">{category.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back nav */}
      <Link
        href="/blinds"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All blinds
      </Link>

      {/* Category header (no image fallback) */}
      {!category.image_url && (
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight">{category.name}</h1>
          {category.description && (
            <p className="mt-2 text-lg text-muted-foreground">{category.description}</p>
          )}
        </div>
      )}
      {category.image_url && (
        <p className="mb-8 text-sm text-muted-foreground">
          Click a colour below to jump straight to measurements — or browse all ranges first.
        </p>
      )}
      {!category.image_url && (
        <p className="-mt-6 mb-10 text-sm text-muted-foreground">
          Click a colour below to jump straight to measurements — or browse all ranges first.
        </p>
      )}

      {allRanges.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Palette className="mx-auto mb-3 h-10 w-10 opacity-30" />
          <p>No ranges available yet for {category.name}.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {typesWithRanges.map((type) => {
            if (type.ranges.length === 0) return null;
            return (
              <div key={type.id}>
                {showTypeHeaders && (
                  <div className="mb-5 border-b pb-2">
                    <h2 className="text-xl font-semibold">{type.name}</h2>
                    {type.material && (
                      <p className="text-sm text-muted-foreground">{type.material}</p>
                    )}
                  </div>
                )}
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {type.ranges.map((range) => (
                    <RangeCard
                      key={range.id}
                      range={range}
                      configureUrl={(colour) => configureUrl(type, range, colour)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
    </>
  );
}

// ─── Range Card ───────────────────────────────────────────────

const MAX_SWATCHES = 10;

function RangeCard({
  range,
  configureUrl,
}: {
  readonly range: BlindRange;
  readonly configureUrl: (colour?: string) => string;
}) {
  const colours = range.colour_options ?? [];
  const visible = colours.slice(0, MAX_SWATCHES);
  const overflow = colours.length - MAX_SWATCHES;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md">
      {/* Lifestyle image */}
      <div className="relative h-48 w-full overflow-hidden bg-muted">
        {range.lifestyle_image_url ? (
          <Image
            src={range.lifestyle_image_url}
            alt={range.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs text-muted-foreground/40">{range.name}</span>
          </div>
        )}

        {/* Starting price badge */}
        {range.starting_price_cents != null && range.starting_price_cents > 0 && (
          <div className="absolute bottom-3 left-3 rounded-full bg-background/90 px-3 py-1 text-xs font-medium shadow-sm backdrop-blur-sm">
            From R{(range.starting_price_cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-semibold">{range.name}</h3>
        {range.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{range.description}</p>
        )}

        {/* Colour swatches */}
        {colours.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {colours.length} colour{colours.length !== 1 && "s"} — click to configure
            </p>
            <div className="flex flex-wrap gap-2">
              {visible.map((colour) => (
                <Link
                  key={colour.name}
                  href={configureUrl(colour.name)}
                  title={colour.name}
                  className="group/swatch relative h-8 w-8 rounded-full border-2 border-transparent ring-1 ring-border transition-all hover:scale-110 hover:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ backgroundColor: colour.hex }}
                  aria-label={`Configure in ${colour.name}`}
                />
              ))}
              {overflow > 0 && (
                <Link
                  href={configureUrl()}
                  className="flex h-8 items-center rounded-full border bg-muted px-2.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  title={`${overflow} more colours`}
                >
                  +{overflow}
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Configure CTA */}
        <div className="mt-5 pt-4 border-t">
          <Link
            href={configureUrl()}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Configure this blind
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
