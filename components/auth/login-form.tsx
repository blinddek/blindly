"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isEnabled } from "@/config/features";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackError = searchParams.get("error");
  const reason = searchParams.get("reason");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Show admin idle toast on mount
  useEffect(() => {
    if (reason === "admin_idle") {
      toast.info("You were signed out due to inactivity.");
      // Clean the URL param
      const url = new URL(globalThis.location.href);
      url.searchParams.delete("reason");
      globalThis.history.replaceState({}, "", url.toString());
    }
  }, [reason]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const supabase = createClient();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setIsPending(false);
        return;
      }

      // Role detection — server-side lookup
      const res = await fetch("/api/auth/role");
      const { role } = await res.json();

      if (role === "admin") {
        router.push("/admin");
      } else if (role === "customer") {
        router.push("/portal");
      } else {
        // Unknown role — sign out and show error
        await supabase.auth.signOut();
        setError("Your account does not have an assigned role. Please contact support.");
        setIsPending(false);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsPending(false);
    }
  }

  const showRegisterLink = isEnabled("customerAuth");

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
      </CardHeader>
      <CardContent>
        {callbackError && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Authentication failed. Please try again.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              disabled={isPending}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              disabled={isPending}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        {showRegisterLink && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-foreground underline hover:no-underline">
              Create one
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
