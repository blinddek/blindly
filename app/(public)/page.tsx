import Link from "next/link";
import Image from "next/image";
import { generatePageMetadata } from "@/lib/seo/metadata";
import {
  getHomepageSections,
  getSiteSettings,
  getSiteContent,
} from "@/lib/cms/queries";
import { organizationSchema } from "@/lib/seo/structured-data";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import type { LocalizedString } from "@/types/cms";

export const revalidate = 3600;

export async function generateMetadata() {
  return generatePageMetadata("home");
}

/* ---------- Section content types ---------- */

interface HeroContent {
  heading?: LocalizedString;
  subheading?: LocalizedString;
  cta_text?: LocalizedString;
  cta_url?: string;
  cta_secondary_text?: LocalizedString;
  cta_secondary_url?: string;
  background_image?: string;
}

interface TrustStatsContent {
  items?: { icon?: string; value?: string; label?: LocalizedString }[];
}

interface HowItWorksContent {
  heading?: LocalizedString;
  subheading?: LocalizedString;
  items?: {
    step?: string;
    icon?: string;
    title?: LocalizedString;
    description?: LocalizedString;
  }[];
}

interface ProductsContent {
  heading?: LocalizedString;
  subheading?: LocalizedString;
  items?: {
    icon?: string;
    title?: LocalizedString;
    description?: LocalizedString;
    href?: string;
    image?: string;
  }[];
}

interface AboutContent {
  heading?: LocalizedString;
  body?: LocalizedString;
  image?: string;
}

interface TestimonialsContent {
  heading?: LocalizedString;
  items?: {
    name?: string;
    role?: string;
    quote?: LocalizedString;
  }[];
}

interface CtaContent {
  heading?: LocalizedString;
  body?: LocalizedString;
  button_text?: LocalizedString;
  button_url?: string;
}

/* ---------- Page ---------- */

