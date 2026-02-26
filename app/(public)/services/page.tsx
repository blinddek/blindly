import { generatePageMetadata } from "@/lib/seo/metadata";
import { getHomepageSections, getSiteContent } from "@/lib/cms/queries";
import type { LocalizedString } from "@/types/cms";

export async function generateMetadata() {
  return generatePageMetadata("services");
}

interface ServiceItem {
  title: LocalizedString;
  description: LocalizedString;
  icon?: string;
}

export default async function ServicesPage() {
  // Try homepage_sections first (section_key "services"), fallback to site_content
  const sections = await getHomepageSections();
  const servicesSection = sections.find((s) => s.section_key === "services");

  let services: ServiceItem[] = [];
  let heading = "Our Services";
  let intro = "";

  if (servicesSection) {
    const content = servicesSection.content as {
      heading?: LocalizedString;
      subtitle?: LocalizedString;
      items?: ServiceItem[];
    };
    heading = content.heading?.en || heading;
    intro = content.subtitle?.en || "";
    services = content.items ?? [];
  } else {
    // Fallback: site_content "services"
    const content = (await getSiteContent("services")) as {
      heading?: LocalizedString;
      intro?: LocalizedString;
      items?: ServiceItem[];
    } | null;

    if (content) {
      heading = content.heading?.en || heading;
      intro = content.intro?.en || "";
      services = content.items ?? [];
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 md:px-8">
      <h1 className="text-3xl font-bold">{heading}</h1>
      {intro && (
        <p className="mt-2 max-w-2xl text-muted-foreground">{intro}</p>
      )}

      {services.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <div
              key={service.title?.en || i}
              className="rounded-xl border bg-card p-6"
            >
              {service.icon && (
                <span className="text-2xl" role="img" aria-hidden="true">
                  {service.icon}
                </span>
              )}
              <h2 className="mt-2 text-lg font-semibold">
                {service.title?.en ?? "Service"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {service.description?.en ?? ""}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-muted-foreground">
          Services will be listed here soon.
        </p>
      )}
    </section>
  );
}
