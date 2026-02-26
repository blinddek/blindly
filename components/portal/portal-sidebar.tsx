"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserCircle,
  LogOut,
  Globe,
  ShoppingBag,
  CalendarDays,
  GraduationCap,
  Receipt,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";
import { isEnabled } from "@/config/features";
import { siteConfig } from "@/config/site";
import type { UserProfile } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

function buildPortalNav(): NavItem[] {
  const items: NavItem[] = [
    { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
    { href: "/portal/account", label: "Account", icon: UserCircle },
  ];

  if (isEnabled("booking")) {
    items.push({ href: "/portal/bookings", label: "My Bookings", icon: CalendarDays });
  }
  if (isEnabled("shop")) {
    items.push({ href: "/portal/orders", label: "My Orders", icon: ShoppingBag });
  }
  if (isEnabled("lms")) {
    items.push({ href: "/portal/courses", label: "My Courses", icon: GraduationCap });
  }
  if (isEnabled("billing")) {
    items.push({ href: "/portal/invoices", label: "Invoices", icon: Receipt });
  }

  return items;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface PortalSidebarProps {
  user: UserProfile;
}

function SidebarContent({
  user,
  onNavClick,
}: {
  readonly user: UserProfile;
  readonly onNavClick?: () => void;
}) {
  const pathname = usePathname();
  const navItems = buildPortalNav();

  const isActive = (href: string) => {
    if (href === "/portal") return pathname === "/portal";
    return pathname.startsWith(href);
  };

  return (
    <>
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {getInitials(user.full_name || "U")}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-6">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Main
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
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
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <div className="border-t p-3">
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </form>
        <Link
          href="/"
          onClick={onNavClick}
          className="mt-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <Globe className="h-4 w-4" />
          View Site
        </Link>
      </div>
    </>
  );
}

export function PortalSidebar({ user }: PortalSidebarProps) {
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

  const portalTitle = `${siteConfig.name} Portal`;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/portal" className="text-lg font-semibold">
            {portalTitle}
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

        <Link href="/portal" className="text-base font-semibold">
          {portalTitle}
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
              <Link href="/portal" className="text-base font-semibold">
                {portalTitle}
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
