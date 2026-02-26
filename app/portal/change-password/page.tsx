"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { changeInitialPassword } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function ChangePasswordPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    changeInitialPassword,
    initialState
  );
  const [clientError, setClientError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (state.success) {
      router.push("/portal");
    }
  }, [state.success, router]);

  function handleSubmit(formData: FormData) {
    setClientError(null);

    if (password.length < 8) {
      setClientError("Password must be at least 8 characters.");
      return;
    }

    if (!/\d/.test(password)) {
      setClientError("Password must contain at least 1 number.");
      return;
    }

    if (password !== confirmPassword) {
      setClientError("Passwords do not match.");
      return;
    }

    formAction(formData);
  }

  const displayError = clientError ?? state.error;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Set your password</CardTitle>
          <CardDescription>
            For your security, please create a new password before continuing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayError && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {displayError}
            </div>
          )}

          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">New password</Label>
              <Input
                id="new_password"
                name="new_password"
                type="password"
                placeholder="At least 8 characters"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setClientError(null);
                }}
                autoComplete="new-password"
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters with at least 1 number.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm password</Label>
              <Input
                id="confirm_password"
                name="confirm_password"
                type="password"
                placeholder="Re-enter your password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setClientError(null);
                }}
                autoComplete="new-password"
                disabled={isPending}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting password...
                </>
              ) : (
                "Set password and continue"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
