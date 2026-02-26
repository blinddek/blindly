import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteConfig } from "@/config/site";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse(
      renderPage("Invalid Link", "This unsubscribe link is invalid."),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("user_profiles")
    .select("id, email, email_opt_out")
    .eq("unsubscribe_token", token)
    .single();

  if (!profile) {
    return new NextResponse(
      renderPage(
        "Invalid Link",
        "This unsubscribe link is invalid or has expired."
      ),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  if (profile.email_opt_out) {
    return new NextResponse(
      renderPage(
        "Already Unsubscribed",
        "You have already been unsubscribed from marketing emails."
      ),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  await admin
    .from("user_profiles")
    .update({ email_opt_out: true })
    .eq("id", profile.id);

  return new NextResponse(
    renderPage(
      "Unsubscribed",
      "You have been unsubscribed from marketing emails. You will still receive essential emails about your account, orders, and bookings."
    ),
    { headers: { "Content-Type": "text/html" } }
  );
}

function renderPage(title: string, message: string): string {
  const primary = siteConfig.brand.primary;
  const name = siteConfig.name;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} - ${name}</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;color:#333}
.card{background:#fff;border-radius:8px;padding:48px;max-width:480px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.1)}
h1{color:${primary};margin:0 0 16px;font-size:24px}p{color:#555;line-height:1.6}
a{color:${primary};text-decoration:none;font-weight:600}</style></head>
<body><div class="card"><h1>${title}</h1><p>${message}</p><p style="margin-top:24px"><a href="/">Back to ${name}</a></p></div></body></html>`;
}
