"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4 text-center text-neutral-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-red-400"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-3 max-w-md text-neutral-400">
          A critical error occurred. Please try refreshing the page.
        </p>
        <button
          onClick={reset}
          className="mt-8 rounded-md bg-neutral-100 px-6 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200"
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
