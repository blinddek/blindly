"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";

export function AdminSignOutButton() {
  return (
    <form action={signOut}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign Out
      </Button>
    </form>
  );
}
