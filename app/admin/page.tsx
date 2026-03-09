import Link from "next/link";
import {
  ShoppingBag,
  TrendingUp,
  Wrench,
  AlertCircle,
  ArrowRight,
  Package,
  Clock,
  CheckCircle2,
  SkipForward,
  BadgeDollarSign,
} from "lucide-react";
import {
  getBlindsShopStats,
  getMonthlyRevenue,
  getTopBlindRanges,
  getRecentBlindlyOrders,
  getLastCronRuns,
} from "@/lib/admin/queries";
import { isEnabled } from "@/config/features";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatRand(cents: number): string {
  if (cents >= 1_000_000) {
    const k = Math.round(cents / 10_000) / 10;
    return `R${k >= 10 ? Math.round(k) : k}k`;
  }
  return `R${Math.round(cents / 100).toLocaleString("en-ZA")}`;
}

function formatRandFull(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const ORDER_STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  confirmed: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  ordered_from_supplier: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  shipped: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  delivered: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  installed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  refunded: "bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400",
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  new: "New",
  confirmed: "Confirmed",
  ordered_from_supplier: "Ordered",
  shipped: "Shipped",
  delivered: "Delivered",
  installed: "Installed",
  cancelled: "Cancelled",
};

const CRON_ICONS: Record<string, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  skipped: SkipForward,
};

const CRON_COLORS: Record<string, string> = {
  success: "text-green-600",
  error: "text-destructive",
  skipped: "text-muted-foreground",
};

// ── Revenue bar chart (CSS only — no extra dependencies) ──────────────────────

