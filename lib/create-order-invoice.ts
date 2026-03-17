/**
 * Auto-generate an invoice when a Blindly order is paid.
 * Called from the Paystack webhook after payment confirmation.
 */

import { createAdminClient } from "@/lib/supabase/admin";

interface OrderData {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  subtotal_cents: number;
  vat_cents: number;
  discount_cents: number;
  installation_fee_cents: number;
  delivery_fee_cents: number;
  total_cents: number;
}

interface OrderItem {
  range_name: string;
  type_name: string;
  width_mm: number;
  drop_mm: number;
  colour: string;
  line_total_cents: number;
  location_label?: string | null;
}

async function getNextInvoiceNumber(): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("invoice_sequences")
    .select("prefix, next_num")
    .eq("id", "default")
    .single();

  const prefix = data?.prefix ?? "INV";
  const num = data?.next_num ?? 1;

  await admin
    .from("invoice_sequences")
    .update({ next_num: num + 1 })
    .eq("id", "default");

  return `${prefix}-${String(num).padStart(5, "0")}`;
}

export async function createInvoiceFromOrder(
  order: OrderData,
  items: OrderItem[],
): Promise<{ id?: string; error?: string }> {
  const admin = createAdminClient();

  // Idempotency: check if invoice already exists for this order
  const { data: existing } = await admin
    .from("invoices")
    .select("id")
    .eq("client_name", order.customer_name)
    .eq("total_cents", order.total_cents)
    .ilike("invoice_number", `%`)
    .limit(1);

  // Better idempotency: check by a metadata field or order reference
  // For now, check if any invoice has this order_number in line_items
  if (existing && existing.length > 0) {
    // Search for invoice that references this order number
    const { data: matchingInv } = await admin
      .from("invoices")
      .select("id")
      .contains("line_items", [{ description: `Order ${order.order_number}` }]);

    if (matchingInv && matchingInv.length > 0) {
      console.log("[invoice] Invoice already exists for order:", order.order_number);
      return { id: matchingInv[0].id };
    }
  }

  const invoiceNumber = await getNextInvoiceNumber();

  // Build line items from order items
  const lineItems = items.map((item) => ({
    description: `${item.range_name} ${item.type_name} — ${item.width_mm}×${item.drop_mm}mm${item.colour ? ` (${item.colour})` : ""}${item.location_label ? ` [${item.location_label}]` : ""}`,
    quantity: 1,
    unit_price_cents: item.line_total_cents,
    total_cents: item.line_total_cents,
  }));

  // Add delivery fee as line item if applicable
  if (order.delivery_fee_cents > 0) {
    lineItems.push({
      description: "Delivery fee",
      quantity: 1,
      unit_price_cents: order.delivery_fee_cents,
      total_cents: order.delivery_fee_cents,
    });
  }

  // Add installation fee as line item if applicable
  if (order.installation_fee_cents > 0) {
    lineItems.push({
      description: "Professional installation",
      quantity: 1,
      unit_price_cents: order.installation_fee_cents,
      total_cents: order.installation_fee_cents,
    });
  }

  const subtotal = order.subtotal_cents + order.delivery_fee_cents + order.installation_fee_cents;
  const vatRate = subtotal > 0 ? order.vat_cents / subtotal : 0.15;

  const now = new Date();

  const { data: invoice, error } = await admin
    .from("invoices")
    .insert({
      invoice_number: invoiceNumber,
      client_name: order.customer_name,
      client_email: order.customer_email,
      line_items: lineItems,
      subtotal_cents: subtotal - order.discount_cents,
      vat_rate: Math.round(vatRate * 100) / 100,
      vat_amount_cents: order.vat_cents,
      total_cents: order.total_cents,
      currency: "ZAR",
      status: "paid",
      issued_at: now.toISOString(),
      due_at: now.toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("[invoice] Failed to create invoice:", error.message);
    return { error: error.message };
  }

  console.log("[invoice] Created invoice", invoiceNumber, "for order", order.order_number);
  return { id: invoice.id };
}
