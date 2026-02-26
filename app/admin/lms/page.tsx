"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { upsertCourse, deleteCourse } from "@/lib/lms/actions";
import { LocalizedInput } from "@/components/admin/localized-input";
import { ImageUpload } from "@/components/admin/image-upload";
import type { LocalizedString } from "@/types/cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, BookOpen, Users } from "lucide-react";
import Link from "next/link";

const L = (en = "", af = ""): LocalizedString => ({ en, af });

interface CourseForm {
  id?: string;
  slug: string;
  title: LocalizedString;
  description: LocalizedString | null;
  price_cents: number;
  difficulty: string;
  image_url: string | null;
  is_published: boolean;
}

const emptyCourse = (): CourseForm => ({
  slug: "",
  title: L(),
  description: L(),
  price_cents: 0,
  difficulty: "beginner",
  image_url: null,
  is_published: false,
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminCoursesPage() {
  const [items, setItems] = useState<CourseForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingItems, setSavingItems] = useState<Record<number, boolean>>({});
  const [deletingItems, setDeletingItems] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<Record<string, { modules: number; lessons: number; enrollments: number }>>({});
  const autoSlugged = useRef<Set<number>>(new Set());

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) toast.error(error.message);
      else if (data) {
        setItems(data as CourseForm[]);

        // Load stats for each course
        const courseIds = data.map((c: { id: string }) => c.id);
        if (courseIds.length > 0) {
          const [modulesRes, enrollmentsRes] = await Promise.all([
            supabase.from("course_modules").select("id, course_id").in("course_id", courseIds),
            supabase.from("enrollments").select("id, course_id").in("course_id", courseIds),
          ]);

          const moduleIds = (modulesRes.data ?? []).map((m: { id: string }) => m.id);
          const lessonsRes = moduleIds.length > 0
            ? await supabase.from("course_lessons").select("id, module_id").in("module_id", moduleIds)
            : { data: [] };

          const modulesByCourse: Record<string, string[]> = {};
          for (const m of modulesRes.data ?? []) {
            const mod = m as { id: string; course_id: string };
            if (!modulesByCourse[mod.course_id]) modulesByCourse[mod.course_id] = [];
            modulesByCourse[mod.course_id].push(mod.id);
          }

          const lessonsByModule: Record<string, number> = {};
          for (const l of lessonsRes.data ?? []) {
            const lesson = l as { module_id: string };
            lessonsByModule[lesson.module_id] = (lessonsByModule[lesson.module_id] ?? 0) + 1;
          }

          const enrollmentsByCourse: Record<string, number> = {};
          for (const e of enrollmentsRes.data ?? []) {
            const enr = e as { course_id: string };
            enrollmentsByCourse[enr.course_id] = (enrollmentsByCourse[enr.course_id] ?? 0) + 1;
          }

          const newStats: Record<string, { modules: number; lessons: number; enrollments: number }> = {};
          for (const id of courseIds) {
            const mods = modulesByCourse[id] ?? [];
            let lessonCount = 0;
            for (const mid of mods) lessonCount += lessonsByModule[mid] ?? 0;
            newStats[id] = {
              modules: mods.length,
              lessons: lessonCount,
              enrollments: enrollmentsByCourse[id] ?? 0,
            };
          }
          setStats(newStats);
        }
      }

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
        const shouldAutoSlug = item.slug === "" || autoSlugged.current.has(index);
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

  function addItem() {
    setItems((prev) => [...prev, emptyCourse()]);
    autoSlugged.current.add(items.length);
  }

  async function handleSaveItem(index: number) {
    setSavingItems((prev) => ({ ...prev, [index]: true }));
    try {
      const item = items[index];
      await upsertCourse({
        ...(item.id ? { id: item.id } : {}),
        title: item.title,
        slug: item.slug,
        description: item.description,
        price_cents: item.price_cents,
        difficulty: item.difficulty,
        image_url: item.image_url,
        is_published: item.is_published,
      });

      const supabase = createClient();
      const { data } = await supabase
        .from("courses")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (data) setItems(data as CourseForm[]);
      autoSlugged.current.clear();
      toast.success("Course saved!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingItems((prev) => ({ ...prev, [index]: false }));
    }
  }

  async function handleDeleteItem(item: CourseForm) {
    if (!item.id) {
      setItems((prev) => prev.filter((i) => i !== item));
      return;
    }
    setDeletingItems((prev) => ({ ...prev, [item.id!]: true }));
    try {
      await deleteCourse(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success("Course archived!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      if (item.id) setDeletingItems((prev) => ({ ...prev, [item.id!]: false }));
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
        <h1 className="text-2xl font-bold text-foreground">Courses</h1>
        <p className="text-sm text-muted-foreground">
          Create and manage courses for your LMS.
        </p>
      </div>

      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-2 h-4 w-4" /> Add Course
        </Button>
      </div>

      {items.map((item, i) => {
        const courseStats = item.id ? stats[item.id] : undefined;
        return (
          <Card key={item.id ?? `new-${i}`}>
            <CardContent className="space-y-4 pt-6">
              {item.id && courseStats && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {courseStats.modules} modules, {courseStats.lessons} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {courseStats.enrollments} enrolled
                  </span>
                  {item.is_published ? (
                    <Badge variant="default">Published</Badge>
                  ) : (
                    <Badge variant="outline">Draft</Badge>
                  )}
                </div>
              )}

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
                label="Description"
                value={item.description ?? L()}
                onChange={(v) => updateItem(i, "description", v)}
                multiline
                rows={3}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Price (cents)</label>
                  <Input
                    type="number"
                    min={0}
                    value={item.price_cents}
                    onChange={(e) => updateItem(i, "price_cents", parseInt(e.target.value) || 0)}
                    placeholder="0 = free"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.price_cents === 0 ? "Free" : `R ${(item.price_cents / 100).toFixed(2)}`}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Difficulty</label>
                  <select
                    value={item.difficulty}
                    onChange={(e) => updateItem(i, "difficulty", e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={item.is_published}
                      onChange={(e) => updateItem(i, "is_published", e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                    Published
                  </label>
                </div>
              </div>

              <ImageUpload
                label="Course Image"
                value={item.image_url}
                onChange={(url) => updateItem(i, "image_url", url)}
                folder="courses"
              />

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSaveItem(i)}
                  disabled={savingItems[i]}
                >
                  {savingItems[i] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Course
                </Button>
                {item.id && (
                  <Link href={`/admin/lms/${item.id}`}>
                    <Button size="sm" variant="outline">
                      <BookOpen className="mr-2 h-4 w-4" /> Manage Curriculum
                    </Button>
                  </Link>
                )}
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
        );
      })}

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No courses yet. Click &quot;Add Course&quot; to create one.
        </p>
      )}
    </div>
  );
}