function RevenueChart({
  months,
  year,
}: Readonly<{
  months: { revenue_cents: number; order_count: number }[];
  year: number;
}>) {
  const maxRevenue = Math.max(...months.map((m) => m.revenue_cents), 1);
  const totalYear = months.reduce((s, m) => s + m.revenue_cents, 0);
  const currentMonth = new Date().getFullYear() === year ? new Date().getMonth() : -1;

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-base">Revenue — {year}</h2>
        <span className="text-sm font-semibold text-primary">{formatRandFull(totalYear)}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-6">Paid orders · all months</p>

      <div className="flex items-end gap-1 h-36">
        {months.map((m, i) => {
          const heightPct = (m.revenue_cents / maxRevenue) * 100;
          const isCurrent = i === currentMonth;
          const barColor = isCurrent
            ? "bg-primary"
            : m.revenue_cents > 0
            ? "bg-primary/35 hover:bg-primary/60"
            : "bg-muted";

          return (
            <div
              key={MONTH_LABELS[i]}
              className="group flex-1 flex flex-col items-center justify-end gap-1"
              style={{ height: "100%" }}
            >
              <div className="w-full flex flex-col justify-end" style={{ height: "100%" }}>
                <div
                  title={`${MONTH_LABELS[i]}: ${formatRandFull(m.revenue_cents)} · ${m.order_count} orders`}
                  className={`w-full rounded-t-sm transition-colors cursor-default ${barColor}`}
                  style={{ height: `${Math.max(m.revenue_cents > 0 ? 6 : 2, heightPct)}%` }}
                />
              </div>
              <span className={`text-[10px] leading-none ${isCurrent ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                {MONTH_LABELS[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend row */}
      <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
        <span>R0</span>
        <span>{formatRand(Math.round(maxRevenue / 2))}</span>
        <span>{formatRand(maxRevenue)}</span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminDashboard() {
  const year = new Date().getFullYear();

  const [shopStats, monthlyRevenue, topRanges, recentOrders, cronRuns] = await Promise.all([
    getBlindsShopStats(),
    getMonthlyRevenue(year),
    getTopBlindRanges(6),
    getRecentBlindlyOrders(8),
    getLastCronRuns(),
  ]);

  const filteredCronRuns = cronRuns.filter((run) => {
    const name = run.task_name.toLowerCase();
    if ((name.includes("campaign") || name.includes("drip")) &&
        !isEnabled("emailCampaigns") && !isEnabled("dripEmails")) return false;
    if (name.includes("reminder") && !isEnabled("booking")) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}
          </p>
        </div>
        {shopStats.newUnpickedCount > 0 && (
          <Link
            href="/admin/blinds/orders"
            className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
          >
            <AlertCircle className="h-4 w-4" />
            {shopStats.newUnpickedCount} new order{shopStats.newUnpickedCount > 1 ? "s" : ""} need action
          </Link>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {([
          {
            label: "Total Orders",
            value: shopStats.totalOrders.toString(),
            sub: `${shopStats.ordersThisMonth} this month`,
            icon: ShoppingBag,
            iconColor: "text-primary",
          },
          {
            label: "Paid Revenue",
            value: formatRand(shopStats.paidRevenueCents),
            sub: `${formatRand(shopStats.revenueThisMonthCents)} this month`,
            icon: BadgeDollarSign,
            iconColor: "text-green-600",
          },
          {
            label: "In Progress",
            value: shopStats.inProgressCount.toString(),
            sub: "Confirmed → Shipped",
            icon: TrendingUp,
            iconColor: "text-indigo-500",
          },
          {
            label: "Awaiting Install",
            value: shopStats.awaitingInstallCount.toString(),
            sub: "Professional · delivered",
            icon: Wrench,
            iconColor: "text-amber-500",
          },
        ] as const).map((card) => (
          <div key={card.label} className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.label}</p>
              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <RevenueChart months={monthlyRevenue} year={year} />

      {/* Bottom grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent Orders — wider */}
        <div className="rounded-xl border bg-card lg:col-span-3">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold">Recent Orders</h2>
            <Link
              href="/admin/blinds/orders"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="px-5 py-10 text-sm text-muted-foreground text-center">No orders yet.</p>
          ) : (
            <ul className="divide-y">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/blinds/orders/${order.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="text-sm font-medium">#{order.order_number}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${ORDER_STATUS_STYLES[order.order_status] ?? "bg-muted text-muted-foreground"}`}>
                          {ORDER_STATUS_LABEL[order.order_status] ?? order.order_status}
                        </span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${PAYMENT_STATUS_STYLES[order.payment_status] ?? "bg-muted text-muted-foreground"}`}>
                          {order.payment_status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{order.customer_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{formatRandFull(order.total_cents)}</p>
                      <p className="text-[10px] text-muted-foreground">{timeAgo(order.created_at)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Most ordered */}
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold">Most Ordered</h2>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            {topRanges.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">No orders yet.</p>
            ) : (
              <ul className="divide-y">
                {topRanges.map((range, idx) => {
                  const pct = Math.round((range.item_count / topRanges[0].item_count) * 100);
                  return (
                    <li key={range.range_name} className="px-5 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm truncate flex-1">
                          <span className="text-muted-foreground mr-1">{idx + 1}.</span>
                          {range.range_name}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">{range.item_count}</span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary/50" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Automated tasks */}
          {filteredCronRuns.length > 0 && (
            <div className="rounded-xl border bg-card">
              <div className="flex items-center gap-2 px-5 py-4 border-b">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold">Automated Tasks</h2>
              </div>
              <ul className="divide-y">
                {filteredCronRuns.map((run) => {
                  const StatusIcon = CRON_ICONS[run.status] ?? CheckCircle2;
                  const color = CRON_COLORS[run.status] ?? "text-muted-foreground";
                  return (
                    <li key={run.id} className="flex items-center gap-3 px-5 py-3">
                      <StatusIcon className={`h-4 w-4 shrink-0 ${color}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium capitalize">{run.task_name.replaceAll("_", " ")}</p>
                        <p className="text-xs text-muted-foreground">
                          {run.status} · {timeAgo(run.created_at)}
                          {run.duration_ms != null && <> · {run.duration_ms}ms</>}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
