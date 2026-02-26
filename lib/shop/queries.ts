import { createClient } from "@/lib/supabase/server";
import type { Product, ProductCategory, Order } from "@/types";

// ---------- Shop Settings ----------

export interface ShopSettings {
  shipping_rate_cents: number;
  free_shipping_threshold_cents: number;
  tax_rate_percent: number;
}

export async function getShopSettings(): Promise<ShopSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("shop_settings").select("key, value");

  const settings: ShopSettings = {
    shipping_rate_cents: 5000,
    free_shipping_threshold_cents: 50000,
    tax_rate_percent: 15,
  };

  if (data) {
    for (const row of data) {
      const val = typeof row.value === "number" ? row.value : Number(row.value);
      if (row.key === "shipping_rate_cents") settings.shipping_rate_cents = val;
      if (row.key === "free_shipping_threshold_cents") settings.free_shipping_threshold_cents = val;
      if (row.key === "tax_rate_percent") settings.tax_rate_percent = val;
    }
  }

  return settings;
}

// ---------- Product Categories ----------

export async function getProductCategories(): Promise<ProductCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_categories")
    .select("*")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("display_order");
  return (data as ProductCategory[]) ?? [];
}

// ---------- Products ----------

export async function getActiveProducts(options?: {
  categorySlug?: string;
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc";
}): Promise<Product[]> {
  const supabase = await createClient();

  let categoryId: string | undefined;
  if (options?.categorySlug) {
    const { data: cat } = await supabase
      .from("product_categories")
      .select("id")
      .eq("slug", options.categorySlug)
      .single();
    if (cat) categoryId = cat.id;
  }

  let query = supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .is("deleted_at", null);

  if (categoryId) query = query.eq("category_id", categoryId);
  if (options?.search) query = query.ilike("name->en", `%${options.search}%`);

  switch (options?.sort) {
    case "price_asc":
      query = query.order("price_cents", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price_cents", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data } = await query;
  return (data as Product[]) ?? [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();
  return (data as Product) ?? null;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .in("id", ids)
    .eq("is_active", true)
    .is("deleted_at", null);
  return (data as Product[]) ?? [];
}

// ---------- Orders (admin) ----------

export async function getOrders(options?: {
  status?: string;
  search?: string;
}): Promise<Order[]> {
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (options?.status) query = query.eq("status", options.status);
  if (options?.search) query = query.ilike("email", `%${options.search}%`);

  const { data } = await query;
  return (data as Order[]) ?? [];
}

export async function getOrderById(id: string): Promise<Order | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();
  return (data as Order) ?? null;
}
