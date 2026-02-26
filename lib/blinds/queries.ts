import { createClient } from "@/lib/supabase/server";
import type {
  BlindCategory,
  BlindType,
  BlindRange,
  BlindlyOrder,
  BlindlyOrderItem,
  BlindlyOrderWithItems,
} from "@/types/blinds";

// ─── Categories ─────────────────────────────────────────

export async function getCategories(): Promise<BlindCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blind_categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order");
  return (data as BlindCategory[]) ?? [];
}

export async function getCategoryBySlug(
  slug: string
): Promise<BlindCategory | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blind_categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return (data as BlindCategory) ?? null;
}

// ─── Types ──────────────────────────────────────────────

export async function getTypesByCategory(
  categoryId: string
): Promise<BlindType[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blind_types")
    .select("*")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("display_order");
  return (data as BlindType[]) ?? [];
}

export async function getTypeBySlug(slug: string): Promise<BlindType | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blind_types")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return (data as BlindType) ?? null;
}

// ─── Ranges ─────────────────────────────────────────────

export async function getRangesByType(typeId: string): Promise<BlindRange[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blind_ranges")
    .select("*")
    .eq("blind_type_id", typeId)
    .eq("is_active", true)
    .order("display_order");
  return (data as BlindRange[]) ?? [];
}

export async function getRangeBySlug(
  slug: string
): Promise<BlindRange | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blind_ranges")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return (data as BlindRange) ?? null;
}

export async function getRangeById(id: string): Promise<BlindRange | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blind_ranges")
    .select("*")
    .eq("id", id)
    .single();
  return (data as BlindRange) ?? null;
}

// ─── Full hierarchy (for product browsing) ──────────────

export async function getCategoryWithTypes(slug: string) {
  const category = await getCategoryBySlug(slug);
  if (!category) return null;
  const types = await getTypesByCategory(category.id);
  return { ...category, types };
}

export async function getTypeWithRanges(slug: string) {
  const type = await getTypeBySlug(slug);
  if (!type) return null;
  const ranges = await getRangesByType(type.id);
  return { ...type, ranges };
}

// ─── Blindly Orders ─────────────────────────────────────

export async function getBlindlyOrders(options?: {
  status?: string;
  search?: string;
}): Promise<BlindlyOrder[]> {
  const supabase = await createClient();
  let query = supabase
    .from("blindly_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (options?.status) query = query.eq("order_status", options.status);
  if (options?.search)
    query = query.ilike("customer_email", `%${options.search}%`);

  const { data } = await query;
  return (data as BlindlyOrder[]) ?? [];
}

export async function getBlindlyOrderById(
  id: string
): Promise<BlindlyOrderWithItems | null> {
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("blindly_orders")
    .select("*")
    .eq("id", id)
    .single();

  if (!order) return null;

  const { data: items } = await supabase
    .from("blindly_order_items")
    .select("*")
    .eq("order_id", id)
    .order("display_order");

  return {
    ...(order as BlindlyOrder),
    items: (items as BlindlyOrderItem[]) ?? [],
  };
}

export async function getBlindlyOrderByNumber(
  orderNumber: string
): Promise<BlindlyOrderWithItems | null> {
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("blindly_orders")
    .select("*")
    .eq("order_number", orderNumber)
    .single();

  if (!order) return null;

  const { data: items } = await supabase
    .from("blindly_order_items")
    .select("*")
    .eq("order_id", order.id)
    .order("display_order");

  return {
    ...(order as BlindlyOrder),
    items: (items as BlindlyOrderItem[]) ?? [],
  };
}
