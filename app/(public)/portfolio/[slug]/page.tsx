import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getPortfolioItemBySlug } from "@/lib/cms/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || `https://${siteConfig.domain}`;

interface PortfolioDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PortfolioDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPortfolioItemBySlug(slug);

  if (!item) return { title: "Project Not Found" };

  return {
    title: item.title.en,
    description:
      item.description?.en ??
      `${item.title.en} — a project by ${siteConfig.name}.`,
    openGraph: {
      title: `${item.title.en} | ${siteConfig.name}`,
      description:
        item.description?.en ?? `${item.title.en} — by ${siteConfig.name}.`,
      url: `/portfolio/${slug}`,
      ...(item.hero_image_url
        ? { images: [{ url: item.hero_image_url }] }
        : {}),
    },
  };
}

export default async function PortfolioDetailPage({
  params,
}: PortfolioDetailProps) {
  const { slug } = await params;
  const item = await getPortfolioItemBySlug(slug);

  if (!item) notFound();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Portfolio",
        item: `${BASE_URL}/portfolio`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: item.title.en,
        item: `${BASE_URL}/portfolio/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <article className="mx-auto max-w-4xl px-4 py-16 md:px-8">
        {/* Back link */}
        <Link
          href="/portfolio"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Portfolio
        </Link>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            {item.title.en}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {item.industry && (
              <Badge variant="secondary">{item.industry}</Badge>
            )}
            {item.live_url && (
              <a
                href={item.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Visit live site
              </a>
            )}
          </div>
        </header>

        {/* Hero image */}
        {item.hero_image_url && (
          <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-xl bg-muted">
            <Image
              src={item.hero_image_url}
              alt={item.alt_text?.en || item.title.en}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Description */}
        {item.description?.en && (
          <div className="mb-10">
            <h2 className="mb-3 text-xl font-semibold">About this project</h2>
            <div className="space-y-3 text-muted-foreground">
              {item.description.en.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        )}

        {/* Features / highlights */}
        {item.features && item.features.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-3 text-xl font-semibold">Key Features</h2>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              {item.features.map((f, i) => (
                <li key={i}>{f.en}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Tech stack */}
        {item.tech_stack && item.tech_stack.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-3 text-xl font-semibold">Tech Stack</h2>
            <div className="flex flex-wrap gap-2">
              {item.tech_stack.map((tech) => (
                <Badge key={tech} variant="outline">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Image gallery */}
        {item.images && item.images.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-3 text-xl font-semibold">Gallery</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {item.images.map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-[16/10] overflow-hidden rounded-lg bg-muted"
                >
                  <Image
                    src={img}
                    alt={`${item.title.en} screenshot ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-xl border bg-muted/30 p-8 text-center">
          <h2 className="text-xl font-semibold">Interested in similar work?</h2>
          <p className="mt-2 text-muted-foreground">
            Get in touch and let&apos;s discuss your project.
          </p>
          <Button asChild className="mt-4">
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </article>
    </>
  );
}
