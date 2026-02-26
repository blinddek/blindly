import { createClient } from "@/lib/supabase/server";
import type { LocalizedString } from "@/types/cms";

// ─── Types ───────────────────────────────────────────────

export interface Course {
  id: string;
  title: LocalizedString;
  slug: string;
  description: LocalizedString | null;
  price_cents: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  image_url: string | null;
  is_published: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  meta_title?: string | null;
  meta_description?: string | null;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: LocalizedString;
  display_order: number;
}

export interface CourseLesson {
  id: string;
  module_id: string;
  title: LocalizedString;
  type: "text" | "video" | "quiz" | "assignment";
  content: { en: string; af: string } | null;
  duration_minutes: number | null;
  is_preview: boolean;
  display_order: number;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  completed_at: string | null;
  created_at: string;
}

// ─── Public: Published Courses ───────────────────────────

export async function getPublishedCourses(): Promise<Course[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("*")
    .eq("is_published", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return (data as Course[]) ?? [];
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .is("deleted_at", null)
    .single();
  return (data as Course) ?? null;
}

// ─── Course Curriculum ───────────────────────────────────

export async function getCourseModules(courseId: string): Promise<CourseModule[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("course_modules")
    .select("*")
    .eq("course_id", courseId)
    .order("display_order");
  return (data as CourseModule[]) ?? [];
}

export async function getModuleLessons(moduleId: string): Promise<CourseLesson[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("course_lessons")
    .select("*")
    .eq("module_id", moduleId)
    .order("display_order");
  return (data as CourseLesson[]) ?? [];
}

export async function getCourseLessons(courseId: string): Promise<CourseLesson[]> {
  const supabase = await createClient();
  const modules = await getCourseModules(courseId);
  if (modules.length === 0) return [];

  const moduleIds = modules.map((m) => m.id);
  const { data } = await supabase
    .from("course_lessons")
    .select("*")
    .in("module_id", moduleIds)
    .order("display_order");
  return (data as CourseLesson[]) ?? [];
}

export async function getLessonById(id: string): Promise<CourseLesson | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("course_lessons")
    .select("*")
    .eq("id", id)
    .single();
  return (data as CourseLesson) ?? null;
}

// ─── Enrollment Stats (for catalog display) ──────────────

export async function getCourseEnrollmentCount(courseId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);
  return count ?? 0;
}

export async function getCourseLessonCount(courseId: string): Promise<number> {
  const modules = await getCourseModules(courseId);
  if (modules.length === 0) return 0;

  const supabase = await createClient();
  const { count } = await supabase
    .from("course_lessons")
    .select("id", { count: "exact", head: true })
    .in("module_id", modules.map((m) => m.id));
  return count ?? 0;
}

// ─── User Enrollment ─────────────────────────────────────

export async function getUserEnrollment(
  userId: string,
  courseId: string
): Promise<Enrollment | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .single();
  return (data as Enrollment) ?? null;
}

export async function getUserEnrollments(userId: string): Promise<
  (Enrollment & { course: Course })[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("*, course:courses(*)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  return (
    (data as (Enrollment & { course: Course })[]) ?? []
  ).filter((e) => e.course && !e.course.deleted_at);
}

export async function getUserLessonCompletions(
  userId: string,
  lessonIds: string[]
): Promise<Set<string>> {
  if (lessonIds.length === 0) return new Set();
  const supabase = await createClient();
  const { data } = await supabase
    .from("lesson_completions")
    .select("lesson_id")
    .eq("user_id", userId)
    .in("lesson_id", lessonIds);
  return new Set((data ?? []).map((d: { lesson_id: string }) => d.lesson_id));
}

// ─── Admin: All Courses ──────────────────────────────────

export async function getAllCourses(): Promise<Course[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return (data as Course[]) ?? [];
}

export async function getCourseById(id: string): Promise<Course | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();
  return (data as Course) ?? null;
}

export async function getCourseEnrollments(courseId: string): Promise<
  (Enrollment & { user: { full_name: string; email: string } })[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("*, user:user_profiles(full_name, email)")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });
  return (data ?? []) as (Enrollment & { user: { full_name: string; email: string } })[];
}
