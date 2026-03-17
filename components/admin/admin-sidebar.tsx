"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Navigation,
  Settings,
  FileText,
  CalendarDays,
  GraduationCap,
  Menu,
  Mail,
  Image as ImageIcon,
  Layers,
  MapPin,
  Receipt,
  Scale,
  Tag,
  Users,
  Percent,
  Package,
  ShoppingCart,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isEnabled } from "@/config/features";
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
    contentItems.push({ href: "/admin/portfolio", label: "Portfolio", icon: ImageIcon });
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
  if (contentItems.length > 1) {
    groups.push({ title: "Content", items: contentItems });
  }

  // Shop
  const shopItems: NavItem[] = [];
  if (isEnabled("blindsImport")) {
    shopItems.push(
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/blinds/pricing", label: "Pricing", icon: Percent },
    );
  }
  shopItems.push(
    { href: "/admin/shop/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/shop/settings", label: "Shop Settings", icon: ClipboardList },
  );
  groups.push({ title: "Shop", items: shopItems });

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
  manageItems.push({ href: "/admin/contact", label: "Contact", icon: MessageSquare });
  if (manageItems.length > 0) {
    groups.push({ title: "Manage", items: manageItems });
  }

  // Site
  const siteItems: NavItem[] = [
    { href: "/admin/navigation", label: "Navigation", icon: Navigation },
    { href: "/admin/settings", label: "Site Settings", icon: Settings },
    { href: "/admin/settings/email-templates", label: "Email Settings", icon: Mail },
  ];
  groups.push({ title: "Site", items: siteItems });

  return groups;
}

interface SidebarContentProps {
  readonly user: UserProfile;
  readonly onNavClick?: () => void;
  readonly collapsed?: boolean;
  readonly onToggleCollapse?: () => void;
}

export function AdminSidebarContent({
  user: _user,
  onNavClick,
  collapsed = false,
  onToggleCollapse,
}: SidebarContentProps) {
  const pathname = usePathname();
  const sidebarNav = buildSidebarNav();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    if (href === "/admin/settings") return pathname === "/admin/settings";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo / brand */}
      <div className={cn(
        "flex h-16 items-center border-b",
        collapsed ? "justify-center px-3" : "justify-between px-4"
      )}>
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors"
            aria-label="Expand sidebar"
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
        ) : (
          <>
            <Link href="/admin" onClick={onNavClick}>
              <Image
                src="/logo-name.png"
                alt="Blindly Admin"
                height={48}
                width={180}
                className="h-12 w-auto object-contain dark:brightness-0 dark:invert"
                priority
              />
            </Link>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Collapse sidebar"
              >
                <Menu className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {sidebarNav.map((group) => (
          <div key={group.title} className="mb-4">
            {!collapsed && (
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group.title}
              </p>
            )}
            {collapsed && <div className="my-2 border-t border-border/50" />}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavClick}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center rounded-lg py-2 text-sm font-medium transition-colors",
                        collapsed ? "justify-center px-2" : "gap-3 px-3",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {Icon && <Icon className="h-4 w-4 shrink-0" />}
                      {!collapsed && item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}

interface AdminSidebarProps {
  readonly user: UserProfile;
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "sticky top-0 hidden h-screen shrink-0 flex-col border-r lg:flex transition-all duration-200",
      collapsed ? "w-14" : "w-64"
    )}>
      <AdminSidebarContent
        user={user}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />
    </aside>
  );
}
