import { generatePageMetadata } from "@/lib/seo/metadata";
import { getLegalDocumentBySlug } from "@/lib/cms/queries";
import { LegalContent } from "@/components/legal/legal-content";

export async function generateMetadata() {
  return generatePageMetadata("privacy");
}

export default async function PrivacyPage() {
  const doc = await getLegalDocumentBySlug("privacy");

  return (
    <LegalContent
      title={doc?.title ?? null}
      content={doc?.content ?? null}
      updatedAt={doc?.updated_at ?? null}
      fallbackHeading={{ en: "Privacy Policy", af: "Privaatheidsbeleid" }}
      fallbackText={{ en: "Privacy policy coming soon. Please contact us for more information.", af: "Privaatheidsbeleid kom binnekort. Kontak ons vir meer inligting." }}
    />
  );
}
