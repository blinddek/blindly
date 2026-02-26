// Paystack server-side API client
// All Paystack HTTP interactions go through this module.
// See https://paystack.com/docs/api/

const PAYSTACK_BASE = "https://api.paystack.co";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaystackInitializeParams {
  email: string;
  amount: number; // smallest currency unit (cents for ZAR)
  reference: string;
  currency: "ZAR";
  callback_url: string;
  metadata: {
    quote_id?: string;
    invoice_id?: string;
    order_id?: string;
    payment_type?: "once_off" | "subscription";
    client_name?: string;
    [key: string]: unknown;
  };
  channels?: ("card" | "bank" | "eft")[];
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyData {
  id: number;
  status: "success" | "failed" | "abandoned";
  reference: string;
  amount: number;
  currency: string;
  paid_at: string;
  channel: string;
  customer: { email: string; customer_code: string };
  metadata: Record<string, unknown>;
  authorization: {
    authorization_code: string;
    bin: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    channel: string;
    card_type: string;
    bank: string;
    reusable: boolean;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: PaystackVerifyData;
}

export interface PaystackCreatePlanParams {
  name: string;
  amount: number; // monthly amount in cents
  interval: "monthly";
  currency: "ZAR";
  description?: string;
}

export interface PaystackCreatePlanResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    plan_code: string;
    name: string;
    amount: number;
    interval: string;
  };
}

export interface PaystackCreateSubscriptionParams {
  customer: string; // customer email or customer_code
  plan: string; // plan_code from createPlan
  start_date?: string; // ISO date for when recurring billing starts
}

export interface PaystackCreateSubscriptionResponse {
  status: boolean;
  message: string;
  data: {
    subscription_code: string;
    email_token: string;
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

async function paystackFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${PAYSTACK_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(
      `Paystack API error (${res.status}): ${json.message ?? res.statusText}`
    );
  }

  return json as T;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function initializeTransaction(
  params: PaystackInitializeParams
): Promise<PaystackInitializeResponse> {
  return paystackFetch<PaystackInitializeResponse>(
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify(params),
    }
  );
}

export async function verifyTransaction(
  reference: string
): Promise<PaystackVerifyResponse> {
  return paystackFetch<PaystackVerifyResponse>(
    `/transaction/verify/${encodeURIComponent(reference)}`
  );
}

export async function createPlan(
  params: PaystackCreatePlanParams
): Promise<PaystackCreatePlanResponse> {
  return paystackFetch<PaystackCreatePlanResponse>("/plan", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function createSubscription(
  params: PaystackCreateSubscriptionParams
): Promise<PaystackCreateSubscriptionResponse> {
  return paystackFetch<PaystackCreateSubscriptionResponse>("/subscription", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function generateReference(quoteId: string): string {
  const short = quoteId.replaceAll("-", "").slice(0, 8).toUpperCase();
  return `YOROS-${short}-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// Subscription Management
// ---------------------------------------------------------------------------

export interface PaystackSubscriptionDetail {
  status: string;
  subscription_code: string;
  email_token: string;
  amount: number;
  next_payment_date: string;
  plan: { plan_code: string; name: string; amount: number; interval: string };
}

export async function getSubscription(
  code: string
): Promise<{ status: boolean; data: PaystackSubscriptionDetail }> {
  return paystackFetch<{ status: boolean; data: PaystackSubscriptionDetail }>(
    `/subscription/${encodeURIComponent(code)}`
  );
}

export async function disableSubscription(
  code: string,
  token: string
): Promise<{ status: boolean; message: string }> {
  return paystackFetch<{ status: boolean; message: string }>(
    "/subscription/disable",
    {
      method: "POST",
      body: JSON.stringify({ code, token }),
    }
  );
}
