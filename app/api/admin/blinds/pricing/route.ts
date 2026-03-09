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

  // All active categories
  const { data: categories } = await supabase
    .from("blind_categories")
    .select("id, name")
    .eq("is_active", true)
    .order("display_order");

  // Category-level markup overrides
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

  return NextResponse.json({ global_markup, categories: categoryData });
}
