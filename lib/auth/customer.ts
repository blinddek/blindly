/**
 * Customer authentication guards for the client portal.
 *
 * Usage:
 *   const { user, profile } = await requireCustomer();
 *   const { user, profile } = await requirePasswordChanged();
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isEnabled } from "@/config/features";

export async function requireCustomer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return { user, profile };
}

/**
 * Ensures the customer has changed their initial password.
 * If clientOnboarding is enabled, also checks onboarding_complete.
 */
export async function requirePasswordChanged() {
  const { user, profile } = await requireCustomer();

  if (!profile.password_changed) {
    redirect("/portal/change-password");
  }

  if (isEnabled("clientOnboarding") && !profile.onboarding_complete) {
    redirect("/portal/onboarding");
  }

  return { user, profile };
}
