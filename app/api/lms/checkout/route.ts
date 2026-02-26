import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  initializeTransaction,
  generateReference,
} from "@/lib/paystack/client";
import { siteConfig } from "@/config/site";

export async function POST(request: Request) {
  // 1. Authenticate user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  // 2. Parse body
  let body: { courseId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.courseId) {
    return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
  }

  // 3. Verify course exists and is paid
  const admin = createAdminClient();
  const { data: course } = await admin
    .from("courses")
    .select("id, title, slug, price_cents, is_published")
    .eq("id", body.courseId)
    .single();

  if (!course || !course.is_published) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  if (course.price_cents <= 0) {
    return NextResponse.json(
      { error: "This is a free course. Use direct enrollment." },
      { status: 400 }
    );
  }

  // 4. Check if already enrolled
  const { data: existing } = await admin
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "You are already enrolled in this course." },
      { status: 400 }
    );
  }

  // 5. Initialize Paystack transaction
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL || `https://${siteConfig.domain}`;
  const reference = generateReference(course.id);
  const courseName = (course.title as { en?: string })?.en ?? "Course";

  try {
    const txn = await initializeTransaction({
      email: user.email!,
      amount: course.price_cents,
      reference,
      currency: "ZAR",
      callback_url: `${siteUrl}/courses/${course.slug}?enrolled=true`,
      metadata: {
        course_id: course.id,
        user_id: user.id,
        payment_type: "once_off",
        client_name: courseName,
      },
      channels: ["card", "eft"],
    });

    // 6. Log payment reference for webhook matching
    await admin.from("payment_logs").insert({
      event: "lms_checkout_initialized",
      payload: {
        reference,
        course_id: course.id,
        user_id: user.id,
        amount: course.price_cents,
      },
    });

    return NextResponse.json({
      authorization_url: txn.data.authorization_url,
      reference: txn.data.reference,
    });
  } catch (err) {
    console.error("[lms-checkout] Paystack init failed:", err);
    return NextResponse.json(
      { error: "Payment initialization failed" },
      { status: 500 }
    );
  }
}
