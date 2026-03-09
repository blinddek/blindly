"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Navigation,
  Settings,
  FileText,
  Globe,
  CalendarDays,
  GraduationCap,
  Search as SearchIcon,
  Menu,
  X,
  Mail,
  UserCog,
  Image,
  Layers,
  MapPin,
  Receipt,
  Scale,
  Tag,
  Users,
  Percent,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminSignOutButton } from "@/components/auth/admin-sign-out-button";
import { isEnabled } from "@/config/features";
import { siteConfig } from "@/config/site";
import type { UserProfile } from "@/types";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon?: LucideIcon;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

function buildSidebarNav(): NavGroup[] {
  const groups: NavGroup[] = [];

  // Main
  groups.push({
    title: "Main",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  });

  // Content
  const contentItems: NavItem[] = [
    { href: "/admin/pages", label: "Pages", icon: Layers },
  ];
  if (isEnabled("blog")) {
    contentItems.push({ href: "/admin/blog", label: "Blog", icon: FileText });
  }
  if (isEnabled("portfolio")) {
    contentItems.push({ href: "/admin/portfolio", label: "Portfolio", icon: Image });
  }
  if (isEnabled("blindsImport")) {
    contentItems.push({ href: "/admin/products", label: "Products", icon: Package });
  }
  if (isEnabled("booking")) {
    contentItems.push({ href: "/admin/booking", label: "Booking", icon: CalendarDays });
  }
  if (isEnabled("lms")) {
    contentItems.push({ href: "/admin/lms", label: "Courses", icon: GraduationCap });
  }
  if (isEnabled("serviceAreaPages")) {
    contentItems.push({ href: "/admin/areas", label: "Service Areas", icon: MapPin });
  }
  if (isEnabled("legalDocs")) {
    contentItems.push({ href: "/admin/legal", label: "Legal Docs", icon: Scale });
  }
  groups.push({ title: "Content", items: contentItems });

  // Manage
  const manageItems: NavItem[] = [];
  if (isEnabled("billing")) {
    manageItems.push({ href: "/admin/billing", label: "Billing", icon: Receipt });
  }
  if (isEnabled("coupons") || isEnabled("gifts") || isEnabled("hybridPackages")) {
    manageItems.push({ href: "/admin/commerce", label: "Commerce", icon: Tag });
  }
  if (isEnabled("clientImport")) {
    manageItems.push({ href: "/admin/clients/import", label: "Client Import", icon: Users });
  }
  if (isEnabled("blindsImport")) {
    manageItems.push({ href: "/admin/blinds/pricing", label: "Pricing", icon: Percent });
  }
  if (manageItems.length > 0) {
    groups.push({ title: "Manage", items: manageItems });
  }

  // Site
  const siteItems: NavItem[] = [
    { href: "/admin/navigation", label: "Navigation", icon: Navigation },
    { href: "/admin/settings", label: "Site Settings", icon: Settings },
    { href: "/admin/settings/email-templates", label: "Email Settings", icon: Mail },
  ];
  if (isEnabled("seoAdvanced")) {
    siteItems.push({ href: "/admin/seo", label: "SEO", icon: SearchIcon });
  }
  groups.push({ title: "Site", items: siteItems });

  return groups;
}

interface AdminSidebarProps {
  readonly user: UserProfile;
}

function SidebarContent({
  user,
  onNavClick,
}: {
  readonly user: UserProfile;
  readonly onNavClick?: () => void;
}) {
  const pathname = usePathname();
  const sidebarNav = buildSidebarNav();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    if (href === "/admin/settings") return pathname === "/admin/settings";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* User info */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {(user.full_name || "A")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {user.full_name || "Admin"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sidebarNav.map((group) => (
          <div key={group.title} className="mb-6">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavClick}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      {Icon && <Icon className="h-4 w-4 shrink-0" />}
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="border-t p-3">
        <Link
          href="/admin/account"
          onClick={onNavClick}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <UserCog className="h-4 w-4" />
          My Account
        </Link>
        <AdminSignOutButton />
        <Link
          href="/"
          className="mt-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <Globe className="h-4 w-4" />
          View Site
        </Link>
      </div>
    </>
  );
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const adminTitle = `${siteConfig.name} Admin`;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin" className="text-lg font-semibold">
            {adminTitle}
          </Link>
        </div>
        <SidebarContent user={user} />
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b bg-sidebar px-4 text-sidebar-foreground md:hidden">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setMobileOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/admin" className="text-base font-semibold">
          {adminTitle}
        </Link>

        <div className="w-8" />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar text-sidebar-foreground shadow-xl md:hidden">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <Link href="/admin" className="text-base font-semibold">
                {adminTitle}
              </Link>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent user={user} onNavClick={() => setMobileOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
}
