import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { isEnabled } from "@/config/features";
import { siteConfig } from "@/config/site";
import { processCampaigns } from "@/lib/campaign-process";
import { processDripEmails } from "@/lib/drip-emails";

const CRON_SECRET = process.env.CRON_SECRET;

// ─── Main handler ────────────────────────────────────────

export async function GET(request: Request) {
  // Auth: Vercel sends Authorization header for cron jobs
  if (CRON_SECRET) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createAdminClient();
  const runStart = Date.now();
  const tasks: Record<string, TaskResult> = {};

  // Run all tasks sequentially, each independently try/caught
  tasks.reminders = await runTask("reminders", () => bookingReminders(supabase));
  tasks.cleanup = await runTask("cleanup", () => staleContactCleanup(supabase));
  tasks.orders = await runTask("orders", () => orderAutoComplete(supabase));
  tasks.campaigns = await runTask("campaigns", () => campaignSteps());
  tasks.drip = await runTask("drip", () => dripEmails());
  tasks.sitemap = await runTask("sitemap", () => sitemapPing(supabase));
  tasks.cronCleanup = await runTask("cron_cleanup", () => cronLogCleanup(supabase));

  // Log each task result to cron_runs
  const totalDuration = Date.now() - runStart;
  for (const [name, result] of Object.entries(tasks)) {
    await supabase.from("cron_runs").insert({
      task_name: name,
      status: result.status,
      summary: result.summary,
      duration_ms: result.durationMs,
    });
  }

  return NextResponse.json({
    ok: true,
    durationMs: totalDuration,
    tasks,
  });
}

// ─── Task runner ─────────────────────────────────────────

interface TaskResult {
  status: "success" | "error" | "skipped";
  summary: Record<string, unknown>;
  durationMs: number;
}

