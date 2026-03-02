import { generatePageMetadata } from "@/lib/seo/metadata";
import { getLegalDocumentBySlug } from "@/lib/cms/queries";
import { LegalContent } from "@/components/legal/legal-content";

export async function generateMetadata() {
  return generatePageMetadata("terms");
}

export default async function TermsPage() {
  const doc = await getLegalDocumentBySlug("terms");

  return (
    <LegalContent
      title={doc?.title ?? null}
      content={doc?.content ?? null}
      updatedAt={doc?.updated_at ?? null}
      fallbackHeading={{ en: "Terms of Service", af: "Diensvoorwaardes" }}
      fallbackText={{ en: "Terms of service coming soon. Please contact us for more information.", af: "Diensvoorwaardes kom binnekort. Kontak ons vir meer inligting." }}
    />
  );
}
