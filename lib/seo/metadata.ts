import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { isEnabled } from "@/config/features";
import { getPageSeo } from "@/lib/cms/queries";
import type { PageSeo } from "@/types/cms";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || `https://${siteConfig.domain}`;

/** Apply advanced SEO fields from page_seo to metadata */
function applyAdvancedSeo(
  metadata: Metadata,
  seo: PageSeo,
  pageUrl: string,
  ogImage: string | undefined,
  title: string,
  description: string
): void {
  if (seo.og_type && metadata.openGraph) {
    (metadata.openGraph as Record<string, unknown>).type = seo.og_type;
  }

  metadata.twitter = {
    card: (seo.twitter_card as "summary" | "summary_large_image") || "summary_large_image",
    title,
    description,
    ...(ogImage ? { images: [ogImage] } : {}),
  };

  metadata.alternates = { canonical: seo.canonical_url || pageUrl };

  if (seo.keywords) {
    metadata.keywords = seo.keywords.split(",").map((k) => k.trim());
  }

  if (seo.noindex) {
    metadata.robots = { index: false, follow: true };
  }
}

/**
 * Generate page metadata from page_seo table with siteConfig fallbacks.
 * When seoAdvanced is enabled, adds Twitter cards, canonical URLs,
 * keywords, and enhanced OG tags.
 */
export async function generatePageMetadata(
  pageKey: string,
  overrides?: {
    title?: string;
    description?: string;
    image?: string;
    noIndex?: boolean;
  }
): Promise<Metadata> {
  const seo = await getPageSeo(pageKey);

  const title =
    overrides?.title ||
    seo?.title?.en ||
    `${pageKey.charAt(0).toUpperCase()}${pageKey.slice(1)} — ${siteConfig.name}`;

  const description =
    overrides?.description ||
    seo?.description?.en ||
    siteConfig.description;

  const ogImage = overrides?.image || seo?.og_image_url || undefined;
  const pageUrl = `${BASE_URL}/${pageKey === "home" ? "" : pageKey}`;

  const metadata: Metadata = {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: siteConfig.name,
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
  };

  if (isEnabled("seoAdvanced") && seo) {
    applyAdvancedSeo(metadata, seo, pageUrl, ogImage, title, description);
  }

  if (overrides?.noIndex) {
    metadata.robots = { index: false, follow: true };
  }

  return metadata;
}

/**
 * Build metadata for dynamic content pages (blog, product, portfolio).
 * Merges content model fields with page_seo if available.
 */
export function buildContentMetadata(opts: {
  title: string;
  description: string;
  image?: string | null;
  url: string;
  type?: "article" | "product";
  publishedTime?: string | null;
  author?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  noIndex?: boolean;
}): Metadata {
  const title = opts.metaTitle || opts.title;
  const description = opts.metaDescription || opts.description;
  const image = opts.image || undefined;

  const metadata: Metadata = {
    title,
    description,
    openGraph: {
      title,
      description,
      url: opts.url,
      siteName: siteConfig.name,
      type: opts.type === "article" ? "article" : "website",
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
      ...(opts.publishedTime && opts.type === "article"
        ? { publishedTime: opts.publishedTime }
        : {}),
    },
  };

  if (isEnabled("seoAdvanced")) {
    metadata.twitter = {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    };
    metadata.alternates = { canonical: opts.url };
  }

  if (opts.noIndex) {
    metadata.robots = { index: false, follow: true };
  }

  return metadata;
}
