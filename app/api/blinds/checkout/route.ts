import { NextResponse } from "next/server";
import { buildPayFastForm, generateReference } from "@/lib/payfast/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseCheckoutBody, priceCheckout, CheckoutInputError, type PricedCheckout } from "@/lib/blinds/checkout-pricing";
import { lineIncVatCents } from "@/lib/blinds/order-totals";
import { siteConfig } from "@/config/site";

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Every amount below is the server's: parse the body, then price it from the database and the
  // address (lib/blinds/checkout-pricing.ts). The page shows the same computation via /api/blinds/quote.
  let input: ReturnType<typeof parseCheckoutBody>;
  let priced: PricedCheckout;
  try {
    input = parseCheckoutBody(raw);
    priced = await priceCheckout(input);
  } catch (err) {
    if (err instanceof CheckoutInputError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[blinds/checkout] pricing failed:", err);
    return NextResponse.json({ error: "Could not price your order. Please try again." }, { status: 500 });
  }
  const { items: pricedItems, totals, distanceKm } = priced;

  // The customer pays what they were shown, or is shown the new amount first.
  if (input.expected_total_cents == null) {
    return NextResponse.json({ error: "Please refresh the page and review your order total." }, { status: 400 });
  }
  if (input.expected_total_cents !== totals.totalCents) {
    return NextResponse.json(
      { error: "Your order total has changed. Please review the new total before paying.", totals, distance_km: distanceKm },
      { status: 409 }
    );
  }

  const { customer, delivery_address, delivery_type, customer_notes } = input;
  const supabase = createAdminClient();
  const reference = generateReference(crypto.randomUUID());

  // Create blindly_order
  const { data: order, error: orderError } = await supabase
    .from("blindly_orders")
    .insert({
      order_number: "",
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      delivery_address,
      delivery_type,
      customer_notes,
      subtotal_cents: totals.subtotalCents,
      vat_cents: totals.vatCents,
      discount_rate: totals.discountRate,
      discount_cents: totals.discountCents,
      installation_fee_cents: totals.installationFeeCents,
      delivery_fee_cents: totals.deliveryFeeCents,
      distance_km: distanceKm,
      total_cents: totals.totalCents,
      payment_reference: reference,
      payment_status: "pending",
      order_status: "new",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("[blinds/checkout] Order insert failed:", orderError);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  // Insert order items
  const orderItems = pricedItems.map(({ item, price, selected_extras, extrasExVatCents }, idx) => ({
    order_id: order.id,
    blind_range_id: item.blind_range_id,
    location_label: item.location_label,
    mount_type: item.mount_type,
    quantity: 1,
    width_mm: item.width_mm,
    drop_mm: item.drop_mm,
    matched_width_cm: price.matched_width_cm,
    matched_drop_cm: price.matched_drop_cm,
    colour: item.colour,
    control_side: item.control_side,
    supplier_price_cents: price.supplier_price_cents,
    markup_percent: price.markup_percent,
    markup_cents: price.markup_cents,
    extras_cents: extrasExVatCents,
    selected_extras,
    line_total_cents: lineIncVatCents({ blindIncVatCents: price.total_with_vat_cents, extrasExVatCents, vatPercent: price.vat_percent }),
    display_order: idx,
  }));

  const { error: itemsError } = await supabase
    .from("blindly_order_items")
    .insert(orderItems);

  if (itemsError) {
    console.error("[blinds/checkout] Items insert failed:", itemsError);
    await supabase
      .from("blindly_orders")
      .update({ order_status: "cancelled" })
      .eq("id", order.id);
    return NextResponse.json({ error: "Failed to create order items" }, { status: 500 });
  }

  // Build PayFast form data
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${siteConfig.domain}`;

  try {
    const nameParts = customer.name.split(" ");
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ") || undefined;

    const formData = buildPayFastForm({
      amount: totals.totalCents,
      item_name: `Blindly Order ${reference}`,
      email: customer.email,
      name_first: firstName,
      name_last: lastName,
      reference,
      return_url: `${siteUrl}/cart/success?reference=${reference}`,
      cancel_url: `${siteUrl}/cart/checkout`,
      notify_url: `${siteUrl}/api/webhooks/payfast`,
      custom_str1: "blindly_order",
      custom_str2: order.id,
    });

    return NextResponse.json({
      payfast: formData,
      reference,
      order_id: order.id,
    });
  } catch (err) {
    console.error("[blinds/checkout] PayFast form build failed:", err);
    await supabase
      .from("blindly_orders")
      .update({ order_status: "cancelled", payment_status: "failed" })
      .eq("id", order.id);
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
  }
}
