import Link from "next/link";
import {
  Home,
  Navigation,
  FileText,
  Settings,
  ChevronRight,
  Mail,
  Image,
  ShoppingBag,
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  SkipForward,
} from "lucide-react";
import { getDashboardStats, getLastCronRuns } from "@/lib/admin/queries";
import { isEnabled } from "@/config/features";
import type { LucideIcon } from "lucide-react";

interface StatCard {
  label: string;
  value: number;
  icon: LucideIcon;
}

interface QuickLink {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

const cronStatusIcons: Record<string, LucideIcon> = {
  success: CheckCircle2,
  error: AlertCircle,
  skipped: SkipForward,
};

const cronStatusColors: Record<string, string> = {
  success: "text-green-600",
  error: "text-destructive",
  skipped: "text-muted-foreground",
};

export default async function AdminDashboard() {
  const [stats, cronRuns] = await Promise.all([
    getDashboardStats(),
    getLastCronRuns(),
  ]);

  // Build feature-conditional stat cards
  const statCards: StatCard[] = [];
  if (isEnabled("blog")) {
    statCards.push({ label: "Blog Posts", value: stats.blogCount, icon: FileText });
  }
  if (isEnabled("portfolio")) {
    statCards.push({ label: "Portfolio", value: stats.portfolioCount, icon: Image });
  }

  // Build feature-conditional quick links
  const quickLinks: QuickLink[] = [
    { href: "/admin/homepage", label: "Homepage Sections", description: "Edit hero, services, FAQ and more", icon: Home },
    { href: "/admin/navigation", label: "Navigation", description: "Manage nav links and footer", icon: Navigation },
  ];
  if (isEnabled("blog")) {
    quickLinks.push({ href: "/admin/blog", label: "Blog Posts", description: "Create and manage articles", icon: FileText });
  }
  if (isEnabled("portfolio")) {
    quickLinks.push({ href: "/admin/portfolio", label: "Portfolio", description: "Showcase completed work", icon: Image });
  }
  if (isEnabled("shop")) {
    quickLinks.push({ href: "/admin/shop", label: "Shop", description: "Products, orders, settings", icon: ShoppingBag });
  }
  if (isEnabled("booking")) {
    quickLinks.push({ href: "/admin/booking", label: "Booking", description: "Services and appointments", icon: CalendarDays });
  }
  quickLinks.push(
    { href: "/admin/settings", label: "Site Settings", description: "Business info, contact, social", icon: Settings },
    { href: "/admin/settings/email-templates", label: "Email Settings", description: "Manage email templates", icon: Mail },
  );

  // Filter cron runs to only show tasks relevant to enabled features
  const filteredCronRuns = cronRuns.filter((run) => {
    const name = run.task_name.toLowerCase();
    if ((name.includes("campaign") || name.includes("drip")) &&
        !isEnabled("emailCampaigns") && !isEnabled("dripEmails")) return false;
    if (name.includes("reminder") && !isEnabled("booking")) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          {stats.unreadContactCount > 0
            ? `${stats.unreadContactCount} unread message${stats.unreadContactCount === 1 ? "" : "s"}.`
            : "All caught up."}
        </p>
      </div>

      {/* Stats */}
      <div className={`grid grid-cols-2 gap-4 ${statCards.length > 2 ? "lg:grid-cols-4" : "lg:grid-cols-2"}`}>
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Cron Status */}
      {filteredCronRuns.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" /> Automated Tasks
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCronRuns.map((run) => {
              const StatusIcon = cronStatusIcons[run.status] ?? CheckCircle2;
              const color = cronStatusColors[run.status] ?? "text-muted-foreground";
              const ago = timeAgo(run.created_at);
              return (
                <div
                  key={run.id}
                  className="flex items-center gap-3 rounded-xl border bg-card p-3"
                >
                  <StatusIcon className={`h-4 w-4 shrink-0 ${color}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium capitalize">{run.task_name.replaceAll("_", " ")}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {run.status} &middot; {ago}
                      {run.duration_ms != null && <> &middot; {run.duration_ms}ms</>}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Manage</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <link.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{link.label}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {link.description}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
