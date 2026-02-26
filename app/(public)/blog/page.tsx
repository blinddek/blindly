import Link from "next/link";
import { generatePageMetadata } from "@/lib/seo/metadata";
import {
  getPublishedBlogPosts,
  getBlogCategories,
} from "@/lib/cms/queries";
import { PostCard } from "@/components/blog/post-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export async function generateMetadata() {
  return generatePageMetadata("blog");
}

interface BlogPageProps {
  searchParams: Promise<{ category?: string; page?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const categorySlug = params.category;
  const page = Math.max(1, Number(params.page) || 1);
  const perPage = 12;

  const [{ posts, total }, categories] = await Promise.all([
    getPublishedBlogPosts({ categorySlug, page, perPage }),
    getBlogCategories(),
  ]);

  // Build a lookup map for category names
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-16 md:px-8">
      <h1 className="text-3xl font-bold text-foreground md:text-4xl">Blog</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Tips, guides, and insights.
      </p>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/blog">
            <Badge
              variant={categorySlug ? "outline" : "default"}
              className="cursor-pointer"
            >
              All
            </Badge>
          </Link>
          {categories.map((cat) => (
            <Link key={cat.id} href={`/blog?category=${cat.slug}`}>
              <Badge
                variant={categorySlug === cat.slug ? "default" : "outline"}
                className="cursor-pointer"
              >
                {cat.name.en}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">
          No articles published yet. Check back soon!
        </p>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              category={post.category_id ? categoryMap.get(post.category_id) : null}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-4">
          {page > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/blog?${new URLSearchParams({
                  ...(categorySlug ? { category: categorySlug } : {}),
                  page: String(page - 1),
                })}`}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
          )}

          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>

          {page < totalPages ? (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/blog?${new URLSearchParams({
                  ...(categorySlug ? { category: categorySlug } : {}),
                  page: String(page + 1),
                })}`}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
