"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, ensureAdmin } from "@/lib/admin/auth";

// ---------- Admin Notification Preferences ----------

const ADMIN_NOTIFICATION_DEFAULTS: Record<string, boolean> = {
  admin_new_message: true,
  admin_new_booking: true,
  admin_new_order: true,
};

export async function getAdminNotificationPrefs(): Promise<Record<string, boolean>> {
  try { await ensureAdmin(); } catch { return { ...ADMIN_NOTIFICATION_DEFAULTS }; }

  const admin = createAdminClient();

  const { data } = await admin
    .from("site_content")
    .select("content")
    .eq("section_key", "admin_notification_prefs")
    .single();

  if (!data) return { ...ADMIN_NOTIFICATION_DEFAULTS };

  return {
    ...ADMIN_NOTIFICATION_DEFAULTS,
    ...(data.content as Record<string, boolean>),
  };
}

export async function updateAdminNotificationPrefs(
  prefs: Record<string, boolean>
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();

  const { error } = await admin.from("site_content").upsert(
    {
      section_key: "admin_notification_prefs",
      content: prefs,
    },
    { onConflict: "section_key" }
  );

  if (error) return { error: error.message };

  revalidatePath("/admin/settings/email-templates");
  return {};
}

// ---------- Mark Contact Submission Read ----------

export async function markContactRead(
  id: string
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("contact_submissions")
    .update({ read: true, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return {};
}

// ---------- Archive Contact Submission ----------

export async function archiveContact(
  id: string
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("contact_submissions")
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return {};
}

// ---------- Update Project URLs ----------

export async function updateProjectUrls(
  projectId: string,
  urls: { staging_url?: string | null; production_url?: string | null }
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("projects")
    .update({ ...urls, updated_at: new Date().toISOString() })
    .eq("id", projectId);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return {};
}

// ---------- Update Site Settings ----------

export async function updateSiteSettings(
  settings: Record<string, unknown>
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("site_content").upsert(
    {
      section_key: "site_settings",
      content: settings,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "section_key" }
  );

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}
