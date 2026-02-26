import { generatePageMetadata } from "@/lib/seo/metadata";
import { getSiteContent } from "@/lib/cms/queries";
import { siteConfig } from "@/config/site";
import type { LocalizedString } from "@/types/cms";

export async function generateMetadata() {
  return generatePageMetadata("about");
}

export default async function AboutPage() {
  const content = await getSiteContent("about") as {
    heading?: LocalizedString;
    body?: LocalizedString;
    mission?: LocalizedString;
    values?: { title: LocalizedString; description: LocalizedString }[];
  } | null;

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 md:px-8">
      <h1 className="text-3xl font-bold">
        {content?.heading?.en ?? "About Us"}
      </h1>

      {content?.body?.en ? (
        <div className="mt-6 space-y-4 text-muted-foreground">
          {content.body.en.split("\n\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-muted-foreground">
          {siteConfig.description}
        </p>
      )}

      {content?.mission?.en && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold">Our Mission</h2>
          <p className="mt-3 text-muted-foreground">{content.mission.en}</p>
        </div>
      )}

      {content?.values && content.values.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold">Our Values</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {content.values.map((v, i) => (
              <div key={i} className="rounded-lg border p-5">
                <h3 className="font-semibold">{v.title.en}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {v.description.en}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
