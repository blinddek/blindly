import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getUserEnrollments } from "@/lib/lms/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowRight, BookOpen } from "lucide-react";

export default async function PortalCoursesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const enrollments = await getUserEnrollments(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
          <p className="text-sm text-muted-foreground">
            Continue learning where you left off.
          </p>
        </div>
        <Link href="/courses">
          <Button size="sm">Browse Courses</Button>
        </Link>
      </div>

      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <GraduationCap className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium text-foreground">No courses yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse our course catalog and start learning.
              </p>
            </div>
            <Link href="/courses">
              <Button variant="outline" size="sm">
                Browse Courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => {
            const course = enrollment.course;
            return (
              <Link
                key={enrollment.id}
                href={`/portal/courses/${course.id}/learn`}
              >
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
                      <BookOpen className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                  )}
                  <CardContent className="space-y-3 p-4">
                    <h3 className="font-semibold text-foreground line-clamp-2">
                      {course.title.en}
                    </h3>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{enrollment.progress}% complete</span>
                        {enrollment.completed_at && (
                          <Badge variant="secondary" className="text-xs">
                            Completed
                          </Badge>
                        )}
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                    </div>

                    <Button variant="outline" size="sm" className="w-full">
                      {enrollment.progress === 0
                        ? "Start Learning"
                        : enrollment.completed_at
                          ? "Review"
                          : "Continue"}
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
