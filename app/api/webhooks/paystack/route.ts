import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paystack/webhooks";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, sendEmailWithAttachment, notifyAdmin } from "@/lib/email";
import { formatPrice } from "@/lib/shop/format";
import { generateSupplierOrderXls } from "@/lib/blinds/supplier-order";
import { createInvoiceFromOrder } from "@/lib/create-order-invoice";

export async function POST(request: Request) {
  // 1. Read raw body as text (required for HMAC verification)
  const rawBody = await request.text();

  // 2. Verify signature
  const signature = request.headers.get("x-paystack-signature");
  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 3. Parse event
  let event: { event: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 4. Dispatch to handlers
  try {
    if (event.event === "charge.success") {
      await handleChargeSuccess(event.data);
    } else {
      console.log("[webhook] Unhandled event:", event.event);
    }
  } catch (err) {
    console.error("[webhook] Handler error:", err);
  }

  // 5. Always return 200 to acknowledge receipt
  return NextResponse.json({ received: true });
}

async function handleChargeSuccess(data: Record<string, unknown>) {
  const reference = data.reference as string;
  const metadata = data.metadata as Record<string, unknown> | undefined;
  const orderId = metadata?.order_id as string | undefined;
  const courseId = metadata?.course_id as string | undefined;
  const userId = metadata?.user_id as string | undefined;

  if (!reference) {
    console.warn("[webhook] charge.success missing reference");
    return;
  }

  const supabase = createAdminClient();

  // 1. Log the payment event
  await supabase.from("payment_logs").insert({
    order_id: orderId ?? null,
    event: "charge.success",
    payload: data,
  });

  // ── Course enrollment payment ──
  if (courseId && userId) {
    await handleCoursePayment(supabase, courseId, userId, reference);
    return;
  }

  // ── Blindly order payment ──
  if (metadata?.payment_type === "blindly_order" || metadata?.blindly_order_id) {
    await handleBlindlyOrderPayment(supabase, reference, metadata);
    return;
  }

  // ── Shop order payment ──
  // 2. Find order by payment_reference
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("payment_reference", reference)
    .single();

  if (!order) {
    console.warn("[webhook] No order found for reference:", reference);
    return;
  }

  // 3. Skip if already marked paid (idempotency)
  if (order.status === "paid" || order.status === "fulfilled") {
    console.log("[webhook] Order already processed:", order.id);
    return;
  }

  // 4. Update order status to paid
  await supabase
    .from("orders")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", order.id);

  console.log("[webhook] Order marked as paid:", order.id);

  // 5. Send confirmation email to customer
  try {
    await sendEmail({
      to: order.email,
      template: "order_confirmation",
      props: {
        customerName: order.shipping?.name ?? "Customer",
        orderReference: reference,
        items: order.items ?? [],
        subtotal: formatPrice(order.subtotal_cents),
        shipping: formatPrice(order.shipping_cents),
        tax: formatPrice(order.tax_cents),
        total: formatPrice(order.total_cents),
      },
    });
  } catch (err) {
    console.error("[webhook] Failed to send order confirmation:", err);
  }

  // 6. Notify admin of new order
  try {
    await notifyAdmin("admin_new_order", {
      orderReference: reference,
      customerEmail: order.email,
      total: formatPrice(order.total_cents),
      itemCount: (order.items as unknown[])?.length ?? 0,
      adminUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/admin/shop/orders/${order.id}`,
    });
  } catch (err) {
    console.error("[webhook] Failed to notify admin:", err);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleBlindlyOrderPayment(supabase: any, reference: string, _metadata: Record<string, unknown>) {
  const { data: order } = await supabase
    .from("blindly_orders")
    .select(`
      id, payment_status, customer_name, customer_email, customer_phone,
      order_number, total_cents, subtotal_cents, vat_cents,
      discount_cents, installation_fee_cents, delivery_fee_cents,
      delivery_type, delivery_address
    `)
    .eq("paystack_reference", reference)
    .single();

  if (!order) {
    console.warn("[webhook] No blindly_order found for reference:", reference);
    return;
  }

  if (order.payment_status === "paid") {
    console.log("[webhook] Blindly order already paid:", order.id);
    return;
  }

  await supabase
    .from("blindly_orders")
    .update({ payment_status: "paid", order_status: "confirmed" })
    .eq("id", order.id);

  console.log("[webhook] Blindly order paid:", order.order_number);

  // Auto-generate invoice
  try {
    // Fetch order items first for invoice line items
    const { data: invoiceItems } = await supabase
      .from("blindly_order_items")
      .select(`
        location_label, width_mm, drop_mm, colour, line_total_cents,
        blind_ranges!inner(name, blind_types!inner(name))
      `)
      .eq("order_id", order.id)
      .order("display_order");

    const invoiceLineItems = (invoiceItems ?? []).map((item: Record<string, unknown>) => {
      const range = item.blind_ranges as Record<string, unknown>;
      const type = range?.blind_types as Record<string, unknown>;
      return {
        range_name: (range?.name as string) ?? "",
        type_name: (type?.name as string) ?? "",
        width_mm: item.width_mm as number,
        drop_mm: item.drop_mm as number,
        colour: item.colour as string,
        line_total_cents: item.line_total_cents as number,
        location_label: item.location_label as string | null,
      };
    });

    await createInvoiceFromOrder(order, invoiceLineItems);
  } catch (err) {
    console.error("[webhook] Failed to create invoice:", err);
  }

  // Fetch order items with range + type info
  const { data: items } = await supabase
    .from("blindly_order_items")
    .select(`
      location_label, mount_type, width_mm, drop_mm,
      matched_width_cm, matched_drop_cm, colour, control_side,
      line_total_cents, selected_extras, display_order,
      blind_ranges!inner(name, blind_types!inner(name, slat_size_mm))
    `)
    .eq("order_id", order.id)
    .order("display_order");

  const orderItems = (items ?? []).map((item: Record<string, unknown>) => {
    const range = item.blind_ranges as Record<string, unknown>;
    const type = range?.blind_types as Record<string, unknown>;
    return {
      location_label: item.location_label as string | null,
      mount_type: item.mount_type as string,
      width_mm: item.width_mm as number,
      drop_mm: item.drop_mm as number,
      matched_width_cm: item.matched_width_cm as number,
      matched_drop_cm: item.matched_drop_cm as number,
      colour: item.colour as string,
      control_side: item.control_side as "left" | "right",
      line_total_cents: item.line_total_cents as number,
      selected_extras: (item.selected_extras as { name: string; price_cents: number }[]) ?? [],
      range_name: (range?.name as string) ?? "",
      type_name: (type?.name as string) ?? "",
      slat_size_mm: (type?.slat_size_mm as number | null) ?? null,
    };
  });

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const adminUrl = `${siteUrl}/admin/orders/${order.id}`;
  const addr = order.delivery_address as Record<string, string> ?? {};

  // 1. Customer confirmation email
  try {
    await sendEmail({
      to: order.customer_email,
      template: "blindly_order_confirmation",
      props: {
        customerName: order.customer_name,
        orderNumber: order.order_number,
        items: orderItems,
        subtotalCents: order.subtotal_cents,
        vatCents: order.vat_cents,
        discountCents: order.discount_cents,
        installationFeeCents: order.installation_fee_cents,
        deliveryFeeCents: order.delivery_fee_cents,
        totalCents: order.total_cents,
        deliveryType: order.delivery_type,
      },
    });
  } catch (err) {
    console.error("[webhook] Failed to send customer confirmation:", err);
  }

  // 2. Supplier order email with XLS attachment
  const supplierEmail = process.env.SUPPLIER_EMAIL;
  if (supplierEmail) {
    try {
      const xlsBuffer = generateSupplierOrderXls({
        order_number: order.order_number,
        order_date: new Date().toLocaleDateString("en-ZA"),
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        delivery_address: {
          street: addr.street ?? "",
          city: addr.city ?? "",
          province: addr.province ?? "",
          postal_code: addr.postal_code ?? "",
        },
        items: orderItems,
      });

      await sendEmailWithAttachment({
        to: supplierEmail,
        template: "blindly_supplier_order",
        props: {
          orderNumber: order.order_number,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          customerPhone: order.customer_phone,
          deliveryAddress: {
            street: addr.street ?? "",
            city: addr.city ?? "",
            province: addr.province ?? "",
            postal_code: addr.postal_code ?? "",
          },
          deliveryType: order.delivery_type,
          items: orderItems,
          adminUrl,
        },
        attachment: {
          filename: `${order.order_number}.xls`,
          content: xlsBuffer,
        },
      });
    } catch (err) {
      console.error("[webhook] Failed to send supplier order:", err);
    }
  } else {
    console.warn("[webhook] SUPPLIER_EMAIL not set — skipping supplier order email");
  }

  // 3. Admin notification
  try {
    await notifyAdmin("admin_new_order", {
      orderReference: order.order_number ?? reference,
      customerEmail: order.customer_email,
      total: formatPrice(order.total_cents),
      itemCount: orderItems.length,
      adminUrl,
    });
  } catch (err) {
    console.error("[webhook] Failed to notify admin of blindly order:", err);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCoursePayment(supabase: any, courseId: string, userId: string, _reference: string) {
  // Idempotency: check if already enrolled
  const { data: existing } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .single();

  if (existing) {
    console.log("[webhook] User already enrolled in course:", courseId);
    return;
  }

  // Create enrollment
  const { error } = await supabase.from("enrollments").insert({
    user_id: userId,
    course_id: courseId,
    progress: 0,
  });

  if (error) {
    console.error("[webhook] Failed to create enrollment:", error);
    return;
  }

  console.log("[webhook] Course enrollment created:", courseId, "user:", userId);

  // Get course and user details for email
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, slug")
    .eq("id", courseId)
    .single();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, email")
    .eq("id", userId)
    .single();

  if (course && profile) {
    const courseName = (course.title as { en?: string })?.en ?? "Course";
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "";

    try {
      await sendEmail({
        to: profile.email,
        template: "enrollment_confirmation",
        props: {
          studentName: profile.full_name ?? "Student",
          courseName,
          courseUrl: `${siteUrl}/portal/courses/${course.id}/learn`,
        },
      });
    } catch (err) {
      console.error("[webhook] Failed to send enrollment email:", err);
    }
  }
}
