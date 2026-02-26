import Link from "next/link";
import Image from "next/image";
import { generatePageMetadata } from "@/lib/seo/metadata";
import { getPublishedPortfolioItems } from "@/lib/cms/queries";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

export async function generateMetadata() {
  return generatePageMetadata("portfolio");
}

export default async function PortfolioPage() {
  const items = await getPublishedPortfolioItems();

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-16 md:px-8">
      <h1 className="text-3xl font-bold text-foreground md:text-4xl">
        Portfolio
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        A selection of our completed projects.
      </p>

      {items.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">
          No projects published yet. Check back soon!
        </p>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/portfolio/${item.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg"
            >
              {item.hero_image_url ? (
                <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                  <Image
                    src={item.hero_image_url}
                    alt={item.alt_text?.en || item.title.en}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="flex aspect-[16/9] items-center justify-center bg-muted">
                  <span className="text-3xl font-bold text-muted-foreground/30">
                    {item.title.en.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                <h2 className="text-lg font-semibold text-foreground group-hover:text-primary">
                  {item.title.en}
                </h2>
                {item.industry && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.industry}
                  </p>
                )}
                {item.description?.en && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {item.description.en}
                  </p>
                )}
                {item.tech_stack && item.tech_stack.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {item.tech_stack.slice(0, 4).map((tech) => (
                      <Badge key={tech} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                    {item.tech_stack.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{item.tech_stack.length - 4}
                      </Badge>
                    )}
                  </div>
                )}
                {item.live_url && (
                  <div className="mt-auto pt-3">
                    <span className="inline-flex items-center gap-1 text-xs text-primary">
                      <ExternalLink className="h-3 w-3" /> Live site
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
