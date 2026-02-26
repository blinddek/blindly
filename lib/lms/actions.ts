"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { ensureAdmin } from "@/lib/admin/auth";
import { sendEmail } from "@/lib/email";
import { siteConfig } from "@/config/site";
import type { LocalizedString } from "@/types/cms";
import { getCourseLessons } from "./queries";

// ─── Public: Enroll (free courses) ───────────────────────

export async function enrollInCourse(
  courseId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be logged in to enroll." };

  // Check course exists and is free
  const admin = createAdminClient();
  const { data: course } = await admin
    .from("courses")
    .select("id, title, price_cents, is_published")
    .eq("id", courseId)
    .single();

  if (!course || !course.is_published) return { error: "Course not found." };
  if (course.price_cents > 0) return { error: "This is a paid course. Please complete checkout." };

  // Check if already enrolled
  const { data: existing } = await admin
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .single();

  if (existing) return { error: "You are already enrolled in this course." };

  const { error } = await admin.from("enrollments").insert({
    user_id: user.id,
    course_id: courseId,
    progress: 0,
  });

  if (error) return { error: error.message };

  // Send enrollment email
  const courseName = (course.title as { en: string })?.en ?? "Course";
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${siteConfig.domain}`;
  try {
    const { data: profile } = await admin
      .from("user_profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    await sendEmail({
      to: user.email!,
      template: "enrollment_confirmation",
      props: {
        studentName: profile?.full_name ?? "Student",
        courseName,
        courseUrl: `${siteUrl}/portal/courses/${course.id}/learn`,
      },
    });
  } catch (err) {
    console.error("[lms] Failed to send enrollment email:", err);
  }

  revalidatePath("/portal/courses");
  return {};
}

// ─── Public: Mark Lesson Complete ────────────────────────

export async function markLessonComplete(
  lessonId: string,
  courseId: string
): Promise<{ error?: string; progress?: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();

  // Verify enrollment
  const { data: enrollment } = await admin
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .single();

  if (!enrollment) return { error: "You are not enrolled in this course." };

  // Upsert completion
  await admin.from("lesson_completions").upsert(
    { user_id: user.id, lesson_id: lessonId },
    { onConflict: "user_id,lesson_id" }
  );

  // Recalculate progress
  const allLessons = await getCourseLessons(courseId);
  const { data: completions } = await admin
    .from("lesson_completions")
    .select("lesson_id")
    .eq("user_id", user.id)
    .in("lesson_id", allLessons.map((l) => l.id));

  const completedCount = completions?.length ?? 0;
  const totalCount = allLessons.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  await admin
    .from("enrollments")
    .update({
      progress,
      completed_at: progress === 100 ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("course_id", courseId);

  revalidatePath(`/portal/courses/${courseId}/learn`);
  return { progress };
}

// ─── Admin: Course CRUD ──────────────────────────────────

export async function upsertCourse(data: {
  id?: string;
  title: LocalizedString;
  slug: string;
  description?: LocalizedString | null;
  price_cents: number;
  difficulty: string;
  image_url?: string | null;
  is_published?: boolean;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("courses").upsert({
    ...data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/lms");
  revalidatePath("/courses");
}

export async function deleteCourse(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("courses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/lms");
  revalidatePath("/courses");
}

// ─── Admin: Module CRUD ──────────────────────────────────

export async function upsertModule(data: {
  id?: string;
  course_id: string;
  title: LocalizedString;
  display_order: number;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("course_modules").upsert({
    ...data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/lms");
}

export async function deleteModule(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("course_modules").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/lms");
}

// ─── Admin: Lesson CRUD ──────────────────────────────────

export async function upsertLesson(data: {
  id?: string;
  module_id: string;
  title: LocalizedString;
  type: string;
  content?: { en: string; af: string } | null;
  duration_minutes?: number | null;
  is_preview?: boolean;
  display_order: number;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("course_lessons").upsert({
    ...data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/lms");
}

export async function deleteLesson(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("course_lessons").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/lms");
}

// ─── Admin: Enrollment Management ────────────────────────

export async function adminEnrollUser(userId: string, courseId: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("enrollments").upsert(
    { user_id: userId, course_id: courseId, progress: 0 },
    { onConflict: "user_id,course_id" }
  );
  if (error) throw new Error(error.message);
  revalidatePath("/admin/lms");
}

export async function adminUnenrollUser(enrollmentId: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("enrollments").delete().eq("id", enrollmentId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/lms");
}
