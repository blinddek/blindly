"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { isEnabled } from "@/config/features";
import { useLocale } from "@/lib/locale";
import type { User } from "@supabase/supabase-js";

/**
 * Navbar auth button. Behaviour:
 * - customerAuth OFF → show nothing (admin accesses /admin directly)
 * - customerAuth ON, logged out → Login button
 * - customerAuth ON, logged in → Dashboard + Sign out
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

  // customerAuth disabled — admins use /admin URL directly
  if (!customerAuth) return null;

  // Not ready yet — show login button as placeholder
  if (!ready) {
    return (
      <Link href="/login">
        <Button variant="ghost" size="sm">
          {t({ en: "Login", af: "Teken In" })}
        </Button>
      </Link>
    );
  }

  if (!user) {
    return (
      <Link href="/login">
        <Button variant="ghost" size="sm">
          {t({ en: "Login", af: "Teken In" })}
        </Button>
      </Link>
    );
  }

  // Logged in: show avatar + dashboard link + sign out
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
    <div className="flex items-center gap-1">
      <Link href="/portal">
        <Button variant="ghost" size="sm" className="gap-2">
          {initials ? (
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {initials}
            </span>
          ) : (
            <UserCircle className="size-5" />
          )}
          <span className="hidden sm:inline">
            {t({ en: "Dashboard", af: "Paneelbord" })}
          </span>
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        aria-label={t({ en: "Sign out", af: "Teken uit" })}
        className="size-8 p-0"
      >
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}
