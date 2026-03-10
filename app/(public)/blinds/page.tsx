import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getCategories } from "@/lib/blinds/queries";

export const metadata: Metadata = {
  title: "Blinds — Blindly",
  description:
    "Browse our full range of custom window blinds. Roller, venetian, vertical and more — made to your exact size.",
};

export default async function BlindsPage() {
  const categories = await getCategories();

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Our Blinds</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Choose your style, pick a colour, and get an instant price — made to measure.
        </p>
      </div>

      {categories.length === 0 ? (
        <p className="text-center text-muted-foreground">No blind ranges available yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/blinds/${cat.slug}`}
              className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              {/* Image */}
              <div className="relative h-56 w-full overflow-hidden bg-muted">
                {cat.image_url ? (
                  <Image
                    src={cat.image_url}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BlindPlaceholder />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="p-5">
                <h2 className="text-xl font-semibold">{cat.name}</h2>
                {cat.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {cat.description}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                  Browse styles
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-16 rounded-2xl border bg-muted/40 px-8 py-10 text-center">
        <h2 className="text-2xl font-semibold">Not sure where to start?</h2>
        <p className="mt-2 text-muted-foreground">
          Use our step-by-step blind configurator to explore all options at your own pace.
        </p>
        <Link
          href="/configure"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Open Configurator
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function BlindPlaceholder() {
  return (
    <svg
      viewBox="0 0 80 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-20 w-16 text-muted-foreground/30"
      aria-hidden="true"
    >
      <rect x="8" y="4" width="64" height="8" rx="4" fill="currentColor" />
      {[20, 32, 44, 56, 68, 80, 92].map((y, i) => (
        <rect key={i} x="8" y={y} width="64" height="6" rx="2" fill="currentColor" opacity={0.6 - i * 0.06} />
      ))}
    </svg>
  );
}
