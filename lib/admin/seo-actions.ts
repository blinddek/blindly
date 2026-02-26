"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/auth";

// ---------- Update Page SEO ----------

export async function updatePageSeo(
  id: string,
  data: {
    title?: { en: string; af: string };
    description?: { en: string; af: string };
    og_image_url?: string | null;
    keywords?: string | null;
    og_type?: string | null;
    twitter_card?: string | null;
    canonical_url?: string | null;
    noindex?: boolean;
    priority?: number | null;
    changefreq?: string | null;
  }
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();

  const { error } = await admin
    .from("page_seo")
    .update({
      title: data.title,
      description: data.description,
      og_image_url: data.og_image_url || null,
      keywords: data.keywords || null,
      og_type: data.og_type || "website",
      twitter_card: data.twitter_card || "summary_large_image",
      canonical_url: data.canonical_url || null,
      noindex: data.noindex ?? false,
      priority: data.priority ?? 0.5,
      changefreq: data.changefreq || "monthly",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidateTag("page-seo", "max");
  revalidatePath("/admin/seo");
  return {};
}

// ---------- Create Page SEO (for new entries) ----------

export async function createPageSeo(
  data: {
    page_key: string;
    title?: { en: string; af: string };
    description?: { en: string; af: string };
    og_image_url?: string | null;
    keywords?: string | null;
    og_type?: string;
    twitter_card?: string;
    canonical_url?: string | null;
    noindex?: boolean;
    priority?: number;
    changefreq?: string;
  }
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();

  const { error } = await admin.from("page_seo").upsert(
    {
      page_key: data.page_key,
      title: data.title ?? { en: "", af: "" },
      description: data.description ?? { en: "", af: "" },
      og_image_url: data.og_image_url || null,
      keywords: data.keywords || null,
      og_type: data.og_type || "website",
      twitter_card: data.twitter_card || "summary_large_image",
      canonical_url: data.canonical_url || null,
      noindex: data.noindex ?? false,
      priority: data.priority ?? 0.5,
      changefreq: data.changefreq || "monthly",
    },
    { onConflict: "page_key" }
  );

  if (error) return { error: error.message };

  revalidateTag("page-seo", "max");
  revalidatePath("/admin/seo");
  return {};
}

// ---------- Update Content Model SEO Fields ----------

export async function updateContentSeo(
  modelType: "blog_posts" | "products" | "portfolio_items" | "courses",
  id: string,
  data: {
    meta_title?: string | null;
    meta_description?: string | null;
  }
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();

  const { error } = await admin
    .from(modelType)
    .update({
      meta_title: data.meta_title || null,
      meta_description: data.meta_description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  const pathMap: Record<string, string> = {
    blog_posts: "/blog",
    products: "/shop",
    portfolio_items: "/portfolio",
    courses: "/courses",
  };

  revalidateTag("page-seo", "max");
  revalidatePath(pathMap[modelType] ?? "/");
  return {};
}

// ---------- Get All SEO Entries ----------

export async function getAllSeoEntries(): Promise<{
  pages: Array<{
    id: string;
    page_key: string;
    title: { en: string; af: string } | null;
    description: { en: string; af: string } | null;
    og_image_url: string | null;
    keywords: string | null;
    og_type: string | null;
    twitter_card: string | null;
    canonical_url: string | null;
    noindex: boolean;
    priority: number | null;
    changefreq: string | null;
  }>;
}> {
  const auth = await requireAdmin();
  if ("error" in auth) return { pages: [] };

  const admin = createAdminClient();
  const { data } = await admin
    .from("page_seo")
    .select("*")
    .order("page_key");

  return { pages: data ?? [] };
}
