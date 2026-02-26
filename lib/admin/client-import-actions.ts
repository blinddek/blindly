"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { ensureAdmin } from "@/lib/admin/auth";

export interface ImportRow {
  full_name: string;
  email: string;
  phone?: string;
  company_name?: string;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

export async function importClients(rows: ImportRow[]): Promise<ImportResult> {
  await ensureAdmin();
  const supabase = createAdminClient();

  const result: ImportResult = { created: 0, skipped: 0, errors: [] };

  for (const row of rows) {
    if (!row.email || !row.full_name) {
      result.errors.push(`Missing required field for row: ${row.email || "unknown"}`);
      continue;
    }

    // Check if user already exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", row.email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      result.skipped++;
      continue;
    }

    // Create auth user via admin API (generates a random password)
    const tempPassword = crypto.randomUUID().slice(0, 16);
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: row.email.toLowerCase().trim(),
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: row.full_name.trim(),
      },
    });

    if (authError) {
      result.errors.push(`${row.email}: ${authError.message}`);
      continue;
    }

    if (authUser?.user) {
      // Update profile
      await supabase.from("profiles").update({
        full_name: row.full_name.trim(),
        phone: row.phone?.trim() || "",
        company_name: row.company_name?.trim() || null,
        role: "customer",
        password_changed: false,
      }).eq("id", authUser.user.id);

      result.created++;
    }
  }

  return result;
}

export async function parseCSV(text: string): Promise<ImportRow[]> {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(",").map(h => h.trim().replace(/"/g, ""));

  const emailIdx = headers.findIndex(h => h === "email" || h === "e-mail");
  const nameIdx = headers.findIndex(h => h === "full_name" || h === "name" || h === "full name");
  const phoneIdx = headers.findIndex(h => h === "phone" || h === "telephone" || h === "cell");
  const companyIdx = headers.findIndex(h => h === "company" || h === "company_name" || h === "business");

  if (emailIdx === -1 || nameIdx === -1) return [];

  const rows: ImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
    if (!cols[emailIdx]) continue;
    rows.push({
      full_name: cols[nameIdx] || "",
      email: cols[emailIdx] || "",
      phone: phoneIdx >= 0 ? cols[phoneIdx] : undefined,
      company_name: companyIdx >= 0 ? cols[companyIdx] : undefined,
    });
  }
  return rows;
}
