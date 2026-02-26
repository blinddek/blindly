import { createAdminClient } from "@/lib/supabase/admin";
import type { ContactSubmission, NewsletterSubscriber, BlogPost, PortfolioItem, ActivityLogEntry } from "@/types";

// ---------- Dashboard Stats ----------

export interface DashboardStats {
  contactCount: number;
  unreadContactCount: number;
  newsletterCount: number;
  blogCount: number;
  portfolioCount: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const admin = createAdminClient();

  const [contactRes, unreadRes, newsletterRes, blogRes, portfolioRes] =
    await Promise.all([
      admin
        .from("contact_submissions")
        .select("id", { count: "exact", head: true })
        .eq("archived", false),
      admin
        .from("contact_submissions")
        .select("id", { count: "exact", head: true })
        .eq("read", false)
        .eq("archived", false),
      admin
        .from("newsletter_subscribers")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),
      admin
        .from("blog_posts")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true)
        .is("deleted_at", null),
      admin
        .from("portfolio_items")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true)
        .is("deleted_at", null),
    ]);

  return {
    contactCount: contactRes.count ?? 0,
    unreadContactCount: unreadRes.count ?? 0,
    newsletterCount: newsletterRes.count ?? 0,
    blogCount: blogRes.count ?? 0,
    portfolioCount: portfolioRes.count ?? 0,
  };
}

// ---------- Contact Submissions ----------

export async function getContactSubmissions(): Promise<ContactSubmission[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("contact_submissions")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getContactSubmissions]", error.message);
    return [];
  }
  return (data ?? []) as ContactSubmission[];
}

// ---------- Newsletter Subscribers ----------

export async function getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("newsletter_subscribers")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getNewsletterSubscribers]", error.message);
    return [];
  }
  return (data ?? []) as NewsletterSubscriber[];
}

// ---------- Blog Posts (Admin) ----------

export async function getAdminBlogPosts(): Promise<BlogPost[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("blog_posts")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getAdminBlogPosts]", error.message);
    return [];
  }
  return (data ?? []) as BlogPost[];
}

// ---------- Portfolio Items (Admin) ----------

export async function getAdminPortfolioItems(): Promise<PortfolioItem[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("portfolio_items")
    .select("*")
    .is("deleted_at", null)
    .order("display_order");

  if (error) {
    console.error("[getAdminPortfolioItems]", error.message);
    return [];
  }
  return (data ?? []) as PortfolioItem[];
}

// ---------- Activity Log ----------

export async function getActivityLog(limit = 50): Promise<ActivityLogEntry[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getActivityLog]", error.message);
    return [];
  }
  return (data ?? []) as ActivityLogEntry[];
}

// ---------- Cron Runs ----------

export interface CronRun {
  id: string;
  task_name: string;
  status: "success" | "error" | "skipped";
  summary: Record<string, unknown>;
  duration_ms: number | null;
  created_at: string;
}

/** Get the most recent run for each task */
export async function getLastCronRuns(): Promise<CronRun[]> {
  const admin = createAdminClient();
  // Get distinct task names with their latest run
  const { data, error } = await admin
    .from("cron_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[getLastCronRuns]", error.message);
    return [];
  }

  // Deduplicate to latest per task
  const seen = new Set<string>();
  const latest: CronRun[] = [];
  for (const run of (data ?? []) as CronRun[]) {
    if (!seen.has(run.task_name)) {
      seen.add(run.task_name);
      latest.push(run);
    }
  }
  return latest;
}

// ---------- Site Settings ----------

export async function getSiteSettings(): Promise<Record<string, unknown>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("site_content")
    .select("content")
    .eq("section_key", "site_settings")
    .single();

  return (data?.content as Record<string, unknown>) ?? {};
}
