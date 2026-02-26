# Build 27 — SEO, Sitemap, Structured Data

> **Type:** Full-stack
> **Estimated Time:** 1–2 hrs
> **Dependencies:** Build 24–26 (all public pages)
> **Context Files:** YOROS_UNIVERSAL_PROJECT_BRIEF.md §8 (SEO), site_settings

---

## Objective

Implement comprehensive SEO across the entire public site: dynamic metadata, Open Graph tags, JSON-LD structured data, sitemap, robots.txt, and performance-conscious image handling. Target: Lighthouse SEO score of 95+.

---

## Tasks

### 1. Dynamic Metadata

**`src/lib/seo/metadata.ts`**

Helper function to generate metadata for any page:

```typescript
import { Metadata } from 'next'

interface PageSEO {
  title: string
  description: string
  path: string
  image?: string
  type?: 'website' | 'product' | 'article'
  noindex?: boolean
}

export async function generatePageMetadata(page: PageSEO): Promise<Metadata> {
  const settings = await getPublicSettings()
  const siteName = settings.site_name || 'Blindly'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blindly.co.za'
  const ogImage = page.image || settings.seo_og_image
  
  return {
    title: `${page.title} | ${siteName}`,
    description: page.description,
    openGraph: {
      title: `${page.title} | ${siteName}`,
      description: page.description,
      url: `${siteUrl}${page.path}`,
      siteName,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : [],
      type: page.type || 'website',
      locale: 'en_ZA',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${page.title} | ${siteName}`,
      description: page.description,
      images: ogImage ? [ogImage] : [],
    },
    alternates: {
      canonical: `${siteUrl}${page.path}`,
    },
    robots: page.noindex ? { index: false, follow: false } : undefined,
  }
}
```

Apply to every page using Next.js `generateMetadata`:

```typescript
// Example: src/app/(public)/products/[category-slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const category = await getCategoryBySlug(params['category-slug'])
  return generatePageMetadata({
    title: category.name,
    description: category.description || `Browse our ${category.name} collection`,
    path: `/products/${category.slug}`,
    image: category.image_url,
  })
}
```

### 2. JSON-LD Structured Data

**`src/lib/seo/structured-data.ts`**

#### Organization Schema (site-wide, in root layout)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Blindly",
  "url": "https://blindly.co.za",
  "logo": "https://blindly.co.za/logo.png",
  "description": "[from site_settings]",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "[from site_settings]",
    "contactType": "customer service",
    "areaServed": "ZA",
    "availableLanguage": "English"
  },
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Paarl",
    "addressRegion": "Western Cape",
    "addressCountry": "ZA"
  }
}
```

#### LocalBusiness Schema (homepage)
```json
{
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  "name": "Blindly",
  "image": "[logo]",
  "priceRange": "R300-R10000",
  "address": { ... },
  "geo": { "@type": "GeoCoordinates", "latitude": "-33.7312", "longitude": "18.9706" },
  "openingHoursSpecification": [
    { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"], "opens": "08:00", "closes": "17:00" },
    { "@type": "OpeningHoursSpecification", "dayOfWeek": "Saturday", "opens": "09:00", "closes": "13:00" }
  ]
}
```

#### Product Schema (product browse pages)
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Beach Roller Blind",
  "description": "[range description]",
  "image": "[swatch/lifestyle image]",
  "brand": { "@type": "Brand", "name": "Blindly" },
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "[starting_price / 100]",
    "highPrice": "[max_price / 100]",
    "priceCurrency": "ZAR",
    "availability": "https://schema.org/InStock"
  }
}
```

#### BreadcrumbList Schema (all nested pages)
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://blindly.co.za" },
    { "@type": "ListItem", "position": 2, "name": "Products", "item": "https://blindly.co.za/products" },
    { "@type": "ListItem", "position": 3, "name": "Roller Blinds", "item": "https://blindly.co.za/products/roller-blinds" }
  ]
}
```

#### FAQPage Schema (FAQ page)
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do I measure my window for blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "To measure your window..."
      }
    }
  ]
}
```

### 3. JSON-LD Component

**`src/components/seo/json-ld.tsx`**

```typescript
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

Add to relevant pages:
- Root layout: Organization
- Homepage: LocalBusiness + Organization
- Product pages: Product + BreadcrumbList
- FAQ page: FAQPage + BreadcrumbList
- All nested pages: BreadcrumbList

### 4. Sitemap

**`src/app/sitemap.ts`**

Dynamic sitemap generated from database:

```typescript
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blindly.co.za'
  
  // Static pages
  const staticPages = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${siteUrl}/products`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/configure`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${siteUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/gallery`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.4 },
  ]
  
  // Dynamic product pages
  const categories = await getCategories()
  const categoryPages = categories.map(cat => ({
    url: `${siteUrl}/products/${cat.slug}`,
    lastModified: cat.updated_at,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))
  
  // Range pages (if they exist as separate routes)
  // ...
  
  return [...staticPages, ...categoryPages]
}
```

### 5. Robots.txt

**`src/app/robots.ts`**

```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blindly.co.za'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/login', '/order/', '/quote/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
```

### 6. Image Optimization

Ensure all product images use Next.js `<Image>` component:
- Automatic WebP/AVIF conversion
- Responsive srcset generation
- Lazy loading by default
- Explicit `width` and `height` to prevent CLS
- Priority loading for above-the-fold hero images

### 7. Google Analytics & Search Console

**`src/app/(public)/layout.tsx`** — add GA4 script:

```typescript
// Only load if google_analytics_id is set in site_settings
{gaId && (
  <>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
    <Script id="ga4" strategy="afterInteractive">
      {`window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}');`}
    </Script>
  </>
)}
```

Search Console verification meta tag (from site_settings):
```html
<meta name="google-site-verification" content="[from settings]" />
```

---

## Acceptance Criteria

```
✅ Every public page has unique title and meta description
✅ Open Graph tags render correctly (test with og:image debugger)
✅ Canonical URLs set on all pages
✅ Organization JSON-LD in root layout
✅ LocalBusiness JSON-LD on homepage
✅ Product JSON-LD on product browse pages with prices
✅ BreadcrumbList JSON-LD on nested pages
✅ FAQPage JSON-LD on FAQ page
✅ /sitemap.xml generates with all public URLs
✅ /robots.txt blocks admin, API, order, and quote routes
✅ All images use Next.js Image component
✅ Google Analytics loads when GA ID is set
✅ Search Console meta tag renders when set
✅ Lighthouse SEO score: 95+
✅ No CLS from unoptimized images
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- Use Next.js built-in metadata API (`generateMetadata`, `sitemap.ts`, `robots.ts`) — no external SEO libraries needed
- All SEO values should have sensible defaults but be overridable from site_settings
- JSON-LD must be valid — test with Google's Rich Results Test tool
- The locale is 'en_ZA' (English, South Africa)
- Don't include admin pages, API routes, order confirmation pages, or quote pages in the sitemap
- GA4 should only load in production (or when GA ID is configured) — don't load in dev
- Prices in structured data must be in Rands (divide cents by 100)
