import { NextResponse } from "next/server";
import { getProductsByIds, getShopSettings } from "@/lib/shop/queries";
import { validateAndDecrementStock } from "@/lib/shop/actions";
import {
  buildPayFastForm,
  generateReference,
} from "@/lib/payfast/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteConfig } from "@/config/site";

interface CheckoutBody {
  items: { product_id: string; quantity: number }[];
  shipping: {
    name: string;
    email: string;
    phone: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    province: string;
    postal_code: string;
  };
}

export async function POST(request: Request) {
  let body: CheckoutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { items, shipping } = body;

  if (!items?.length || !shipping?.email || !shipping?.name) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // 1. Fetch real product prices from DB (never trust client prices)
  const productIds = items.map((i) => i.product_id);
  const products = await getProductsByIds(productIds);

  if (products.length !== productIds.length) {
    return NextResponse.json(
      { error: "One or more products not found" },
      { status: 400 }
    );
  }

  // 2. Validate stock
  const stockResult = await validateAndDecrementStock(items);
  if (!stockResult.valid) {
    return NextResponse.json({ error: stockResult.error }, { status: 400 });
  }

  // 3. Calculate totals
  const settings = await getShopSettings();

  const subtotalCents = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.product_id)!;
    return sum + product.price_cents * item.quantity;
  }, 0);

  const shippingCents =
    subtotalCents >= settings.free_shipping_threshold_cents
      ? 0
      : settings.shipping_rate_cents;

  const taxCents = Math.round(
    subtotalCents * (settings.tax_rate_percent / 100)
  );

  const totalCents = subtotalCents + shippingCents + taxCents;

  // 4. Create pending order in DB
  const supabase = createAdminClient();
  const reference = generateReference(crypto.randomUUID());

  const orderItems = items.map((item) => {
    const product = products.find((p) => p.id === item.product_id)!;
    return {
      product_id: product.id,
      name: product.name.en,
      price_cents: product.price_cents,
      quantity: item.quantity,
    };
  });

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      email: shipping.email,
      status: "pending",
      total_cents: totalCents,
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      tax_cents: taxCents,
      items: orderItems,
      shipping: {
        name: shipping.name,
        address_line_1: shipping.address_line_1,
        address_line_2: shipping.address_line_2 || "",
        city: shipping.city,
        province: shipping.province,
        postal_code: shipping.postal_code,
        phone: shipping.phone,
      },
      payment_reference: reference,
    })
    .select("id")
    .single();

  if (orderError) {
    console.error("[checkout] Order insert failed:", orderError);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }

  // 5. Build PayFast form data
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL || `https://${siteConfig.domain}`;

  try {
    const nameParts = shipping.name.split(" ");
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ") || undefined;

    const formData = buildPayFastForm({
      amount: totalCents,
      item_name: `Shop Order ${reference}`,
      email: shipping.email,
      name_first: firstName,
      name_last: lastName,
      reference,
      return_url: `${siteUrl}/shop/checkout/success?reference=${reference}`,
      cancel_url: `${siteUrl}/shop/checkout`,
      notify_url: `${siteUrl}/api/webhooks/payfast`,
      custom_str1: "shop_order",
      custom_str2: order.id,
    });

    return NextResponse.json({
      payfast: formData,
      reference,
    });
  } catch (err) {
    console.error("[checkout] PayFast form build failed:", err);
    await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", order.id);
    return NextResponse.json(
      { error: "Payment initialization failed" },
      { status: 500 }
    );
  }
}
