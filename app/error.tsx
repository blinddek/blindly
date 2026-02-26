"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="h-14 w-14 text-destructive/70" />
      <h1 className="mt-6 text-3xl font-bold tracking-tight">
        Something went wrong on our end.
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Your data is safe — this is a temporary issue. Try refreshing the page
        in a moment.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">
            Go home <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/contact">
            Contact us <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
      {error.digest && (
        <p className="mt-8 text-xs text-muted-foreground">
          Error reference: {error.digest}
        </p>
      )}
    </div>
  );
}
