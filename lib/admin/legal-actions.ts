"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { ensureAdmin } from "@/lib/admin/auth";
import { revalidatePath } from "next/cache";

export async function getLegalDocuments() {
  await ensureAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("legal_documents")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getLegalDocumentById(id: string) {
  await ensureAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("legal_documents")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function upsertLegalDocument(doc: {
  id?: string;
  title: string;
  slug: string;
  content: string;
  required?: boolean;
  active?: boolean;
}): Promise<{ error?: string }> {
  await ensureAdmin();
  const admin = createAdminClient();

  const payload: Record<string, unknown> = {
    title: doc.title,
    slug: doc.slug,
    content: doc.content,
    required: doc.required ?? false,
    active: doc.active ?? true,
    updated_at: new Date().toISOString(),
  };

  if (doc.id) {
    // On update, increment version
    const { data: existing } = await admin
      .from("legal_documents")
      .select("version")
      .eq("id", doc.id)
      .single();
    payload.version = (existing?.version ?? 0) + 1;
    payload.id = doc.id;
  } else {
    payload.version = 1;
  }

  const { error } = await admin.from("legal_documents").upsert(payload);
  if (error) return { error: error.message };
  revalidatePath("/admin/legal");
  return {};
}

export async function deleteLegalDocument(
  id: string
): Promise<{ error?: string }> {
  await ensureAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("legal_documents")
    .update({ active: false })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/legal");
  return {};
}

export async function getDocumentAcceptances(documentId: string) {
  await ensureAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("document_acceptances")
    .select("*, user:user_profiles(full_name, email)")
    .eq("document_id", documentId)
    .order("accepted_at", { ascending: false });
  return data ?? [];
}
