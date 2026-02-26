import Link from "next/link";
import Image from "next/image";
import { generatePageMetadata } from "@/lib/seo/metadata";
import { getPublishedCourses } from "@/lib/lms/queries";
import { formatPrice } from "@/lib/shop/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export async function generateMetadata() {
  return generatePageMetadata("courses");
}

const difficultyColors: Record<string, "default" | "secondary" | "outline"> = {
  beginner: "secondary",
  intermediate: "default",
  advanced: "destructive" as "default",
};

export default async function CoursesPage() {
  const courses = await getPublishedCourses();

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-16 md:px-8">
      <h1 className="text-3xl font-bold text-foreground md:text-4xl">Courses</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Browse our courses and start learning today.
      </p>

      {courses.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">
          No courses available yet. Check back soon!
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.slug}`}>
              <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg">
                {course.image_url ? (
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <Image
                      src={course.image_url}
                      alt={course.title.en}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-muted">
                    <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center gap-2">
                    <Badge variant={difficultyColors[course.difficulty] ?? "outline"}>
                      {course.difficulty}
                    </Badge>
                    {course.price_cents === 0 ? (
                      <Badge variant="secondary">Free</Badge>
                    ) : (
                      <span className="text-sm font-semibold text-foreground">
                        {formatPrice(course.price_cents)}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-foreground line-clamp-2">
                    {course.title.en}
                  </h2>
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description.en}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
