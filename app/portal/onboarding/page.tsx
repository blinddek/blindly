"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { completeOnboarding } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState = {
  error: undefined as string | undefined,
  success: undefined as boolean | undefined,
};

export default function OnboardingPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    completeOnboarding,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      router.push("/portal");
    }
  }, [state.success, router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome!</CardTitle>
          <CardDescription>
            Let&apos;s get your account set up. You can always update these
            details later in your account settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-6">
            {/* Intake questions would be dynamically rendered here based on
                admin-configured questions stored in the database.
                For now, we provide a simple "get started" flow. */}
            <input type="hidden" name="responses" value="{}" />

            <div className="rounded-md border p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Your account is ready to go. Click below to start using the
                portal.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Get started"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
