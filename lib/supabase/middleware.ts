import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  COOKIE_OPTIONS,
  ADMIN_INACTIVITY_SECONDS,
  ADMIN_ACTIVITY_COOKIE,
} from "./config";
import { isEnabled } from "@/config/features";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — this keeps the auth token alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Admin inactivity check — separate from the Supabase session.
  // The y-admin-active cookie is ONLY refreshed on /admin routes, so browsing
  // the public site does NOT reset the admin idle timer.
  if (user && pathname.startsWith("/admin")) {
    const now = Date.now();
    const activeUntilStr = request.cookies.get(ADMIN_ACTIVITY_COOKIE)?.value;

    if (activeUntilStr && Number.parseInt(activeUntilStr, 10) < now) {
      // Cookie exists but is expired — admin was idle too long, force sign-out
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("reason", "admin_idle");
      const response = NextResponse.redirect(url);
      // Delete Supabase auth cookies so the login redirect isn't bounced back
      request.cookies
        .getAll()
        .filter((c) => c.name.startsWith("sb-"))
        .forEach((c) => response.cookies.delete(c.name));
      response.cookies.delete(ADMIN_ACTIVITY_COOKIE);
      return response;
    }

    // Set or refresh the admin activity cookie (admin-only path, not reset by public pages)
    supabaseResponse.cookies.set(
      ADMIN_ACTIVITY_COOKIE,
      String(now + ADMIN_INACTIVITY_SECONDS * 1000),
      {
        maxAge: ADMIN_INACTIVITY_SECONDS,
        path: "/admin",
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
      }
    );
  }

  // Authenticated users visiting auth pages → send to /portal
  // (Portal layout will redirect admins to /admin based on DB role)
  if (
    user &&
    (pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/forgot-password"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Protected routes — redirect to login if not authenticated
  if (!user && pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Portal protection — only when customerAuth is enabled
  if (!user && pathname.startsWith("/portal")) {
    if (isEnabled("customerAuth")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    // customerAuth disabled — portal routes don't exist, redirect home
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Role-based routing is handled by layouts (not middleware)
  // to avoid JWT/DB role disagreements causing redirect loops.
  // See: app/portal/layout.tsx (redirects admins → /admin)
  // See: app/admin/layout.tsx (redirects non-admins → /portal)

  return supabaseResponse;
}
