import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 1x1 transparent GIF (43 bytes)
const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(request: NextRequest) {
  const trackingId = request.nextUrl.searchParams.get("t");

  if (trackingId) {
    // Fire-and-forget: don't block the pixel response
    const admin = createAdminClient();
    (async () => {
      try {
        // Increment open count
        await admin.rpc("increment_email_opens", {
          p_tracking_id: trackingId,
        });
      } catch {
        // Silently ignore — tracking should never break the email
      }
    })();
  }

  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(TRANSPARENT_GIF.length),
      "Cache-Control":
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
