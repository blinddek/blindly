import { generatePageMetadata } from "@/lib/seo/metadata";
import { getHomepageSections, getSiteSettings } from "@/lib/cms/queries";
import { organizationSchema } from "@/lib/seo/structured-data";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import type { LocalizedString } from "@/types/cms";

export async function generateMetadata() {
  return generatePageMetadata("home");
}

interface SectionItem {
  icon?: string;
  title?: LocalizedString;
  description?: LocalizedString;
  name?: string;
  role?: string;
  quote?: LocalizedString;
}

export default async function HomePage() {
  const [sections, settings] = await Promise.all([
    getHomepageSections(),
    getSiteSettings(),
  ]);

  const sectionMap = Object.fromEntries(
    sections.map((s) => [s.section_key, s.content])
  );

  const hero = sectionMap.hero as {
    heading?: LocalizedString;
    subheading?: LocalizedString;
    cta_text?: LocalizedString;
    cta_url?: string;
    background_image?: string;
  } | undefined;

  const services = sectionMap.services as {
    heading?: LocalizedString;
    subheading?: LocalizedString;
    items?: SectionItem[];
  } | undefined;

  const about = sectionMap.about as {
    heading?: LocalizedString;
    description?: LocalizedString;
  } | undefined;

  const testimonials = sectionMap.testimonials as {
    heading?: LocalizedString;
    items?: SectionItem[];
  } | undefined;

  const cta = sectionMap.cta as {
    heading?: LocalizedString;
    subheading?: LocalizedString;
    cta_text?: LocalizedString;
    cta_url?: string;
  } | undefined;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema(settings)),
        }}
      />

      {/* Hero */}
      {hero && (
        <section className="relative flex min-h-[70vh] items-center justify-center px-4 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {hero.heading?.en ?? "Welcome"}
            </h1>
            {hero.subheading?.en && (
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                {hero.subheading.en}
              </p>
            )}
            {hero.cta_text?.en && hero.cta_url && (
              <a
                href={hero.cta_url}
                className="mt-8 inline-block rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {hero.cta_text.en}
              </a>
            )}
          </div>
        </section>
      )}

      {/* Services / Features Grid */}
      {services?.items && services.items.length > 0 && (
        <section className="bg-muted/30 py-20">
          <div className="mx-auto max-w-[1280px] px-4 md:px-8">
            {services.heading?.en && (
              <h2 className="text-center text-3xl font-bold">
                {services.heading.en}
              </h2>
            )}
            {services.subheading?.en && (
              <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
                {services.subheading.en}
              </p>
            )}
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {services.items.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
                >
                  {item.icon && (
                    <DynamicIcon
                      name={item.icon}
                      className="mb-4 h-8 w-8 text-primary"
                    />
                  )}
                  {item.title?.en && (
                    <h3 className="text-lg font-semibold">{item.title.en}</h3>
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

      {/* About Snippet */}
      {about?.heading?.en && (
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
            <h2 className="text-3xl font-bold">{about.heading.en}</h2>
            {about.description?.en && (
              <p className="mt-4 text-lg text-muted-foreground">
                {about.description.en}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials?.items && testimonials.items.length > 0 && (
        <section className="bg-muted/30 py-20">
          <div className="mx-auto max-w-[1280px] px-4 md:px-8">
            {testimonials.heading?.en && (
              <h2 className="text-center text-3xl font-bold">
                {testimonials.heading.en}
              </h2>
            )}
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.items.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl border bg-card p-6"
                >
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

      {/* CTA */}
      {cta?.heading?.en && (
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
            <h2 className="text-3xl font-bold">{cta.heading.en}</h2>
            {cta.subheading?.en && (
              <p className="mt-4 text-lg text-muted-foreground">
                {cta.subheading.en}
              </p>
            )}
            {cta.cta_text?.en && cta.cta_url && (
              <a
                href={cta.cta_url}
                className="mt-8 inline-block rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {cta.cta_text.en}
              </a>
            )}
          </div>
        </section>
      )}
    </>
  );
}
