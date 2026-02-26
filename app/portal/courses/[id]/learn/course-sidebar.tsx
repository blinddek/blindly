"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  FileText,
  PlayCircle,
  BookOpen,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CourseModule, CourseLesson } from "@/lib/lms/queries";

interface CourseSidebarProps {
  courseId: string;
  courseName: string;
  modules: CourseModule[];
  lessonsByModule: Record<string, CourseLesson[]>;
  completedLessonIds: string[];
  currentLessonId: string | null;
  progress: number;
}

const lessonIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  text: FileText,
  video: PlayCircle,
  quiz: CheckCircle2,
  assignment: BookOpen,
};

export function CourseSidebar({
  courseId,
  courseName,
  modules,
  lessonsByModule,
  completedLessonIds,
  currentLessonId,
  progress,
}: CourseSidebarProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
    // Expand module containing current lesson
    if (currentLessonId) {
      for (const [moduleId, lessons] of Object.entries(lessonsByModule)) {
        if (lessons.some((l) => l.id === currentLessonId)) {
          return new Set([moduleId]);
        }
      }
    }
    return new Set(modules.length > 0 ? [modules[0].id] : []);
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const completedSet = new Set(completedLessonIds);

  function toggleModule(id: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const sidebarContent = (
    <>
      <div className="border-b p-4">
        <Link
          href="/portal/courses"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Courses
        </Link>
        <h2 className="mt-2 text-sm font-semibold text-foreground line-clamp-2">
          {courseName}
        </h2>
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress}% complete</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {modules.map((mod) => {
          const lessons = lessonsByModule[mod.id] ?? [];
          const expanded = expandedModules.has(mod.id);
          const moduleComplete = lessons.length > 0 && lessons.every((l) => completedSet.has(l.id));

          return (
            <div key={mod.id} className="mb-1">
              <button
                type="button"
                onClick={() => toggleModule(mod.id)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                {expanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
                <span className="flex-1 text-left line-clamp-1">{mod.title.en}</span>
                {moduleComplete && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                )}
              </button>

              {expanded && (
                <ul className="ml-4 space-y-0.5 pb-1">
                  {lessons.map((lesson) => {
                    const Icon = lessonIcons[lesson.type] ?? FileText;
                    const isActive = lesson.id === currentLessonId;
                    const isCompleted = completedSet.has(lesson.id);

                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/portal/courses/${courseId}/learn?lesson=${lesson.id}`}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                            isActive
                              ? "bg-primary/10 font-medium text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="line-clamp-1">{lesson.title.en}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col border-r bg-sidebar md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-4 left-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:hidden"
        aria-label="Open curriculum"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar shadow-xl md:hidden">
            <div className="flex h-12 items-center justify-end border-b px-3">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
