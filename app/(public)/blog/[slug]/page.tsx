import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import {
  getBlogPostBySlug,
  getBlogCategories,
  getRelatedBlogPosts,
} from "@/lib/cms/queries";
import { PostCard } from "@/components/blog/post-card";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { markdownToHtml, readingTime } from "@/lib/markdown";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || `https://${siteConfig.domain}`;

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: post.title.en,
    description:
      post.excerpt?.en ?? `${post.title.en} — read more on our blog.`,
    openGraph: {
      title: `${post.title.en} | ${siteConfig.name} Blog`,
      description: post.excerpt?.en ?? `${post.title.en} — from our blog.`,
      url: `/blog/${slug}`,
      type: "article",
      ...(post.featured_image_url
        ? { images: [{ url: post.featured_image_url }] }
        : {}),
      ...(post.published_at ? { publishedTime: post.published_at } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const [categories, related] = await Promise.all([
    getBlogCategories(),
    getRelatedBlogPosts(post.id, post.category_id),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const category = post.category_id
    ? categoryMap.get(post.category_id)
    : null;
  const minutes = post.content?.en ? readingTime(post.content.en) : null;
  const contentHtml = post.content?.en
    ? markdownToHtml(post.content.en)
    : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${BASE_URL}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title.en,
        item: `${BASE_URL}/blog/${slug}`,
      },
    ],
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title.en,
    url: `${BASE_URL}/blog/${slug}`,
    ...(post.featured_image_url ? { image: post.featured_image_url } : {}),
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    ...(post.author
      ? { author: { "@type": "Person", name: post.author } }
      : {}),
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: BASE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <article className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        {/* Back link */}
        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {category && (
              <Link href={`/blog?category=${category.slug}`}>
                <Badge variant="secondary">{category.name.en}</Badge>
              </Link>
            )}
            {post.published_at && (
              <time>
                {new Date(post.published_at).toLocaleDateString("en-ZA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            )}
            {post.author && <span>by {post.author}</span>}
            {minutes && <span>&middot; {minutes} min read</span>}
          </div>
          <h1 className="mt-4 text-3xl font-bold text-foreground md:text-4xl">
            {post.title.en}
          </h1>
          {post.excerpt?.en && (
            <p className="mt-4 text-lg text-muted-foreground">
              {post.excerpt.en}
            </p>
          )}
        </header>

        {/* Featured image */}
        {post.featured_image_url && (
          <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-xl bg-muted">
            <Image
              src={post.featured_image_url}
              alt={post.title.en}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Content — rendered markdown */}
        {contentHtml ? (
          <div
            className="prose prose-neutral dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        ) : (
          <p className="text-muted-foreground">Content coming soon.</p>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2 border-t pt-6">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="border-t bg-muted/30 px-4 py-16 md:px-8">
          <div className="mx-auto max-w-[1280px]">
            <h2 className="mb-8 text-2xl font-bold">Related Posts</h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((relPost) => (
                <PostCard
                  key={relPost.id}
                  post={relPost}
                  category={
                    relPost.category_id
                      ? categoryMap.get(relPost.category_id)
                      : null
                  }
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
