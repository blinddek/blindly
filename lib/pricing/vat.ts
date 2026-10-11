import { createAdminClient } from "@/lib/supabase/admin";
import { readOrThrow } from "./errors";

/**
 * The one VAT rate, as a percentage: `site_settings.vat_percent` (G-13, Stéan 2026-10-11: the database
 * is the source). Blind prices, their extras, the order totals and the paid-order invoice all read it
 * here; the admin edits it in Settings → Finance (`updateVatPercent`).
 *
 * No row, or one that is not a rate, is a failure, not a default: `site_settings.value` is TEXT NOT
 * NULL DEFAULT '' (migration 027), and Number('') is 0.
 */
export async function getVatPercent(): Promise<number> {
  const row = readOrThrow("vat_percent", await createAdminClient()
    .from("site_settings")
    .select("value")
    .eq("key", "vat_percent")
    .single());
  const pct = parseVatPercent(row?.value);
  if (pct == null) throw new Error(`vat_percent setting is missing or not a rate: ${JSON.stringify(row?.value ?? null)}`);
  return pct;
}

/** A VAT percentage from 0 to 100, or null. */
export function parseVatPercent(v: unknown): number | null {
  if (typeof v !== "string" && typeof v !== "number") return null;
  if (String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
}
