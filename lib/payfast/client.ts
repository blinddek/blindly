// PayFast server-side client
// Builds signed form data for PayFast hosted checkout.
// See https://developers.payfast.co.za/docs

import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PAYFAST_LIVE_URL = "https://www.payfast.co.za/eng/process";
const PAYFAST_SANDBOX_URL = "https://sandbox.payfast.co.za/eng/process";

function getConfig() {
  const merchantId = process.env.PAYFAST_MERCHANT_ID;
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
  if (!merchantId || !merchantKey) {
    throw new Error("PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY must be set");
  }
  return {
    merchantId,
    merchantKey,
    passphrase: process.env.PAYFAST_PASSPHRASE || "",
    sandbox: process.env.PAYFAST_SANDBOX === "true",
  };
}

export function getPayFastUrl(): string {
  const { sandbox } = getConfig();
  return sandbox ? PAYFAST_SANDBOX_URL : PAYFAST_LIVE_URL;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PayFastPaymentParams {
  amount: number; // in cents — will be converted to rands
  item_name: string;
  item_description?: string;
  email: string;
  name_first?: string;
  name_last?: string;
  reference: string; // m_payment_id
  return_url: string;
  cancel_url: string;
  notify_url: string; // ITN callback
  custom_str1?: string; // metadata field 1
  custom_str2?: string; // metadata field 2
  custom_str3?: string; // metadata field 3
  custom_int1?: number; // metadata int 1
}

export interface PayFastFormData {
  /** The URL to POST the form to */
  action: string;
  /** Key-value pairs for hidden form fields */
  fields: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Signature generation
// ---------------------------------------------------------------------------

function generateSignature(
  data: Record<string, string>,
  passphrase: string
): string {
  // 1. Build param string from data (excluding signature & empty values)
  const paramString = Object.entries(data)
    .filter(([key, val]) => key !== "signature" && val !== "")
    .map(([key, val]) => `${key}=${encodeURIComponent(val.trim()).replace(/%20/g, "+")}`)
    .join("&");

  // 2. Append passphrase if set (non-empty)
  const sigString = passphrase
    ? `${paramString}&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`
    : paramString;

  // 3. MD5 hash
  return crypto.createHash("md5").update(sigString).digest("hex");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build PayFast form data (action URL + signed fields).
 * The frontend should render a hidden form with these fields and auto-submit.
 */
export function buildPayFastForm(params: PayFastPaymentParams): PayFastFormData {
  const config = getConfig();

  // Convert cents to rands (PayFast expects rands with 2 decimal places)
  const amountRands = (params.amount / 100).toFixed(2);

  // Build the data object in PayFast's required field order
  const data: Record<string, string> = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
    return_url: params.return_url,
    cancel_url: params.cancel_url,
    notify_url: params.notify_url,
    ...(params.name_first ? { name_first: params.name_first } : {}),
    ...(params.name_last ? { name_last: params.name_last } : {}),
    email_address: params.email,
    m_payment_id: params.reference,
    amount: amountRands,
    item_name: params.item_name.slice(0, 100), // PayFast max 100 chars
    ...(params.item_description
      ? { item_description: params.item_description.slice(0, 255) }
      : {}),
    ...(params.custom_str1 ? { custom_str1: params.custom_str1 } : {}),
    ...(params.custom_str2 ? { custom_str2: params.custom_str2 } : {}),
    ...(params.custom_str3 ? { custom_str3: params.custom_str3 } : {}),
    ...(params.custom_int1 != null
      ? { custom_int1: String(params.custom_int1) }
      : {}),
  };

  // Remove empty values before signing (PayFast requires this)
  for (const key of Object.keys(data)) {
    if (data[key] === "") delete data[key];
  }

  // Sign
  data.signature = generateSignature(data, config.passphrase);

  console.log("[payfast] Signature input:", Object.entries(data)
    .filter(([k]) => k !== "signature")
    .map(([k, v]) => `${k}=${v}`)
    .join("&"));
  console.log("[payfast] Generated signature:", data.signature);

  return {
    action: getPayFastUrl(),
    fields: data,
  };
}

/**
 * Generate a unique payment reference.
 */
export function generateReference(seed: string): string {
  const short = seed.replaceAll("-", "").slice(0, 8).toUpperCase();
  return `BLINDLY-${short}-${Date.now()}`;
}

/**
 * Verify a PayFast signature on incoming ITN data.
 */
export function verifySignature(
  data: Record<string, string>,
  passphrase: string
): boolean {
  const receivedSig = data.signature;
  if (!receivedSig) return false;

  const expectedSig = generateSignature(data, passphrase);
  return receivedSig === expectedSig;
}
