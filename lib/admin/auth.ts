// lib/admin/auth.ts
// Shared admin authentication guard for server actions.
// Queries user_profiles.role from DB (not JWT claim) for immediate role enforcement.

import { createClient } from "@/lib/supabase/server";

export class AdminAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminAuthError";
  }
}

/**
 * Verify the current user is authenticated AND has admin role.
 * Throws AdminAuthError if either check fails.
 * Returns the admin's user ID for audit trail use (e.g., resolved_by).
 */
export async function ensureAdmin(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AdminAuthError("Not authenticated");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new AdminAuthError("Forbidden: admin access required");
  }

  return user.id;
}

/**
 * Non-throwing wrapper for ensureAdmin().
 * Returns { adminId } on success, { error } on failure.
 * Use in functions that return { error?: string } shape.
 */
export async function requireAdmin(): Promise<{ adminId: string } | { error: string }> {
  try {
    const adminId = await ensureAdmin();
    return { adminId };
  } catch (e) {
    return { error: e instanceof AdminAuthError ? e.message : "Auth check failed" };
  }
}