async function runTask(
  name: string,
  fn: () => Promise<{ status?: "skipped"; summary: Record<string, unknown> }>
): Promise<TaskResult> {
  const start = Date.now();
  try {
    const result = await fn();
    return {
      status: result.status === "skipped" ? "skipped" : "success",
      summary: result.summary,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    console.error(`[cron] Task ${name} failed:`, err);
    return {
      status: "error",
      summary: { error: err instanceof Error ? err.message : String(err) },
      durationMs: Date.now() - start,
    };
  }
}

// ─── Task: Booking reminders ─────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function bookingReminders(supabase: any) {
  if (!isEnabled("booking")) {
    return { status: "skipped" as const, summary: { reason: "booking disabled" } };
  }

  // Get current time in site timezone
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Format dates as YYYY-MM-DD for comparison
  const todayStr = toDateString(now, siteConfig.timezone);
  const tomorrowStr = toDateString(tomorrow, siteConfig.timezone);

  // Find confirmed bookings happening today or tomorrow that haven't had reminders sent
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, client_name, client_email, date, start_time, service_id, reminder_sent_at")
    .in("status", ["pending", "confirmed"])
    .is("reminder_sent_at", null)
    .gte("date", todayStr)
    .lte("date", tomorrowStr);

  if (error) throw new Error(`Query failed: ${error.message}`);

  const toSend = bookings ?? [];
  let sent = 0;
  let errors = 0;

  // Get service names for the bookings
  const serviceIds = [...new Set(toSend.map((b: { service_id: string }) => b.service_id))];
  const serviceNames: Record<string, string> = {};
  if (serviceIds.length > 0) {
    const { data: services } = await supabase
      .from("booking_services")
      .select("id, name")
      .in("id", serviceIds);
    for (const s of services ?? []) {
      const name = s.name as { en?: string };
      serviceNames[s.id] = name?.en ?? "Appointment";
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${siteConfig.domain}`;

  for (const booking of toSend) {
    try {
      const serviceName = serviceNames[booking.service_id] ?? "Appointment";
      await sendEmail({
        to: booking.client_email,
        template: "booking_reminder_24h",
        props: {
          clientName: booking.client_name,
          bookingType: serviceName,
          date: booking.date,
          time: booking.start_time,
          portalUrl: `${siteUrl}/portal/bookings`,
        },
      });

      // Mark reminder as sent (idempotent — prevents re-sending)
      await supabase
        .from("bookings")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", booking.id);

      sent++;
    } catch (err) {
      console.error(`[cron] Reminder failed for booking ${booking.id}:`, err);
      errors++;
    }
  }

  return {
    summary: { processed: toSend.length, sent, errors },
  };
}

// ─── Task: Stale contact cleanup ─────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function staleContactCleanup(supabase: any) {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  // Archive read contact submissions older than 90 days
  const { count: archived } = await supabase
    .from("contact_submissions")
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq("read", true)
    .eq("archived", false)
    .lt("created_at", ninetyDaysAgo)
    .select("id", { count: "exact", head: true });

  // Clean up soft-deleted newsletter subscribers older than 90 days
  const { count: deletedSubscribers } = await supabase
    .from("newsletter_subscribers")
    .delete()
    .lt("deleted_at", ninetyDaysAgo)
    .not("deleted_at", "is", null)
    .select("id", { count: "exact", head: true });

  return {
    summary: {
      contactsArchived: archived ?? 0,
      subscribersDeleted: deletedSubscribers ?? 0,
    },
  };
}

// ─── Task: Order auto-complete ───────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function orderAutoComplete(supabase: any) {
  if (!isEnabled("shop")) {
    return { status: "skipped" as const, summary: { reason: "shop disabled" } };
  }

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  // Auto-fulfill orders that have been "paid" for 14+ days
  const { count: completed } = await supabase
    .from("orders")
    .update({ status: "fulfilled", updated_at: new Date().toISOString() })
    .eq("status", "paid")
    .lt("updated_at", fourteenDaysAgo)
    .select("id", { count: "exact", head: true });

  return {
    summary: { autoFulfilled: completed ?? 0 },
  };
}

// ─── Task: Sitemap ping ─────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sitemapPing(supabase: any) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Check if any content was updated in the last 24 hours
  const tables = [
    { table: "blog_posts", enabled: isEnabled("blog") },
    { table: "products", enabled: isEnabled("shop") },
    { table: "portfolio_items", enabled: isEnabled("portfolio") },
    { table: "courses", enabled: isEnabled("lms") },
  ];

  let hasUpdates = false;
  for (const { table, enabled } of tables) {
    if (!enabled) continue;
    const { count } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .gt("updated_at", oneDayAgo);
    if ((count ?? 0) > 0) {
      hasUpdates = true;
      break;
    }
  }

  if (!hasUpdates) {
    return { summary: { pinged: false, reason: "no recent updates" } };
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${siteConfig.domain}`;
  const sitemapUrl = `${siteUrl}/sitemap.xml`;

  try {
    const googleUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    const res = await fetch(googleUrl, { method: "GET" });
    return {
      summary: { pinged: true, googleStatus: res.status },
    };
  } catch (err) {
    return {
      summary: {
        pinged: false,
        error: err instanceof Error ? err.message : "Ping failed",
      },
    };
  }
}

// ─── Task: Cron log cleanup ─────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function cronLogCleanup(supabase: any) {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { count: deleted } = await supabase
    .from("cron_runs")
    .delete()
    .lt("created_at", ninetyDaysAgo)
    .select("id", { count: "exact", head: true });

  return {
    summary: { oldRunsDeleted: deleted ?? 0 },
  };
}

// ─── Task: Campaign steps (multi-step sequences) ────────

async function campaignSteps() {
  if (!isEnabled("emailCampaigns")) {
    return { status: "skipped" as const, summary: { reason: "emailCampaigns disabled" } };
  }

  const result = await processCampaigns();
  return { summary: result as unknown as Record<string, unknown> };
}

// ─── Task: Drip emails (onboarding + newsletter) ────────

async function dripEmails() {
  if (!isEnabled("dripEmails")) {
    return { status: "skipped" as const, summary: { reason: "dripEmails disabled" } };
  }

  const result = await processDripEmails();
  return { summary: result as unknown as Record<string, unknown> };
}

// ─── Helpers ─────────────────────────────────────────────

function toDateString(date: Date, timezone: string): string {
  return date.toLocaleDateString("en-CA", { timeZone: timezone }); // en-CA gives YYYY-MM-DD
}
