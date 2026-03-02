"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

async function getClientIp(): Promise<string> {
  const hdrs = await headers();
  return hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

// ---------- Sign Up ----------

interface SignUpState {
  error?: string;
  success?: boolean;
}

export async function signUp(
  _prevState: SignUpState | null,
  formData: FormData
): Promise<SignUpState> {
  const ip = await getClientIp();
  const rl = checkRateLimit(ip, { prefix: "signup", limit: 5, windowSeconds: 300 });
  if (!rl.success) {
    return { error: "Too many attempts. Please try again in a few minutes." };
  }

  const full_name = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;

  if (!full_name || !email || !password) {
    return { error: "Please fill in all required fields." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (!/\d/.test(password)) {
    return { error: "Password must contain at least 1 number." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        phone,
        role: "customer",
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Fire-and-forget welcome email
  sendEmail({
    to: email,
    template: "welcome",
    props: {
      clientName: full_name,
      portalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal`,
    },
  }).catch((err) => console.error("[email] welcome failed:", err));

  return { success: true };
}

// ---------- Sign In ----------

interface SignInState {
  error?: string;
}

export async function signIn(
  _prevState: SignInState | null,
  formData: FormData
): Promise<SignInState> {
  const ip = await getClientIp();
  const rl = checkRateLimit(ip, { prefix: "signin", limit: 10, windowSeconds: 300 });
  if (!rl.success) {
    return { error: "Too many login attempts. Please try again in a few minutes." };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirect") as string) || "/portal";

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(redirectTo);
}

// ---------- Sign Out ----------

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ---------- Reset Password (custom token flow — bypasses Supabase SMTP) ----------

import {
  requestPasswordReset,
  resetPassword as _resetPasswordWithToken,
} from "@/lib/auth/password-reset";

export const resetPassword = requestPasswordReset;
export const resetPasswordWithToken = _resetPasswordWithToken;

// ---------- Update Profile ----------

interface UpdateProfileState {
  error?: string;
  success?: boolean;
}

export async function updateProfile(
  _prevState: UpdateProfileState | null,
  formData: FormData
): Promise<UpdateProfileState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "You must be logged in to update your profile." };
  }

  const full_name = formData.get("full_name") as string;
  const phone = formData.get("phone") as string;

  // Build update payload — always include core fields
  const updates: Record<string, unknown> = {
    full_name,
    phone,
    updated_at: new Date().toISOString(),
  };

  // Only include business_name if it was submitted in the form
  if (formData.has("business_name")) {
    updates.business_name = formData.get("business_name") as string;
  }

  // Notification prefs (sent as hidden JSON field from notifications tab)
  const notifJson = formData.get("notification_prefs") as string | null;
  if (notifJson) {
    try {
      updates.notification_prefs = JSON.parse(notifJson);
    } catch {
      // ignore invalid JSON
    }
  }

  // Config-driven client fields — only update if the field was submitted
  const clientFieldMap: Record<string, string> = {
    date_of_birth: "date_of_birth",
    gender: "gender",
    address: "address",
    relationship_status: "relationship_status",
    emergency_contact: "emergency_contact",
    referral_source: "referral_source",
    referral_detail: "referral_detail",
    medical_info: "medical_info",
    company_name: "company_name",
  };

  for (const [formName, colName] of Object.entries(clientFieldMap)) {
    if (formData.has(formName)) {
      const val = formData.get(formName) as string;
      updates[colName] = val || null;
    }
  }

  const { error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/portal");
  return { success: true };
}

// ---------- Update Password ----------

interface UpdatePasswordState {
  error?: string;
  success?: boolean;
}

export async function updatePassword(
  _prevState: UpdatePasswordState | null,
  formData: FormData
): Promise<UpdatePasswordState> {
  const new_password = formData.get("new_password") as string;

  if (!new_password) {
    return { error: "Please enter a new password." };
  }

  if (new_password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (!/\d/.test(new_password)) {
    return { error: "Password must contain at least 1 number." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: new_password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// ---------- Change Initial Password (onboarding) ----------

export async function changeInitialPassword(
  _prevState: UpdatePasswordState | null,
  formData: FormData
): Promise<UpdatePasswordState> {
  const new_password = formData.get("new_password") as string;

  if (!new_password) {
    return { error: "Please enter a new password." };
  }

  if (new_password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (!/\d/.test(new_password)) {
    return { error: "Password must contain at least 1 number." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated." };
  }

  const { error } = await supabase.auth.updateUser({
    password: new_password,
  });

  if (error) {
    return { error: error.message };
  }

  // Mark password as changed in profile
  await supabase
    .from("user_profiles")
    .update({ password_changed: true, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  revalidatePath("/portal");
  return { success: true };
}

// ---------- Complete Onboarding ----------

interface OnboardingState {
  error?: string;
  success?: boolean;
}

export async function completeOnboarding(
  _prevState: OnboardingState | null,
  formData: FormData
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated." };
  }

  // Collect any intake responses from the form
  const responsesJson = formData.get("responses") as string | null;
  let responses: Record<string, string> = {};
  if (responsesJson) {
    try {
      responses = JSON.parse(responsesJson);
    } catch {
      return { error: "Invalid form data." };
    }
  }

  // Store intake if there are responses
  if (Object.keys(responses).length > 0) {
    await supabase.from("client_intakes").upsert(
      {
        user_id: user.id,
        responses,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  }

  // Mark onboarding complete
  await supabase
    .from("user_profiles")
    .update({
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  revalidatePath("/portal");
  return { success: true };
}
