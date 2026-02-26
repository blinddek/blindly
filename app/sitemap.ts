import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";
import { isEnabled } from "@/config/features";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || `https://${siteConfig.domain}`;

type ChangeFreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
type SeoDefaults = { priority: number; changeFrequency: ChangeFreq };
type SeoMap = Map<string, { priority: number; changefreq: ChangeFreq }>;

/** Fetch page_seo overrides for sitemap priority/changefreq when seoAdvanced is on */
async function getSeoOverrides(): Promise<SeoMap> {
  if (!isEnabled("seoAdvanced")) return new Map();

  const supabase = await createClient();
  const { data } = await supabase
    .from("page_seo")
    .select("page_key, priority, changefreq, noindex");

  const map: SeoMap = new Map();
  for (const row of data ?? []) {
    if (row.noindex) continue;
    map.set(row.page_key, {
      priority: row.priority ?? 0.5,
      changefreq: (row.changefreq as ChangeFreq) ?? "monthly",
    });
  }
  return map;
}

function seoFor(seoMap: SeoMap, key: string, defaults: SeoDefaults) {
  const override = seoMap.get(key);
  if (override) return { priority: override.priority, changeFrequency: override.changefreq };
  return defaults;
}

/** Static pages conditional on siteConfig.pages */
function getStaticPages(seoMap: SeoMap): MetadataRoute.Sitemap {
  const pages: { path: string; key: string; defaults: SeoDefaults }[] = [
    { path: "/about", key: "about", defaults: { priority: 0.7, changeFrequency: "monthly" } },
    { path: "/services", key: "services", defaults: { priority: 0.8, changeFrequency: "monthly" } },
    { path: "/contact", key: "contact", defaults: { priority: 0.7, changeFrequency: "monthly" } },
    { path: "/faq", key: "faq", defaults: { priority: 0.6, changeFrequency: "monthly" } },
    { path: "/terms", key: "terms", defaults: { priority: 0.3, changeFrequency: "yearly" } },
    { path: "/privacy", key: "privacy", defaults: { priority: 0.3, changeFrequency: "yearly" } },
  ];

  return pages
    .filter((p) => siteConfig.pages[p.key as keyof typeof siteConfig.pages])
    .map((p) => ({
      url: `${BASE_URL}${p.path}`,
      lastModified: new Date(),
      ...seoFor(seoMap, p.key, p.defaults),
    }));
}

/** Dynamic content entries (portfolio, blog, shop, courses) */
async function getDynamicEntries(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  seoMap: SeoMap
): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  if (isEnabled("portfolio")) {
    await addCollectionEntries(entries, supabase, seoMap, {
      table: "portfolio_items",
      basePath: "/portfolio",
      seoKey: "portfolio",
      slugField: "slug",
      dateField: "updated_at",
      filter: (q) => q.select("slug, updated_at").eq("is_published", true),
      indexDefaults: { priority: 0.8, changeFrequency: "monthly" },
      itemFreq: "monthly",
      itemPriority: 0.6,
    });
  }

  if (isEnabled("blog")) {
    await addCollectionEntries(entries, supabase, seoMap, {
      table: "blog_posts",
      basePath: "/blog",
      seoKey: "blog",
      slugField: "slug",
      dateField: "published_at",
      filter: (q) => q.select("slug, published_at").eq("is_published", true),
      indexDefaults: { priority: 0.8, changeFrequency: "weekly" },
      itemFreq: "monthly",
      itemPriority: 0.6,
    });
  }

  if (isEnabled("booking")) {
    entries.push({
      url: `${BASE_URL}/book`,
      lastModified: new Date(),
      ...seoFor(seoMap, "book", { priority: 0.8, changeFrequency: "monthly" }),
    });
  }

  if (isEnabled("shop")) {
    await addCollectionEntries(entries, supabase, seoMap, {
      table: "products",
      basePath: "/shop",
      seoKey: "shop",
      slugField: "slug",
      dateField: "updated_at",
      filter: (q) => q.select("slug, updated_at").eq("is_active", true).is("deleted_at", null),
      indexDefaults: { priority: 0.9, changeFrequency: "weekly" },
      itemFreq: "weekly",
      itemPriority: 0.7,
    });
  }

  if (isEnabled("lms")) {
    await addCollectionEntries(entries, supabase, seoMap, {
      table: "courses",
      basePath: "/courses",
      seoKey: "courses",
      slugField: "slug",
      dateField: "updated_at",
      filter: (q) => q.select("slug, updated_at").eq("is_published", true).is("deleted_at", null),
      indexDefaults: { priority: 0.8, changeFrequency: "weekly" },
      itemFreq: "weekly",
      itemPriority: 0.7,
    });
  }

  return entries;
}

/** Add index + item entries for a content collection */
async function addCollectionEntries(
  entries: MetadataRoute.Sitemap,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  seoMap: SeoMap,
  opts: {
    table: string;
    basePath: string;
    seoKey: string;
    slugField: string;
    dateField: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filter: (q: any) => any;
    indexDefaults: SeoDefaults;
    itemFreq: ChangeFreq;
    itemPriority: number;
  }
) {
  const { data: items } = await opts.filter(supabase.from(opts.table));
  if (!items || items.length === 0) return;

  entries.push({
    url: `${BASE_URL}${opts.basePath}`,
    lastModified: new Date(),
    ...seoFor(seoMap, opts.seoKey, opts.indexDefaults),
  });

  for (const item of items) {
    entries.push({
      url: `${BASE_URL}${opts.basePath}/${item[opts.slugField]}`,
      lastModified: item[opts.dateField] ? new Date(item[opts.dateField]) : new Date(),
      changeFrequency: opts.itemFreq,
      priority: opts.itemPriority,
    });
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const seoMap = await getSeoOverrides();

  const entries: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), ...seoFor(seoMap, "home", { priority: 1, changeFrequency: "weekly" }) },
    ...getStaticPages(seoMap),
    ...(await getDynamicEntries(supabase, seoMap)),
  ];

  return entries;
}
