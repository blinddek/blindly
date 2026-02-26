"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  upsertModule,
  deleteModule,
  upsertLesson,
  deleteLesson,
} from "@/lib/lms/actions";
import { LocalizedInput } from "@/components/admin/localized-input";
import type { LocalizedString } from "@/types/cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import Link from "next/link";

const L = (en = "", af = ""): LocalizedString => ({ en, af });

interface ModuleForm {
  id?: string;
  course_id: string;
  title: LocalizedString;
  display_order: number;
}

interface LessonForm {
  id?: string;
  module_id: string;
  title: LocalizedString;
  type: string;
  content: { en: string; af: string } | null;
  duration_minutes: number | null;
  is_preview: boolean;
  display_order: number;
}

export default function CourseEditorPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const [courseName, setCourseName] = useState("");
  const [modules, setModules] = useState<ModuleForm[]>([]);
  const [lessons, setLessons] = useState<Record<string, LessonForm[]>>({});
  const [loading, setLoading] = useState(true);
  const [savingModules, setSavingModules] = useState<Record<number, boolean>>({});
  const [deletingModules, setDeletingModules] = useState<Record<string, boolean>>({});
  const [savingLessons, setSavingLessons] = useState<Record<string, boolean>>({});
  const [deletingLessons, setDeletingLessons] = useState<Record<string, boolean>>({});
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: course } = await supabase
        .from("courses")
        .select("title")
        .eq("id", courseId)
        .single();

      if (course) {
        const title = course.title as { en?: string };
        setCourseName(title?.en ?? "Course");
      }

      const { data: mods } = await supabase
        .from("course_modules")
        .select("*")
        .eq("course_id", courseId)
        .order("display_order");

      const moduleList = (mods ?? []) as ModuleForm[];
      setModules(moduleList);

      // Load lessons for all modules
      const moduleIds = moduleList.filter((m) => m.id).map((m) => m.id!);
      if (moduleIds.length > 0) {
        const { data: allLessons } = await supabase
          .from("course_lessons")
          .select("*")
          .in("module_id", moduleIds)
          .order("display_order");

        const grouped: Record<string, LessonForm[]> = {};
        for (const lesson of (allLessons ?? []) as LessonForm[]) {
          if (!grouped[lesson.module_id]) grouped[lesson.module_id] = [];
          grouped[lesson.module_id].push(lesson);
        }
        setLessons(grouped);

        // Expand all modules by default
        setExpandedModules(new Set(moduleIds));
      }

      setLoading(false);
    }
    load();
  }, [courseId]);

  function toggleModule(moduleId: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  // ─── Module operations ──────────────────────────

  function updateModule(index: number, key: string, value: unknown) {
    setModules((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [key]: value } : m))
    );
  }

  function addModule() {
    setModules((prev) => [
      ...prev,
      {
        course_id: courseId,
        title: L(),
        display_order: prev.length + 1,
      },
    ]);
  }

  async function handleSaveModule(index: number) {
    setSavingModules((prev) => ({ ...prev, [index]: true }));
    try {
      const mod = modules[index];
      await upsertModule({
        ...(mod.id ? { id: mod.id } : {}),
        course_id: courseId,
        title: mod.title,
        display_order: mod.display_order,
      });

      // Reload modules
      const supabase = createClient();
      const { data } = await supabase
        .from("course_modules")
        .select("*")
        .eq("course_id", courseId)
        .order("display_order");
      if (data) {
        setModules(data as ModuleForm[]);
        const ids = (data as ModuleForm[]).filter((m) => m.id).map((m) => m.id!);
        setExpandedModules(new Set(ids));
      }
      toast.success("Module saved!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingModules((prev) => ({ ...prev, [index]: false }));
    }
  }

  async function handleDeleteModule(mod: ModuleForm) {
    if (!mod.id) {
      setModules((prev) => prev.filter((m) => m !== mod));
      return;
    }
    setDeletingModules((prev) => ({ ...prev, [mod.id!]: true }));
    try {
      await deleteModule(mod.id);
      setModules((prev) => prev.filter((m) => m.id !== mod.id));
      setLessons((prev) => {
        const next = { ...prev };
        delete next[mod.id!];
        return next;
      });
      toast.success("Module deleted!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      if (mod.id) setDeletingModules((prev) => ({ ...prev, [mod.id!]: false }));
    }
  }

  // ─── Lesson operations ──────────────────────────

  function updateLesson(moduleId: string, lessonIndex: number, key: string, value: unknown) {
    setLessons((prev) => ({
      ...prev,
      [moduleId]: (prev[moduleId] ?? []).map((l, i) =>
        i === lessonIndex ? { ...l, [key]: value } : l
      ),
    }));
  }

  function addLesson(moduleId: string) {
    setLessons((prev) => ({
      ...prev,
      [moduleId]: [
        ...(prev[moduleId] ?? []),
        {
          module_id: moduleId,
          title: L(),
          type: "text",
          content: { en: "", af: "" },
          duration_minutes: null,
          is_preview: false,
          display_order: (prev[moduleId] ?? []).length + 1,
        },
      ],
    }));
  }

  async function handleSaveLesson(moduleId: string, lessonIndex: number) {
    const key = `${moduleId}-${lessonIndex}`;
    setSavingLessons((prev) => ({ ...prev, [key]: true }));
    try {
      const lesson = lessons[moduleId][lessonIndex];
      await upsertLesson({
        ...(lesson.id ? { id: lesson.id } : {}),
        module_id: moduleId,
        title: lesson.title,
        type: lesson.type,
        content: lesson.type === "text" ? lesson.content : null,
        duration_minutes: lesson.duration_minutes,
        is_preview: lesson.is_preview,
        display_order: lesson.display_order,
      });

      // Reload lessons for this module
      const supabase = createClient();
      const { data } = await supabase
        .from("course_lessons")
        .select("*")
        .eq("module_id", moduleId)
        .order("display_order");
      if (data) {
        setLessons((prev) => ({ ...prev, [moduleId]: data as LessonForm[] }));
      }
      toast.success("Lesson saved!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingLessons((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function handleDeleteLesson(moduleId: string, lesson: LessonForm) {
    if (!lesson.id) {
      setLessons((prev) => ({
        ...prev,
        [moduleId]: (prev[moduleId] ?? []).filter((l) => l !== lesson),
      }));
      return;
    }
    setDeletingLessons((prev) => ({ ...prev, [lesson.id!]: true }));
    try {
      await deleteLesson(lesson.id);
      setLessons((prev) => ({
        ...prev,
        [moduleId]: (prev[moduleId] ?? []).filter((l) => l.id !== lesson.id),
      }));
      toast.success("Lesson deleted!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      if (lesson.id) setDeletingLessons((prev) => ({ ...prev, [lesson.id!]: false }));
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
      <div className="flex items-center gap-4">
        <Link href="/admin/lms">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{courseName}</h1>
          <p className="text-sm text-muted-foreground">
            Manage modules and lessons for this course.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Modules</h2>
        <Button variant="outline" size="sm" onClick={addModule}>
          <Plus className="mr-2 h-4 w-4" /> Add Module
        </Button>
      </div>

      {modules.map((mod, mi) => (
        <Card key={mod.id ?? `new-mod-${mi}`}>
          <CardHeader
            className="cursor-pointer"
            onClick={() => mod.id && toggleModule(mod.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                {mod.id && expandedModules.has(mod.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <CardTitle className="text-base">
                  {mod.title.en || `Module ${mi + 1}`}
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  ({(lessons[mod.id!] ?? []).length} lessons)
                </span>
              </div>
            </div>
          </CardHeader>

          {(!mod.id || expandedModules.has(mod.id)) && (
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_100px]">
                <LocalizedInput
                  label="Module Title"
                  value={mod.title}
                  onChange={(v) => updateModule(mi, "title", v)}
                />
                <div>
                  <label className="mb-1 block text-sm font-medium">Order</label>
                  <Input
                    type="number"
                    min={1}
                    value={mod.display_order}
                    onChange={(e) =>
                      updateModule(mi, "display_order", parseInt(e.target.value) || 1)
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSaveModule(mi)}
                  disabled={savingModules[mi]}
                >
                  {savingModules[mi] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Module
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteModule(mod)}
                  disabled={mod.id ? deletingModules[mod.id] : false}
                >
                  {mod.id && deletingModules[mod.id] ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete
                </Button>
              </div>

              {/* Lessons within this module */}
              {mod.id && (
                <div className="ml-4 space-y-4 border-l-2 border-muted pl-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Lessons</h3>
                    <Button variant="outline" size="sm" onClick={() => addLesson(mod.id!)}>
                      <Plus className="mr-2 h-3 w-3" /> Add Lesson
                    </Button>
                  </div>

                  {(lessons[mod.id] ?? []).map((lesson, li) => {
                    const saveKey = `${mod.id}-${li}`;
                    return (
                      <Card key={lesson.id ?? `new-lesson-${li}`} className="bg-muted/30">
                        <CardContent className="space-y-3 pt-4">
                          <LocalizedInput
                            label="Lesson Title"
                            value={lesson.title}
                            onChange={(v) => updateLesson(mod.id!, li, "title", v)}
                          />

                          <div className="grid gap-4 sm:grid-cols-4">
                            <div>
                              <label className="mb-1 block text-sm font-medium">Type</label>
                              <select
                                value={lesson.type}
                                onChange={(e) => updateLesson(mod.id!, li, "type", e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              >
                                <option value="text">Text</option>
                                <option value="video">Video</option>
                                <option value="quiz">Quiz</option>
                                <option value="assignment">Assignment</option>
                              </select>
                            </div>
                            <div>
                              <label className="mb-1 block text-sm font-medium">Duration (min)</label>
                              <Input
                                type="number"
                                min={0}
                                value={lesson.duration_minutes ?? ""}
                                onChange={(e) =>
                                  updateLesson(
                                    mod.id!,
                                    li,
                                    "duration_minutes",
                                    e.target.value ? parseInt(e.target.value) : null
                                  )
                                }
                                placeholder="Optional"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-sm font-medium">Order</label>
                              <Input
                                type="number"
                                min={1}
                                value={lesson.display_order}
                                onChange={(e) =>
                                  updateLesson(mod.id!, li, "display_order", parseInt(e.target.value) || 1)
                                }
                              />
                            </div>
                            <div className="flex items-end">
                              <label className="flex items-center gap-2 text-sm font-medium">
                                <input
                                  type="checkbox"
                                  checked={lesson.is_preview}
                                  onChange={(e) =>
                                    updateLesson(mod.id!, li, "is_preview", e.target.checked)
                                  }
                                  className="h-4 w-4 rounded border-input"
                                />
                                Free Preview
                              </label>
                            </div>
                          </div>

                          {lesson.type === "text" && (
                            <LocalizedInput
                              label="Content (Markdown)"
                              value={lesson.content ?? { en: "", af: "" }}
                              onChange={(v) => updateLesson(mod.id!, li, "content", v)}
                              multiline
                              rows={8}
                            />
                          )}

                          {lesson.type === "video" && (
                            <div>
                              <label className="mb-1 block text-sm font-medium">
                                Video URL (YouTube / Vimeo embed URL)
                              </label>
                              <Input
                                value={lesson.content?.en ?? ""}
                                onChange={(e) =>
                                  updateLesson(mod.id!, li, "content", {
                                    en: e.target.value,
                                    af: e.target.value,
                                  })
                                }
                                placeholder="https://www.youtube.com/embed/..."
                              />
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveLesson(mod.id!, li)}
                              disabled={savingLessons[saveKey]}
                            >
                              {savingLessons[saveKey] && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Save Lesson
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteLesson(mod.id!, lesson)}
                              disabled={lesson.id ? deletingLessons[lesson.id] : false}
                            >
                              {lesson.id && deletingLessons[lesson.id] ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {(lessons[mod.id] ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No lessons yet. Click &quot;Add Lesson&quot; to create one.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}

      {modules.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No modules yet. Click &quot;Add Module&quot; to create one.
        </p>
      )}
    </div>
  );
}