export default async function HomePage() {
  const [sections, settings, trustStripContent] = await Promise.all([
    getHomepageSections(),
    getSiteSettings(),
    getSiteContent("trust_strip"),
  ]);

  const sectionMap = Object.fromEntries(
    sections.map((s) => [s.section_key, s.content])
  );

  const hero = sectionMap.hero as HeroContent | undefined;
  const trustStats = sectionMap.trust_stats as TrustStatsContent | undefined;
  const howItWorks = sectionMap.how_it_works as HowItWorksContent | undefined;
  const products = sectionMap.products as ProductsContent | undefined;
  const about = sectionMap.about as AboutContent | undefined;
  const testimonials = sectionMap.testimonials as TestimonialsContent | undefined;
  const cta = sectionMap.cta as CtaContent | undefined;

  const trustStripValues = (trustStripContent?.values ?? []) as string[];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema(settings)),
        }}
      />

      {/* ───── 1. Hero ───── */}
      {hero && (
        <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden md:min-h-[85vh]">
          {hero.background_image ? (
            <Image
              src={hero.background_image}
              alt=""
              fill
              priority
              className="object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-primary/80" />

          <div className="relative z-10 mx-auto max-w-3xl px-4 py-20 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {hero.heading?.en ?? "Welcome"}
            </h1>
            {hero.subheading?.en && (
              <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80">
                {hero.subheading.en}
              </p>
            )}

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {hero.cta_text?.en && hero.cta_url && (
                <Link
                  href={hero.cta_url}
                  className="inline-block rounded-md bg-secondary px-8 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/90"
                >
                  {hero.cta_text.en}
                </Link>
              )}
              {hero.cta_secondary_text?.en && hero.cta_secondary_url && (
                <Link
                  href={hero.cta_secondary_url}
                  className="inline-block rounded-md border border-white/50 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  {hero.cta_secondary_text.en}
                </Link>
              )}
            </div>

            {settings.whatsapp_number && (
              <p className="mt-6 text-sm text-white/60">
                Or{" "}
                <a
                  href={`https://wa.me/${settings.whatsapp_number.replaceAll(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-white/80"
                >
                  WhatsApp us
                </a>
              </p>
            )}
          </div>
        </section>
      )}

      {/* ───── 2. Trust Stats Strip ───── */}
      {trustStats?.items && trustStats.items.length > 0 && (
        <section className="bg-primary py-10 text-primary-foreground">
          <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-8 px-4 md:grid-cols-4 md:px-8">
            {trustStats.items.map((stat) => (
              <div key={stat.label?.en ?? stat.value} className="text-center">
                {stat.icon && (
                  <span className="mb-2 block text-2xl">{stat.icon}</span>
                )}
                {stat.value && (
                  <span className="block text-3xl font-bold text-secondary">
                    {stat.value}
                  </span>
                )}
                {stat.label?.en && (
                  <span className="mt-1 block text-sm text-primary-foreground/70">
                    {stat.label.en}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ───── 3. How It Works ───── */}
      {howItWorks?.items && howItWorks.items.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-[1280px] px-4 md:px-8">
            {howItWorks.heading?.en && (
              <h2 className="text-center text-3xl font-bold">
                {howItWorks.heading.en}
              </h2>
            )}
            {howItWorks.subheading?.en && (
              <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
                {howItWorks.subheading.en}
              </p>
            )}
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {howItWorks.items.map((item, i) => (
                <div key={i} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {item.step ?? i + 1}
                  </div>
                  {item.title?.en && (
                    <h3 className="mt-4 text-lg font-semibold">
                      {item.title.en}
                    </h3>
                  )}
                  {item.description?.en && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.description.en}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───── 4. Product Range ───── */}
      {products?.items && products.items.length > 0 && (
        <section className="bg-muted/30 py-20">
          <div className="mx-auto max-w-[1280px] px-4 md:px-8">
            {products.heading?.en && (
              <h2 className="text-center text-3xl font-bold">
                {products.heading.en}
              </h2>
            )}
            {products.subheading?.en && (
              <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
                {products.subheading.en}
              </p>
            )}
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {products.items.map((item, i) => (
                <Link
                  key={i}
                  href={item.href ?? "/shop"}
                  className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
                >
                  {item.image ? (
                    <div className="relative aspect-[3/2] overflow-hidden bg-muted">
                      <Image
                        src={item.image}
                        alt={item.title?.en ?? ""}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[3/2] items-center justify-center bg-muted">
                      {item.icon ? (
                        <DynamicIcon
                          name={item.icon}
                          className="h-16 w-16 text-muted-foreground/30"
                        />
                      ) : (
                        <span className="text-5xl text-muted-foreground/30">
                          {item.title?.en?.charAt(0) ?? "B"}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="p-5">
                    {item.title?.en && (
                      <h3 className="text-lg font-semibold">{item.title.en}</h3>
                    )}
                    {item.description?.en && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {item.description.en}
                      </p>
                    )}
                    <span className="mt-3 inline-block text-sm font-medium text-primary">
                      Configure &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───── 5. About Snippet ───── */}
      {about?.heading?.en && (
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
            <h2 className="text-3xl font-bold">{about.heading.en}</h2>
            {about.body?.en && (
              <p className="mt-4 text-lg text-muted-foreground">
                {about.body.en}
              </p>
            )}
            <Link
              href="/about"
              className="mt-6 inline-block text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Learn more about us
            </Link>
          </div>
        </section>
      )}

      {/* ───── 6. Trust Strip ───── */}
      {trustStripValues.length > 0 && (
        <section className="bg-muted py-4">
          <div className="mx-auto max-w-[1280px] px-4 text-center md:px-8">
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              {trustStripValues.join(" \u00B7 ")}
            </p>
          </div>
        </section>
      )}

      {/* ───── 7. Testimonials ───── */}
      {testimonials?.items && testimonials.items.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-[1280px] px-4 md:px-8">
            {testimonials.heading?.en && (
              <h2 className="text-center text-3xl font-bold">
                {testimonials.heading.en}
              </h2>
            )}
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.items.map((item, i) => (
                <div key={i} className="rounded-xl border bg-card p-6">
                  {item.quote?.en && (
                    <p className="text-sm italic text-muted-foreground">
                      &ldquo;{item.quote.en}&rdquo;
                    </p>
                  )}
                  {item.name && (
                    <p className="mt-4 text-sm font-medium">{item.name}</p>
                  )}
                  {item.role && (
                    <p className="text-xs text-muted-foreground">{item.role}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───── 8. CTA Banner ───── */}
      {cta?.heading?.en && (
        <section className="bg-primary py-20">
          <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
            <h2 className="text-3xl font-bold text-primary-foreground">
              {cta.heading.en}
            </h2>
            {cta.body?.en && (
              <p className="mt-4 text-lg text-primary-foreground/80">
                {cta.body.en}
              </p>
            )}
            {cta.button_text?.en && cta.button_url && (
              <Link
                href={cta.button_url}
                className="mt-8 inline-block rounded-md bg-white px-8 py-3 text-sm font-semibold text-primary transition-opacity hover:opacity-90"
              >
                {cta.button_text.en}
              </Link>
            )}
          </div>
        </section>
      )}
    </>
  );
}
