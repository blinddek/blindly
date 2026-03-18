import { NextResponse } from "next/server";
import { lookupPrice } from "@/lib/pricing";
import { initializeTransaction, generateReference } from "@/lib/paystack/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { getInstallationPricing, getVolumeDiscounts } from "@/lib/pricing-rules";
import {
  getDiscountRate,
  calcDiscountCents,
  calcInstallationCents,
  calcTransportCents,
} from "@/types/pricing-rules";
import { siteConfig } from "@/config/site";
import type { MountType, SelectedExtra } from "@/types/blinds";

interface CheckoutItem {
  blind_range_id: string;
  colour: string;
  mount_type: MountType;
  width_mm: number;
  drop_mm: number;
  control_side: "left" | "right";
  matched_width_cm: number;
  matched_drop_cm: number;
  location_label?: string;
  selected_extras?: SelectedExtra[];
}

interface CheckoutBody {
  items: CheckoutItem[];
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  delivery_address: {
    street: string;
    city: string;
    province: string;
    postal_code: string;
  };
  delivery_type: "self_install" | "professional_install";
  distance_km?: number | null;
  customer_notes?: string;
}

export async function POST(request: Request) {
  let body: CheckoutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { items, delivery_address, delivery_type, distance_km, customer_notes } = body;
  const customer = {
    name: body.customer?.name?.trim() ?? "",
    email: body.customer?.email?.trim().toLowerCase() ?? "",
    phone: body.customer?.phone?.trim() ?? "",
  };

  if (!items?.length || !customer.email || !customer.name || !customer.phone) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // Re-validate prices server-side for every item
  const pricedItems = await Promise.all(
    items.map(async (item) => {
      const price = await lookupPrice({
        blind_range_id: item.blind_range_id,
        width_mm: item.width_mm,
        drop_mm: item.drop_mm,
        mount_type: item.mount_type,
      });
      return { item, price };
    })
  ).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : "Price lookup failed";
    return { error: message };
  });

  if ("error" in pricedItems) {
    return NextResponse.json({ error: pricedItems.error }, { status: 400 });
  }

  // Blind totals (cents)
  const subtotalCents = pricedItems.reduce((s, { price }) => s + price.customer_price_cents, 0);
  const vatCents = pricedItems.reduce((s, { price }) => s + price.vat_cents, 0);
  const blindsGrandTotal = pricedItems.reduce((s, { price }) => s + price.total_with_vat_cents, 0);

  // Extras totals — prices are ex-VAT, apply 15%
  const extrasTotalExVat = pricedItems.reduce((s, { item }) =>
    s + (item.selected_extras ?? []).reduce((es, e) => es + e.price_cents, 0), 0);
  const extrasVat = Math.round(extrasTotalExVat * 0.15);
  const extrasTotalIncVat = extrasTotalExVat + extrasVat;

  // Load pricing rules server-side
  const [installRules, discountRules] = await Promise.all([
    getInstallationPricing(),
    getVolumeDiscounts(),
  ]);

  // Volume discount (applied to VAT-inclusive blind total)
  const discountRate = getDiscountRate(blindsGrandTotal, discountRules);
  const discountCents = calcDiscountCents(blindsGrandTotal, discountRate);

  // Installation & transport (professional install only)
  let installationFeeCents = 0;
  let deliveryFeeCents = 0;
  if (delivery_type === "professional_install") {
    installationFeeCents = calcInstallationCents(items.length, installRules);
    if (distance_km != null && distance_km > 0) {
      deliveryFeeCents = calcTransportCents(distance_km, installRules);
    }
  }

  const totalCents = blindsGrandTotal + extrasTotalIncVat - discountCents + installationFeeCents + deliveryFeeCents;

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
      customer_notes: customer_notes ?? null,
      subtotal_cents: subtotalCents,
      vat_cents: vatCents,
      discount_rate: discountRate,
      discount_cents: discountCents,
      installation_fee_cents: installationFeeCents,
      delivery_fee_cents: deliveryFeeCents,
      distance_km: distance_km ?? null,
      total_cents: totalCents,
      paystack_reference: reference,
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
  const orderItems = pricedItems.map(({ item, price }, idx) => ({
    order_id: order.id,
    blind_range_id: item.blind_range_id,
    location_label: item.location_label ?? null,
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
    extras_cents: (item.selected_extras ?? []).reduce((s, e) => s + e.price_cents, 0),
    selected_extras: item.selected_extras ?? [],
    line_total_cents: price.total_with_vat_cents +
      (item.selected_extras ?? []).reduce((s, e) => s + e.price_cents + Math.round(e.price_cents * 0.15), 0),
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

  // Initialise Paystack transaction
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${siteConfig.domain}`;

  try {
    const txn = await initializeTransaction({
      email: customer.email,
      amount: totalCents,
      reference,
      currency: "ZAR",
      callback_url: `${siteUrl}/cart/success`,
      metadata: {
        blindly_order_id: order.id,
        client_name: customer.name,
        payment_type: "blindly_order",
      },
      channels: ["card", "eft"],
    });

    return NextResponse.json({
      authorization_url: txn.data.authorization_url,
      reference: txn.data.reference,
      order_id: order.id,
    });
  } catch (err) {
    console.error("[blinds/checkout] Paystack init failed:", err);
    await supabase
      .from("blindly_orders")
      .update({ order_status: "cancelled", payment_status: "failed" })
      .eq("id", order.id);
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
  }
}
