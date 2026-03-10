import { generatePageMetadata } from "@/lib/seo/metadata";
import { getSiteContent } from "@/lib/cms/queries";
import type { LocalizedString } from "@/types/cms";
import Link from "next/link";

export async function generateMetadata() {
  return generatePageMetadata("about");
}

interface ProcessStep {
  step: string;
  title: LocalizedString;
  description: LocalizedString;
}

interface ValueItem {
  title: LocalizedString;
  description: LocalizedString;
}

interface AboutContent {
  heading?: LocalizedString;
  body?: LocalizedString;
  mission?: LocalizedString;
  process?: ProcessStep[];
  values?: ValueItem[];
}

export default async function AboutPage() {
  const content = (await getSiteContent("about")) as AboutContent | null;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-16 md:px-8">
      {/* Hero Heading */}
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          {content?.heading?.en ?? "About Blindly"}
        </h1>
        {content?.mission?.en && (
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {content.mission.en}
          </p>
        )}
      </section>

      {/* Story Section */}
      {content?.body?.en ? (
        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold">Our Story</h2>
          <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
            {content.body.en.split("\n\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </section>
      ) : null}

      {/* How It Works */}
      {content?.process && content.process.length > 0 && (
        <section className="mt-20">
          <h2 className="text-center text-2xl font-bold">How It Works</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">
            From your first click to enjoying your new blinds.
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {content.process.map((item, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  {item.title.en}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.description.en}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Why Blindly */}
      {content?.values && content.values.length > 0 && (
        <section className="mt-20">
          <h2 className="text-center text-2xl font-bold">Why Choose Blindly</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {content.values.map((value, i) => (
              <div key={i} className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold">{value.title.en}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {value.description.en}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mt-20 rounded-xl bg-primary px-6 py-12 text-center text-primary-foreground">
        <h2 className="text-2xl font-bold">Ready to configure your blinds?</h2>
        <p className="mx-auto mt-3 max-w-md opacity-90">
          Choose your style, enter your measurements, and get an instant price — all online, no showroom visit needed.
        </p>
        <Link
          href="/configure"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-primary transition-opacity hover:opacity-90"
        >
          Configure Your Blinds
        </Link>
      </section>
    </div>
  );
}
