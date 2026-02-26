"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markLessonComplete } from "@/lib/lms/actions";
import { markdownToHtml } from "@/lib/markdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, ArrowRight, PlayCircle } from "lucide-react";
import type { CourseLesson } from "@/lib/lms/queries";

interface LessonContentProps {
  lesson: CourseLesson;
  courseId: string;
  isCompleted: boolean;
  allLessons: CourseLesson[];
}

export function LessonContent({
  lesson,
  courseId,
  isCompleted,
  allLessons,
}: LessonContentProps) {
  const [completed, setCompleted] = useState(isCompleted);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Find next lesson
  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1
    ? allLessons[currentIndex + 1]
    : null;

  async function handleMarkComplete() {
    setLoading(true);
    const result = await markLessonComplete(lesson.id, courseId);
    if (!result.error) {
      setCompleted(true);
    }
    setLoading(false);
    router.refresh();
  }

  function handleNextLesson() {
    if (nextLesson) {
      router.push(`/portal/courses/${courseId}/learn?lesson=${nextLesson.id}`);
    }
  }

  const lessonTypeLabels: Record<string, string> = {
    text: "Reading",
    video: "Video",
    quiz: "Quiz",
    assignment: "Assignment",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Lesson header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline">{lessonTypeLabels[lesson.type] ?? lesson.type}</Badge>
          {lesson.duration_minutes && (
            <span className="text-xs text-muted-foreground">
              {lesson.duration_minutes} min
            </span>
          )}
          {completed && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Completed
            </Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold text-foreground">{lesson.title.en}</h1>
      </div>

      {/* Lesson body */}
      {lesson.type === "text" && lesson.content?.en && (
        <div
          className="prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(lesson.content.en) }}
        />
      )}

      {lesson.type === "video" && lesson.content?.en && (
        <div className="space-y-4">
          {isVideoEmbed(lesson.content.en) ? (
            <div className="relative aspect-video overflow-hidden rounded-lg">
              <iframe
                src={lesson.content.en}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={lesson.title.en}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-lg border bg-muted p-8">
              <PlayCircle className="h-12 w-12 text-muted-foreground" />
              <a
                href={lesson.content.en}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Open Video
              </a>
            </div>
          )}
        </div>
      )}

      {lesson.type === "quiz" && (
        <div className="rounded-lg border bg-muted/50 p-8 text-center">
          <p className="text-muted-foreground">
            Quiz content will be displayed here.
          </p>
        </div>
      )}

      {lesson.type === "assignment" && (
        <div className="rounded-lg border bg-muted/50 p-8 text-center">
          <p className="text-muted-foreground">
            Assignment details will be displayed here.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 border-t pt-6">
        {!completed && (
          <Button onClick={handleMarkComplete} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Mark as Complete
          </Button>
        )}
        {nextLesson && (
          <Button
            variant={completed ? "default" : "outline"}
            onClick={handleNextLesson}
          >
            Next Lesson
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
        {!nextLesson && completed && (
          <p className="text-sm text-green-600 font-medium">
            You&apos;ve completed all lessons in this course!
          </p>
        )}
      </div>
    </div>
  );
}

function isVideoEmbed(url: string): boolean {
  return (
    url.includes("youtube.com/embed") ||
    url.includes("player.vimeo.com") ||
    url.includes("youtube-nocookie.com/embed")
  );
}
