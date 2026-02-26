import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserProfile } from "@/types/index";

// ---------- Get Current User ----------

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: rlsProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("[getCurrentUser] RLS SELECT failed:", profileError.message);
  }

  let profile = rlsProfile;

  // Fallback: if RLS client can't read the profile, try admin client
  if (!profile) {
    const admin = createAdminClient();

    const { data: adminProfile, error: adminReadError } = await admin
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (adminReadError) {
      console.error("[getCurrentUser] Admin SELECT failed:", adminReadError.message);
    }

    if (adminProfile) {
      profile = adminProfile;
    } else {
      // Row doesn't exist — create it (trigger may not have fired)
      const meta = user.user_metadata ?? {};
      const { data: created, error: insertError } = await admin
        .from("user_profiles")
        .insert({
          id: user.id,
          full_name: (meta.full_name as string) || "",
          phone: (meta.phone as string) || "",
          role: (meta.role as string) || "customer",
        })
        .select("*")
        .single();

      if (insertError) {
        console.error("[getCurrentUser] Admin INSERT failed:", insertError.message);
        return null;
      }
      profile = created;
    }
  }

  return {
    ...profile,
    email: profile.email || user.email || "",
  } as UserProfile;
}
