import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { readingTime } from "@/lib/markdown";
import type { BlogPost, BlogCategory } from "@/types";

interface PostCardProps {
  post: BlogPost;
  category?: BlogCategory | null;
}

export function PostCard({ post, category }: PostCardProps) {
  const minutes = post.content?.en ? readingTime(post.content.en) : null;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg"
    >
      {post.featured_image_url && (
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          <Image
            src={post.featured_image_url}
            alt={post.title.en}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {category && (
            <Badge variant="secondary" className="text-xs">
              {category.name.en}
            </Badge>
          )}
          {post.published_at && (
            <time>
              {new Date(post.published_at).toLocaleDateString("en-ZA", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </time>
          )}
          {minutes && <span>{minutes} min read</span>}
        </div>
        <h2 className="mt-3 text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
          {post.title.en}
        </h2>
        {post.excerpt?.en && (
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
            {post.excerpt.en}
          </p>
        )}
        {post.author && (
          <p className="mt-auto pt-4 text-xs text-muted-foreground">
            By {post.author}
          </p>
        )}
      </div>
    </Link>
  );
}
