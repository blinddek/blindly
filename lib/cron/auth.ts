// lib/cron/auth.ts
// Shared CRON_SECRET verification for all cron API routes.
// Vercel injects Authorization: Bearer <CRON_SECRET> automatically for cron jobs.

import { NextResponse, type NextRequest } from "next/server";

/**
 * Verify the cron request has a valid CRON_SECRET bearer token.
 * Returns null if valid, or a 401/500 NextResponse if invalid.
 */
export function verifyCronAuth(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken) {
    console.error("[cron] CRON_SECRET env variable is not set");
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
