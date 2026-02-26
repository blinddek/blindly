import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteConfig } from "@/config/site";

export async function GET(request: NextRequest) {
  const trackingId = request.nextUrl.searchParams.get("t");
  const encodedUrl = request.nextUrl.searchParams.get("url");

  if (!encodedUrl) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 }
    );
  }

  const targetUrl = decodeURIComponent(encodedUrl);

  // Validate URL safety
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json(
      { error: "Invalid protocol" },
      { status: 400 }
    );
  }

  // Allow site domain and any external HTTPS URLs
  const siteDomain = siteConfig.domain;
  const isOwnDomain =
    parsed.hostname === siteDomain ||
    parsed.hostname.endsWith(`.${siteDomain}`) ||
    parsed.hostname === "localhost";

  if (!isOwnDomain && parsed.protocol !== "https:") {
    return NextResponse.json(
      { error: "Untrusted URL" },
      { status: 400 }
    );
  }

  if (trackingId) {
    const admin = createAdminClient();
    (async () => {
      try {
        await admin.rpc("increment_email_clicks", {
          p_tracking_id: trackingId,
        });
      } catch {
        // Silently ignore
      }
    })();
  }

  return NextResponse.redirect(targetUrl, 302);
}
