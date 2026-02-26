"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { upsertBlogPost, deleteBlogPost } from "@/lib/cms/actions";
import { LocalizedInput } from "@/components/admin/localized-input";
import { DynamicStringList } from "@/components/admin/dynamic-string-list";
import { ImageUpload } from "@/components/admin/image-upload";
import type { LocalizedString } from "@/types/cms";
import type { BlogCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, FolderOpen } from "lucide-react";
import Link from "next/link";

const L = (en = "", af = ""): LocalizedString => ({ en, af });

interface BlogPostForm {
  id?: string;
  slug: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  content: LocalizedString;
  author: string;
  category_id: string | null;
  tags: string[];
  featured_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
}

const emptyPost = (): BlogPostForm => ({
  slug: "",
  title: L(),
  excerpt: L(),
  content: L(),
  author: "",
  category_id: null,
  tags: [],
  featured_image_url: null,
  is_published: false,
  published_at: null,
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function BlogEditor() {
  const [items, setItems] = useState<BlogPostForm[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingItems, setSavingItems] = useState<Record<number, boolean>>({});
  const [deletingItems, setDeletingItems] = useState<Record<string, boolean>>(
    {}
  );
  const autoSlugged = useRef<Set<number>>(new Set());

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [postsRes, catsRes] = await Promise.all([
        supabase
          .from("blog_posts")
          .select("*")
          .is("deleted_at", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("blog_categories")
          .select("*")
          .order("name->en"),
      ]);

      if (postsRes.error) toast.error(postsRes.error.message);
      else if (postsRes.data) setItems(postsRes.data as BlogPostForm[]);

      if (catsRes.data) setCategories(catsRes.data as BlogCategory[]);

      setLoading(false);
    }
    load();
  }, []);

  function updateItem(index: number, key: string, value: unknown) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  }

  function handleTitleChange(index: number, value: LocalizedString) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, title: value };
        const shouldAutoSlug =
          item.slug === "" || autoSlugged.current.has(index);
        if (shouldAutoSlug && value.en) {
          updated.slug = slugify(value.en);
          autoSlugged.current.add(index);
        } else if (shouldAutoSlug && !value.en) {
          updated.slug = "";
          autoSlugged.current.add(index);
        }
        return updated;
      })
    );
  }

  function handleSlugChange(index: number, value: string) {
    autoSlugged.current.delete(index);
    updateItem(index, "slug", value);
  }

  function handlePublishedToggle(index: number, checked: boolean) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, is_published: checked };
        if (checked && item.published_at === null) {
          updated.published_at = new Date().toISOString();
        }
        return updated;
      })
    );
  }

  function addItem() {
    setItems((prev) => [...prev, emptyPost()]);
    autoSlugged.current.add(items.length);
  }

  async function handleSaveItem(index: number) {
    setSavingItems((prev) => ({ ...prev, [index]: true }));
    try {
      const item = items[index];
      await upsertBlogPost({
        ...(item.id ? { id: item.id } : {}),
        slug: item.slug,
        title: item.title,
        excerpt: item.excerpt,
        content: item.content,
        author: item.author,
        category_id: item.category_id || null,
        tags: item.tags,
        featured_image_url: item.featured_image_url || null,
        is_published: item.is_published,
        published_at: item.published_at,
      });

      const supabase = createClient();
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (data) setItems(data as BlogPostForm[]);
      autoSlugged.current.clear();
      toast.success("Blog post saved!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingItems((prev) => ({ ...prev, [index]: false }));
    }
  }

  async function handleDeleteItem(item: BlogPostForm) {
    if (!item.id) {
      setItems((prev) => prev.filter((i) => i !== item));
      return;
    }
    setDeletingItems((prev) => ({ ...prev, [item.id!]: true }));
    try {
      await deleteBlogPost(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success("Blog post archived!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      if (item.id)
        setDeletingItems((prev) => ({ ...prev, [item.id!]: false }));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Blog</h1>
        <p className="text-sm text-muted-foreground">
          Create and manage blog posts.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">Posts</h2>
          <Link
            href="/admin/blog/categories"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <FolderOpen className="h-3 w-3" /> Categories
          </Link>
        </div>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-2 h-4 w-4" /> Add Post
        </Button>
      </div>

      {items.map((item, i) => (
        <Card key={item.id ?? `new-${i}`}>
          <CardContent className="space-y-4 pt-6">
            <div>
              <label className="mb-1 block text-sm font-medium">Slug</label>
              <Input
                value={item.slug}
                onChange={(e) => handleSlugChange(i, e.target.value)}
                placeholder="auto-generated-from-title"
              />
            </div>

            <LocalizedInput
              label="Title"
              value={item.title}
              onChange={(v) => handleTitleChange(i, v)}
            />

            <LocalizedInput
              label="Excerpt"
              value={item.excerpt}
              onChange={(v) => updateItem(i, "excerpt", v)}
              multiline
            />

            <LocalizedInput
              label="Content (Markdown)"
              value={item.content}
              onChange={(v) => updateItem(i, "content", v)}
              multiline
              rows={12}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Author
                </label>
                <Input
                  value={item.author}
                  onChange={(e) => updateItem(i, "author", e.target.value)}
                  placeholder="Author name"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Category
                </label>
                <select
                  value={item.category_id ?? ""}
                  onChange={(e) =>
                    updateItem(i, "category_id", e.target.value || null)
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name.en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Tags</label>
              <DynamicStringList
                value={item.tags}
                onChange={(tags) => updateItem(i, "tags", tags)}
                placeholder="Enter a tag"
              />
            </div>

            <ImageUpload
              label="Featured Image"
              value={item.featured_image_url}
              onChange={(url) => updateItem(i, "featured_image_url", url)}
              folder="blog"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={item.is_published}
                    onChange={(e) =>
                      handlePublishedToggle(i, e.target.checked)
                    }
                    className="h-4 w-4 rounded border-input"
                  />
                  Published
                </label>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Published At
                </label>
                <Input
                  value={item.published_at ?? ""}
                  readOnly
                  className="text-muted-foreground"
                  placeholder="Set automatically on first publish"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleSaveItem(i)}
                disabled={savingItems[i]}
              >
                {savingItems[i] && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Post
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteItem(item)}
                disabled={item.id ? deletingItems[item.id] : false}
              >
                {item.id && deletingItems[item.id] ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Archive
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No blog posts yet. Click &quot;Add Post&quot; to create one.
        </p>
      )}
    </div>
  );
}
