import { generatePageMetadata } from "@/lib/seo/metadata";
import { getSiteContent } from "@/lib/cms/queries";
import { siteConfig } from "@/config/site";
import type { LocalizedString } from "@/types/cms";

export async function generateMetadata() {
  return generatePageMetadata("terms");
}

export default async function TermsPage() {
  const content = (await getSiteContent("terms")) as {
    heading?: LocalizedString;
    body?: LocalizedString;
    updated_at?: string;
  } | null;

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 md:px-8">
      <h1 className="text-3xl font-bold">
        {content?.heading?.en ?? "Terms of Service"}
      </h1>

      {content?.updated_at && (
        <p className="mt-1 text-sm text-muted-foreground">
          Last updated: {content.updated_at}
        </p>
      )}

      {content?.body?.en ? (
        <div className="prose prose-neutral dark:prose-invert mt-6 max-w-none">
          {content.body.en.split("\n\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-muted-foreground">
          Terms of service for {siteConfig.name}. Please contact us for more
          information.
        </p>
      )}
    </section>
  );
}
