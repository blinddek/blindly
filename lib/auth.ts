import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

/**
 * Server-side role guard. Use in Server Components and Route Handlers.
 * Redirects to /login if unauthenticated or role doesn't match.
 * Returns the user ID on success.
 */
export async function requireRole(role: UserRole): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== role) {
    redirect("/login");
  }

  return user.id;
}
