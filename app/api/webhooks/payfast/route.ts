import { NextResponse } from "next/server";
import { parseItnBody, verifyItn } from "@/lib/payfast/webhooks";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, sendEmailWithAttachment, sendRawEmail, notifyAdmin } from "@/lib/email";
import { formatPrice } from "@/lib/shop/format";
import { generateSupplierOrderXls } from "@/lib/blinds/supplier-order";
import { createInvoiceFromOrder } from "@/lib/create-order-invoice";

export async function POST(request: Request) {
  // 1. Read raw body (URL-encoded)
  const rawBody = await request.text();
  const data = parseItnBody(rawBody);

  // 2. Get source IP
  const forwarded = request.headers.get("x-forwarded-for");
  const sourceIp = forwarded?.split(",")[0]?.trim() ?? "unknown";

  // 3. Verify ITN
  const verification = verifyItn(data, sourceIp, rawBody);
  if (!verification.valid) {
    console.error("[payfast-itn] Verification failed:", verification.error);
    return NextResponse.json({ error: verification.error }, { status: 400 });
  }

  // 4. Extract payment details
  const reference = data.m_payment_id;
  const paymentType = data.custom_str1; // "blindly_order" | "shop_order" | "course"
  const relatedId = data.custom_str2; // order_id or course_id
  const userId = data.custom_str3; // user_id for course payments

  if (!reference) {
    console.warn("[payfast-itn] Missing m_payment_id");
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 5. Log the payment event
  await supabase.from("payment_logs").insert({
    order_id: relatedId ?? null,
    event: "payfast.itn.complete",
    payload: data,
  });

  // 6. Dispatch to handlers
  try {
    if (paymentType === "course" && relatedId && userId) {
      await handleCoursePayment(supabase, relatedId, userId, reference);
    } else if (paymentType === "blindly_order") {
      await handleBlindlyOrderPayment(supabase, reference, data.amount_gross);
    } else {
      // Default: shop order
      await handleShopOrderPayment(supabase, reference);
    }
  } catch (err) {
    console.error("[payfast-itn] Handler error:", err);
    // Blinds orders are claimed atomically, so a retry cannot double-send the supplier order:
    // answer non-2xx and let PayFast retry rather than acknowledge a payment we failed to process.
    if (paymentType === "blindly_order") {
      return NextResponse.json({ error: "Handler failed" }, { status: 500 });
    }
  }

  // 7. Always return 200 to acknowledge receipt
  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// Shop order handler
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleShopOrderPayment(supabase: any, reference: string) {
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("payment_reference", reference)
    .single();

  if (!order) {
    console.warn("[payfast-itn] No order found for reference:", reference);
    return;
  }

  if (order.status === "paid" || order.status === "fulfilled") {
    console.log("[payfast-itn] Order already processed:", order.id);
    return;
  }

  await supabase
    .from("orders")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", order.id);

  console.log("[payfast-itn] Order marked as paid:", order.id);

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
    console.error("[payfast-itn] Failed to send order confirmation:", err);
  }

  try {
    await notifyAdmin("admin_new_order", {
      orderReference: reference,
      customerEmail: order.email,
      total: formatPrice(order.total_cents),
      itemCount: (order.items as unknown[])?.length ?? 0,
      adminUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/admin/shop/orders/${order.id}`,
    });
  } catch (err) {
    console.error("[payfast-itn] Failed to notify admin:", err);
  }
}

// ---------------------------------------------------------------------------
// Blindly order handler
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleBlindlyOrderPayment(supabase: any, reference: string, amountGross: string | undefined) {
  const { data: order, error: lookupError } = await supabase
    .from("blindly_orders")
    .select(`
      id, payment_status, customer_name, customer_email, customer_phone,
      order_number, total_cents, subtotal_cents, vat_cents,
      discount_cents, installation_fee_cents, delivery_fee_cents,
      delivery_type, delivery_address
    `)
    .eq("payment_reference", reference)
    .single();

  // A failed read is not an unknown reference: throw so the ITN answers 500 and
  // PayFast retries. PGRST116 (no rows) is a genuinely unknown reference.
  if (lookupError && lookupError.code !== "PGRST116") {
    throw new Error(`order lookup failed for ${reference}: ${lookupError.message}`);
  }

  if (!order) {
    console.warn("[payfast-itn] No blindly_order found for reference:", reference);
    return;
  }

  if (order.payment_status === "paid") {
    console.log("[payfast-itn] Blindly order already paid:", order.id);
    return;
  }

  // The signature proves PayFast sent this ITN, not that the amount paid is the order's total —
  // the checkout form is built in the browser. Checkout charges exactly total_cents, so any
  // difference is a tampered or wrong payment: never claim it or send the supplier an order.
  // Answer 200 (a retry cannot change the amount) and tell the admin to resolve it by hand.
  const paidCents = Math.round(Number.parseFloat(amountGross ?? "") * 100);
  if (paidCents !== order.total_cents) {
    console.error("[payfast-itn] Amount mismatch for", order.order_number, "paid", paidCents, "expected", order.total_cents);
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await sendRawEmail({
        to: adminEmail,
        subject: `Payment amount mismatch on order ${order.order_number}`,
        html: `<p>PayFast reported a payment of ${formatPrice(paidCents)} for order ${order.order_number}, whose total is ${formatPrice(order.total_cents)}.</p><p>The order was not marked paid and no supplier order was sent. Check the payment in PayFast before acting.</p>`,
      });
    }
    return;
  }

  // Claim the order atomically: only the ITN whose update flips it from unpaid wins. Two ITNs racing
  // through the check above would otherwise both send the supplier a real manufacturing order.
  const { data: claimed, error: claimError } = await supabase
    .from("blindly_orders")
    .update({ payment_status: "paid", order_status: "confirmed" })
    .eq("id", order.id)
    .neq("payment_status", "paid")
    .select("id");

  // A failed update is not a lost race: throw so the ITN answers 500 and PayFast retries. The
  // claim above makes a retry safe.
  if (claimError) throw new Error(`claim failed for ${order.id}: ${claimError.message}`);

  if (!claimed?.length) {
    console.log("[payfast-itn] Blindly order already claimed by a concurrent ITN:", order.id);
    return;
  }

  console.log("[payfast-itn] Blindly order paid:", order.order_number);

  // Auto-generate invoice
  try {
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
    console.error("[payfast-itn] Failed to create invoice:", err);
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
  console.log("[payfast-itn] Sending customer confirmation to", order.customer_email);
  try {
    await sendEmail({
      to: order.customer_email,
      template: "blindly_order_confirmation",
      replyTo: "info@nortier.co.za",
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
    console.log("[payfast-itn] Customer confirmation sent OK");
  } catch (err) {
    console.error("[payfast-itn] Failed to send customer confirmation:", err);
  }

  // 2. Supplier order email with XLS attachment
  const supplierEmail = process.env.SUPPLIER_EMAIL;
  console.log("[payfast-itn] SUPPLIER_EMAIL:", supplierEmail ? `${supplierEmail} (set)` : "NOT SET");
  if (supplierEmail) {
    try {
      console.log("[payfast-itn] Generating supplier XLS for", order.order_number, "with", orderItems.length, "items");
      const xlsBuffer = await generateSupplierOrderXls({
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
      console.log("[payfast-itn] XLS generated:", xlsBuffer.length, "bytes");

      // sendEmailWithAttachment reports failure in its result rather than throwing. Try twice, then
      // fall through to the log below as before — the order is claimed, so a PayFast retry won't resend.
      const sendSupplierOrder = () => sendEmailWithAttachment({
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
        // A first attempt can be delivered yet reported failed; the key stops the retry becoming a
        // second manufacturing order.
        idempotencyKey: `supplier-order/${order.id}`,
      });
      let sent = await sendSupplierOrder();
      if (!sent.success) {
        console.warn("[payfast-itn] Supplier order send failed, retrying once:", sent.error);
        sent = await sendSupplierOrder();
      }
      if (!sent.success) throw sent.error ?? new Error("supplier order send failed twice");
      console.log("[payfast-itn] Supplier order email sent for", order.order_number);
    } catch (err) {
      console.error("[payfast-itn] Failed to send supplier order:", err);
    }
  } else {
    console.warn("[payfast-itn] SUPPLIER_EMAIL not set — skipping supplier order email");
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
    console.error("[payfast-itn] Failed to notify admin of blindly order:", err);
  }
}

// ---------------------------------------------------------------------------
// Course payment handler
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCoursePayment(supabase: any, courseId: string, userId: string, _reference: string) {
  const { data: existing } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .single();

  if (existing) {
    console.log("[payfast-itn] User already enrolled in course:", courseId);
    return;
  }

  const { error } = await supabase.from("enrollments").insert({
    user_id: userId,
    course_id: courseId,
    progress: 0,
  });

  if (error) {
    console.error("[payfast-itn] Failed to create enrollment:", error);
    return;
  }

  console.log("[payfast-itn] Course enrollment created:", courseId, "user:", userId);

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
      console.error("[payfast-itn] Failed to send enrollment email:", err);
    }
  }
}
