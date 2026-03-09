import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  // Global markup
  const { data: globalRow } = await supabase
    .from("markup_config")
    .select("markup_percent")
    .eq("scope_type", "global")
    .is("scope_id", null)
    .single();

  const global_markup = globalRow ? Number(globalRow.markup_percent) : 40;

  // All active suppliers
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name");

  // Supplier markup overrides
  const { data: supplierMarkups } = await supabase
    .from("markup_config")
    .select("scope_id, markup_percent")
    .eq("scope_type", "supplier")
    .eq("is_active", true);

  const supplierMarkupMap = new Map(
    (supplierMarkups ?? []).map((r) => [r.scope_id, Number(r.markup_percent)])
  );

  const supplierData = (suppliers ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    markup_percent: supplierMarkupMap.has(s.id) ? supplierMarkupMap.get(s.id)! : null,
  }));

  // All active categories
  const { data: categories } = await supabase
    .from("blind_categories")
    .select("id, name")
    .eq("is_active", true)
    .order("display_order");

  // Category markup overrides
  const { data: catMarkups } = await supabase
    .from("markup_config")
    .select("scope_id, markup_percent")
    .eq("scope_type", "category")
    .eq("is_active", true);

  const catMarkupMap = new Map(
    (catMarkups ?? []).map((r) => [r.scope_id, Number(r.markup_percent)])
  );

  const categoryData = (categories ?? []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    markup_percent: catMarkupMap.has(cat.id) ? catMarkupMap.get(cat.id)! : null,
  }));

  return NextResponse.json({ global_markup, suppliers: supplierData, categories: categoryData });
}
