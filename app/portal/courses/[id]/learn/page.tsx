import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getCourseById,
  getCourseModules,
  getCourseLessons,
  getUserEnrollment,
  getUserLessonCompletions,
  getLessonById,
} from "@/lib/lms/queries";
import { CourseSidebar } from "./course-sidebar";
import { LessonContent } from "./lesson-content";

interface LearnPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lesson?: string }>;
}

export default async function CourseLearnPage({
  params,
  searchParams,
}: LearnPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id: courseId } = await params;
  const { lesson: lessonId } = await searchParams;

  const course = await getCourseById(courseId);
  if (!course) notFound();

  const enrollment = await getUserEnrollment(user.id, courseId);
  if (!enrollment) redirect(`/courses/${course.slug}`);

  const [modules, allLessons] = await Promise.all([
    getCourseModules(courseId),
    getCourseLessons(courseId),
  ]);

  const completedLessonIds = await getUserLessonCompletions(
    user.id,
    allLessons.map((l) => l.id)
  );

  // Determine current lesson
  let currentLesson = lessonId ? await getLessonById(lessonId) : null;
  if (!currentLesson && allLessons.length > 0) {
    // Find first incomplete lesson or default to first lesson
    const firstIncomplete = allLessons.find((l) => !completedLessonIds.has(l.id));
    currentLesson = firstIncomplete ?? allLessons[0];
  }

  // Group lessons by module
  const lessonsByModule: Record<string, typeof allLessons> = {};
  for (const lesson of allLessons) {
    if (!lessonsByModule[lesson.module_id]) lessonsByModule[lesson.module_id] = [];
    lessonsByModule[lesson.module_id].push(lesson);
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] -mx-4 -mt-4 md:-mx-8 md:-mt-8">
      {/* Curriculum sidebar */}
      <CourseSidebar
        courseId={courseId}
        courseName={course.title.en}
        modules={modules}
        lessonsByModule={lessonsByModule}
        completedLessonIds={Array.from(completedLessonIds)}
        currentLessonId={currentLesson?.id ?? null}
        progress={enrollment.progress}
      />

      {/* Lesson content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        {currentLesson ? (
          <LessonContent
            lesson={currentLesson}
            courseId={courseId}
            isCompleted={completedLessonIds.has(currentLesson.id)}
            allLessons={allLessons}
          />
        ) : (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-lg font-medium text-foreground">
                No lessons available yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Check back soon — the instructor is adding content.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
