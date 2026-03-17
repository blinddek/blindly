"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { AdminSidebarContent } from "@/components/admin/admin-sidebar";
import { signOut } from "@/lib/auth/actions";
import { ExternalLink, LogOut, Menu, UserCog } from "lucide-react";
import Link from "next/link";
import type { UserProfile } from "@/types";

interface AdminHeaderProps {
  readonly user: UserProfile;
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Close mobile nav on route change
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setSheetOpen(false); }, [pathname]);

  const initials = (user.full_name || "A")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
      {/* Mobile menu */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <AdminSidebarContent
            user={user}
            onNavClick={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Spacer on desktop (left side) */}
      <div className="hidden lg:block" />

      {/* Right side */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <Button
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          asChild
        >
          <a href="/" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            View Site
          </a>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              {user.full_name && (
                <p className="text-sm font-medium">{user.full_name}</p>
              )}
              {user.email && (
                <p className="text-xs text-muted-foreground">{user.email}</p>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/account">
                <UserCog className="mr-2 h-4 w-4" />
                My Account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={signOut} className="w-full">
                <button type="submit" className="flex w-full items-center">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
