"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { enrollInCourse } from "@/lib/lms/actions";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface EnrollButtonProps {
  courseId: string;
  courseSlug: string;
  priceCents: number;
}

export function EnrollButton({ courseId, courseSlug, priceCents }: EnrollButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleEnroll() {
    setLoading(true);
    setError(null);

    if (priceCents > 0) {
      // Paid course — redirect to checkout API
      try {
        const res = await fetch("/api/lms/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId }),
        });
        const data = await res.json();

        if (data.error) {
          setError(data.error);
          setLoading(false);
          return;
        }

        if (data.payfast) {
          const form = document.createElement("form");
          form.method = "POST";
          form.action = data.payfast.action;
          for (const [key, val] of Object.entries(data.payfast.fields)) {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = key;
            input.value = val as string;
            form.appendChild(input);
          }
          document.body.appendChild(form);
          form.submit();
          return;
        }
      } catch {
        setError("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
    } else {
      // Free course — direct enrollment
      const result = await enrollInCourse(courseId);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      router.push(`/portal/courses/${courseSlug}/learn`);
    }
  }

  return (
    <div className="space-y-2">
      <Button className="w-full" size="lg" onClick={handleEnroll} disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {priceCents > 0 ? "Enroll Now" : "Start Learning — Free"}
      </Button>
      {error && <p className="text-sm text-destructive text-center">{error}</p>}
    </div>
  );
}
