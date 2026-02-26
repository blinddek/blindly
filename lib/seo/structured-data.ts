import { siteConfig } from "@/config/site";
import type { SiteSettings } from "@/types/cms";
import type { Faq } from "@/types/cms";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || `https://${siteConfig.domain}`;

// ─── Base Schemas (always available) ─────────────────────────

/** Organization schema — homepage */
export function organizationSchema(settings: SiteSettings) {
  const socialUrls =
    settings.social_links?.map((l) => l.url).filter(Boolean) ?? [];

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.company_name || siteConfig.name,
    url: BASE_URL,
    ...(socialUrls.length > 0 ? { sameAs: socialUrls } : {}),
  };
}

/** LocalBusiness schema — contact page */
export function localBusinessSchema(settings: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: settings.company_name || siteConfig.name,
    url: BASE_URL,
    ...(settings.phone_number ? { telephone: settings.phone_number } : {}),
    ...(settings.email ? { email: settings.email } : {}),
    ...(settings.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: settings.address,
            addressCountry: "ZA",
          },
        }
      : {}),
    ...(settings.business_hours
      ? { openingHours: settings.business_hours }
      : {}),
    ...(settings.google_maps_coordinates
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: settings.google_maps_coordinates.lat,
            longitude: settings.google_maps_coordinates.lng,
          },
        }
      : {}),
  };
}

/** FAQPage schema — FAQ page */
export function faqPageSchema(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question.en,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer.en,
      },
    })),
  };
}

// ─── Advanced Schemas (seoAdvanced) ──────────────────────────

/** WebSite + SearchAction — homepage */
export function webSiteSchema(settings: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.company_name || siteConfig.name,
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** BreadcrumbList — all public pages */
export function breadcrumbSchema(
  segments: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: segments.map((seg, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: seg.name,
      item: seg.url,
    })),
  };
}

/** Service schema — service/booking pages */
export function serviceSchema(service: {
  name: string;
  description?: string;
  price_cents?: number;
  duration_minutes?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      url: BASE_URL,
    },
    ...(service.description ? { description: service.description } : {}),
    ...(service.price_cents
      ? {
          offers: {
            "@type": "Offer",
            price: (service.price_cents / 100).toFixed(2),
            priceCurrency: siteConfig.currency,
          },
        }
      : {}),
  };
}

/** Product schema — shop product pages */
export function productSchema(product: {
  name: string;
  description?: string;
  price_cents: number;
  image?: string | null;
  slug: string;
  stock_quantity?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: `${BASE_URL}/shop/${product.slug}`,
    ...(product.description ? { description: product.description } : {}),
    ...(product.image ? { image: product.image } : {}),
    offers: {
      "@type": "Offer",
      price: (product.price_cents / 100).toFixed(2),
      priceCurrency: siteConfig.currency,
      availability:
        product.stock_quantity !== undefined && product.stock_quantity <= 0
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      url: `${BASE_URL}/shop/${product.slug}`,
    },
  };
}

/** BlogPosting schema — blog post pages */
export function blogPostSchema(post: {
  title: string;
  description?: string;
  image?: string | null;
  slug: string;
  published_at?: string | null;
  author?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    url: `${BASE_URL}/blog/${post.slug}`,
    ...(post.description ? { description: post.description } : {}),
    ...(post.image ? { image: post.image } : {}),
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    author: {
      "@type": "Person",
      name: post.author || siteConfig.name,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: BASE_URL,
    },
  };
}

/** Course schema — LMS course pages */
export function courseSchema(course: {
  name: string;
  description?: string;
  price_cents?: number;
  image?: string | null;
  slug: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.name,
    url: `${BASE_URL}/courses/${course.slug}`,
    ...(course.description ? { description: course.description } : {}),
    ...(course.image ? { image: course.image } : {}),
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      url: BASE_URL,
    },
    ...(course.price_cents
      ? {
          offers: {
            "@type": "Offer",
            price: (course.price_cents / 100).toFixed(2),
            priceCurrency: siteConfig.currency,
          },
        }
      : {}),
  };
}
