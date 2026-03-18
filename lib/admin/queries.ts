import { createAdminClient } from "@/lib/supabase/admin";
import type { ContactSubmission, NewsletterSubscriber, BlogPost, PortfolioItem, ActivityLogEntry } from "@/types";
import type { BlindlyOrder, BlindlyOrderWithItems, BlindlyOrderItem } from "@/types/blinds";

// ---------- Blindly Shop Dashboard ----------

export interface BlindsShopStats {
  totalOrders: number;
  paidRevenueCents: number;
  revenueThisMonthCents: number;
  ordersThisMonth: number;
  inProgressCount: number;       // confirmed → ordered_from_supplier → shipped
  awaitingInstallCount: number;  // delivered, professional_install
  newUnpickedCount: number;      // paid but still "new" — needs attention
}

export interface MonthlyRevenue {
  month: number;        // 1–12
  revenue_cents: number;
  order_count: number;
}

export interface TopBlindRange {
  range_name: string;
  item_count: number;
}

export interface RecentBlindlyOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total_cents: number;
  payment_status: string;
  order_status: string;
  created_at: string;
}

export async function getBlindsShopStats(): Promise<BlindsShopStats> {
  const admin = createAdminClient();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [totalRes, paidRes, paidMonthRes, ordersMonthRes, inProgressRes, awaitRes, newPaidRes] =
    await Promise.all([
      admin.from("blindly_orders").select("id", { count: "exact", head: true }),
      admin.from("blindly_orders").select("total_cents").eq("payment_status", "paid"),
      admin.from("blindly_orders").select("total_cents").eq("payment_status", "paid").gte("created_at", monthStart),
      admin.from("blindly_orders").select("id", { count: "exact", head: true }).gte("created_at", monthStart),
      admin.from("blindly_orders").select("id", { count: "exact", head: true })
        .in("order_status", ["confirmed", "ordered_from_supplier", "shipped"]).eq("payment_status", "paid"),
      admin.from("blindly_orders").select("id", { count: "exact", head: true })
        .eq("order_status", "delivered").eq("delivery_type", "professional_install"),
      admin.from("blindly_orders").select("id", { count: "exact", head: true })
        .eq("payment_status", "paid").eq("order_status", "new"),
    ]);

  const sum = (rows: { total_cents: number }[] | null) =>
    (rows ?? []).reduce((s, r) => s + (r.total_cents ?? 0), 0);

  return {
    totalOrders: totalRes.count ?? 0,
    paidRevenueCents: sum(paidRes.data),
    revenueThisMonthCents: sum(paidMonthRes.data),
    ordersThisMonth: ordersMonthRes.count ?? 0,
    inProgressCount: inProgressRes.count ?? 0,
    awaitingInstallCount: awaitRes.count ?? 0,
    newUnpickedCount: newPaidRes.count ?? 0,
  };
}

export async function getMonthlyRevenue(year: number): Promise<MonthlyRevenue[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blindly_orders")
    .select("total_cents, created_at")
    .eq("payment_status", "paid")
    .gte("created_at", `${year}-01-01T00:00:00.000Z`)
    .lt("created_at", `${year + 1}-01-01T00:00:00.000Z`);

  const months: MonthlyRevenue[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    revenue_cents: 0,
    order_count: 0,
  }));

  for (const row of (data ?? []) as { total_cents: number; created_at: string }[]) {
    const m = new Date(row.created_at).getMonth();
    months[m].revenue_cents += row.total_cents ?? 0;
    months[m].order_count += 1;
  }
  return months;
}

export async function getTopBlindRanges(limit = 6): Promise<TopBlindRange[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blindly_order_items")
    .select("blind_range_id");

  if (!data?.length) return [];

  const counts = new Map<string, number>();
  for (const item of data) {
    counts.set(item.blind_range_id, (counts.get(item.blind_range_id) ?? 0) + 1);
  }

  const topIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  const { data: ranges } = await admin
    .from("blind_ranges")
    .select("id, name")
    .in("id", topIds);

  const nameMap = new Map((ranges ?? []).map((r) => [r.id, r.name as string]));

  return topIds.map((id) => ({
    range_name: nameMap.get(id) ?? "Unknown",
    item_count: counts.get(id) ?? 0,
  }));
}

export async function getRecentBlindlyOrders(limit = 8): Promise<RecentBlindlyOrder[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blindly_orders")
    .select("id, order_number, customer_name, total_cents, payment_status, order_status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as RecentBlindlyOrder[];
}

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

// ---------- Blindly Orders (Admin) ----------

export async function getAllBlindlyOrders(): Promise<BlindlyOrder[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("blindly_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getAllBlindlyOrders]", error.message);
    return [];
  }
  return (data ?? []) as BlindlyOrder[];
}

export async function getBlindlyOrderWithItems(
  orderId: string
): Promise<BlindlyOrderWithItems | null> {
  const admin = createAdminClient();

  const { data: order, error: orderError } = await admin
    .from("blindly_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    console.error("[getBlindlyOrderWithItems]", orderError?.message);
    return null;
  }

  const { data: items, error: itemsError } = await admin
    .from("blindly_order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("display_order");

  if (itemsError) {
    console.error("[getBlindlyOrderWithItems] items", itemsError.message);
  }

  // Fetch range names for each item
  const rangeIds = [...new Set((items ?? []).map((i: BlindlyOrderItem) => i.blind_range_id))];
  let rangeNameMap = new Map<string, string>();
  if (rangeIds.length > 0) {
    const { data: ranges } = await admin
      .from("blind_ranges")
      .select("id, name, blind_type_id")
      .in("id", rangeIds);

    if (ranges?.length) {
      const typeIds = [...new Set(ranges.map((r: { blind_type_id: string }) => r.blind_type_id))];
      const { data: types } = await admin
        .from("blind_types")
        .select("id, name")
        .in("id", typeIds);
      const typeNameMap = new Map((types ?? []).map((t: { id: string; name: string }) => [t.id, t.name]));

      rangeNameMap = new Map(
        ranges.map((r: { id: string; name: string; blind_type_id: string }) => [
          r.id,
          `${typeNameMap.get(r.blind_type_id) ?? "Blind"} — ${r.name}`,
        ])
      );
    }
  }

  const enrichedItems = (items ?? []).map((item: BlindlyOrderItem) => ({
    ...item,
    range_display_name: rangeNameMap.get(item.blind_range_id) ?? "Unknown Range",
  }));

  return {
    ...(order as BlindlyOrder),
    items: enrichedItems as BlindlyOrderItem[],
  };
}
