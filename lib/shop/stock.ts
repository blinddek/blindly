import { createAdminClient } from "@/lib/supabase/admin";

// Not a "use server" module on purpose: this decrements stock with the service key, and an export of a
// "use server" module is a public endpoint anyone can call (scripts/check-actions.mjs). Only the shop
// checkout route calls it, server-side.

export async function validateAndDecrementStock(
  items: { product_id: string; quantity: number }[]
): Promise<{ valid: boolean; error?: string }> {
  const supabase = createAdminClient();

  for (const item of items) {
    const { data: product } = await supabase
      .from("products")
      .select("stock_quantity, name")
      .eq("id", item.product_id)
      .single();

    if (!product) return { valid: false, error: `Product not found: ${item.product_id}` };
    if (product.stock_quantity < item.quantity) {
      const name = typeof product.name === "object" && product.name !== null
        ? (product.name as { en?: string }).en ?? "Unknown"
        : "Unknown";
      return {
        valid: false,
        error: `Insufficient stock for ${name} (available: ${product.stock_quantity})`,
      };
    }
  }

  // Decrement stock
  for (const item of items) {
    const { error } = await supabase.rpc("decrement_stock", {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    });
    // Fallback if RPC doesn't exist — use raw update
    if (error) {
      const { data: product } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", item.product_id)
        .single();
      if (product) {
        await supabase
          .from("products")
          .update({ stock_quantity: product.stock_quantity - item.quantity })
          .eq("id", item.product_id);
      }
    }
  }

  return { valid: true };
}
