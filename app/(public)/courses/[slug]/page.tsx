import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import {
  getCourseBySlug,
  getCourseModules,
  getCourseLessons,
  getCourseEnrollmentCount,
} from "@/lib/lms/queries";
import { formatPrice } from "@/lib/shop/format";
import { courseSchema } from "@/lib/seo/structured-data";
import { siteConfig } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  Clock,
  Users,
  PlayCircle,
  FileText,
  CheckCircle,
  Lock,
} from "lucide-react";
import { EnrollButton } from "./enroll-button";

interface CourseDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CourseDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return {};

  const url = `${process.env.NEXT_PUBLIC_APP_URL || `https://${siteConfig.domain}`}/courses/${slug}`;

  return {
    title: `${course.title.en} | ${siteConfig.name}`,
    description:
      course.description?.en ?? `Learn ${course.title.en} — ${course.difficulty} level course`,
    openGraph: {
      title: course.title.en,
      description: course.description?.en ?? undefined,
      url,
      images: course.image_url ? [{ url: course.image_url }] : undefined,
    },
  };
}

const lessonIcons: Record<string, React.ReactNode> = {
  text: <FileText className="h-4 w-4" />,
  video: <PlayCircle className="h-4 w-4" />,
  quiz: <CheckCircle className="h-4 w-4" />,
  assignment: <BookOpen className="h-4 w-4" />,
};

export default async function CourseDetailPage({
  params,
}: CourseDetailProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const [modules, allLessons, enrollmentCount] = await Promise.all([
    getCourseModules(course.id),
    getCourseLessons(course.id),
    getCourseEnrollmentCount(course.id),
  ]);

  // Group lessons by module
  const lessonsByModule: Record<string, typeof allLessons> = {};
  for (const lesson of allLessons) {
    if (!lessonsByModule[lesson.module_id]) lessonsByModule[lesson.module_id] = [];
    lessonsByModule[lesson.module_id].push(lesson);
  }

  const totalDuration = allLessons.reduce(
    (sum, l) => sum + (l.duration_minutes ?? 0),
    0
  );

  const jsonLd = courseSchema({
    name: course.title.en,
    description: course.description?.en,
    price_cents: course.price_cents,
    image: course.image_url,
    slug: course.slug,
  });

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-16 md:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid gap-10 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero */}
          {course.image_url && (
            <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
              <Image
                src={course.image_url}
                alt={course.title.en}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="secondary">{course.difficulty}</Badge>
              {course.price_cents === 0 && <Badge variant="outline">Free</Badge>}
            </div>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">
              {course.title.en}
            </h1>
            {course.description && (
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {course.description.en}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {allLessons.length} lessons
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {totalDuration > 0 ? `${totalDuration} min` : "Self-paced"}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {enrollmentCount} enrolled
            </span>
          </div>

          {/* Curriculum */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Curriculum</h2>
            {modules.length === 0 ? (
              <p className="text-muted-foreground">
                Curriculum coming soon.
              </p>
            ) : (
              modules.map((mod) => {
                const moduleLessons = lessonsByModule[mod.id] ?? [];
                return (
                  <Card key={mod.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{mod.title.en}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {moduleLessons.length} lessons
                      </p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {moduleLessons.map((lesson) => (
                          <li
                            key={lesson.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="flex items-center gap-2">
                              {lessonIcons[lesson.type] ?? <FileText className="h-4 w-4" />}
                              <span className={lesson.is_preview ? "text-foreground" : "text-muted-foreground"}>
                                {lesson.title.en}
                              </span>
                              {lesson.is_preview && (
                                <Badge variant="outline" className="text-xs">
                                  Preview
                                </Badge>
                              )}
                            </span>
                            <span className="flex items-center gap-2 text-muted-foreground">
                              {lesson.duration_minutes && (
                                <span>{lesson.duration_minutes} min</span>
                              )}
                              {!lesson.is_preview && (
                                <Lock className="h-3.5 w-3.5" />
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar: Enrollment */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="text-center">
                  {course.price_cents === 0 ? (
                    <p className="text-3xl font-bold text-foreground">Free</p>
                  ) : (
                    <p className="text-3xl font-bold text-foreground">
                      {formatPrice(course.price_cents)}
                    </p>
                  )}
                </div>

                <EnrollButton
                  courseId={course.id}
                  courseSlug={course.slug}
                  priceCents={course.price_cents}
                />

                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {allLessons.length} lessons across {modules.length} modules
                  </li>
                  {totalDuration > 0 && (
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {totalDuration} minutes of content
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {enrollmentCount} students enrolled
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
