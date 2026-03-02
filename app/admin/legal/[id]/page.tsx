import { getLegalDocumentById } from "@/lib/admin/legal-actions";
import { LegalDocForm } from "@/components/admin/legal-doc-form";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLegalDocPage({ params }: PageProps) {
  const { id } = await params;
  const doc = await getLegalDocumentById(id);

  if (!doc) notFound();

  return (
    <LegalDocForm
      initialData={{
        id: doc.id,
        title: doc.title,
        slug: doc.slug,
        content: doc.content,
        required: doc.required,
        active: doc.active,
        version: doc.version,
      }}
    />
  );
}
