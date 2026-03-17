"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, UserCircle, UserCog, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { isEnabled } from "@/config/features";
import { useLocale } from "@/lib/locale";
import type { User } from "@supabase/supabase-js";

/**
 * Navbar auth button. Behaviour:
 * - customerAuth OFF → show nothing (admin accesses /admin directly)
 * - customerAuth ON, logged out → Login button
 * - customerAuth ON, logged in → Profile avatar dropdown
 */
export function NavbarAuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const { t } = useLocale();
  const supabase = createClient();
  const customerAuth = isEnabled("customerAuth");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });
  }, [supabase.auth]);

  if (!customerAuth) return null;

  if (!ready || !user) {
    return (
      <Link href="/login">
        <Button variant="ghost" size="sm">
          {t({ en: "Login", af: "Teken In" })}
        </Button>
      </Link>
    );
  }

  const fullName =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    user.email ||
    "";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .slice(0, 2)
    .join("");

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials || <UserCircle className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{fullName}</p>
          {user.email && (
            <p className="text-xs text-muted-foreground">{user.email}</p>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/portal">
            <ShoppingBag className="mr-2 h-4 w-4" />
            {t({ en: "My Orders", af: "My Bestellings" })}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/portal/account">
            <UserCog className="mr-2 h-4 w-4" />
            {t({ en: "My Account", af: "My Rekening" })}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          {t({ en: "Sign Out", af: "Teken Uit" })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
