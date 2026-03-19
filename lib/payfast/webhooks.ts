// PayFast ITN (Instant Transaction Notification) verification
// See https://developers.payfast.co.za/docs#step-4-confirm-payment

import { verifySignature } from "./client";

// PayFast server IPs that send ITN notifications
const PAYFAST_IPS = [
  "197.97.145.144",
  "197.97.145.145",
  "197.97.145.146",
  "197.97.145.147",
  "197.97.145.148",
  "197.97.145.149",
  "197.97.145.150",
  "197.97.145.151",
  "41.74.179.192",
  "41.74.179.193",
  "41.74.179.194",
  "41.74.179.195",
  "41.74.179.196",
  "41.74.179.197",
  "41.74.179.198",
  "41.74.179.199",
  "41.74.179.200",
  "41.74.179.201",
  "41.74.179.202",
  "41.74.179.203",
  "41.74.179.204",
  "41.74.179.205",
  "41.74.179.206",
  "41.74.179.207",
  "41.74.179.208",
  "41.74.179.209",
  "41.74.179.210",
  "41.74.179.211",
  "41.74.179.212",
  "41.74.179.213",
  "41.74.179.214",
  "41.74.179.215",
  "41.74.179.216",
  "41.74.179.217",
  "41.74.179.218",
  "41.74.179.219",
  "41.74.179.220",
  "41.74.179.221",
  "41.74.179.222",
  "41.74.179.223",
];

/**
 * Parse URL-encoded ITN body into a key-value object.
 */
export function parseItnBody(body: string): Record<string, string> {
  const params: Record<string, string> = {};
  for (const pair of body.split("&")) {
    const [key, ...rest] = pair.split("=");
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(rest.join("="));
    }
  }
  return params;
}

/**
 * Verify the ITN request:
 * 1. Check signature
 * 2. Validate source IP (skip in sandbox)
 * 3. Check payment status
 */
export function verifyItn(
  data: Record<string, string>,
  sourceIp: string
): { valid: boolean; error?: string } {
  const passphrase = process.env.PAYFAST_PASSPHRASE || "";
  const isSandbox = process.env.PAYFAST_SANDBOX === "true";

  // 1. Verify signature
  if (!verifySignature(data, passphrase)) {
    return { valid: false, error: "Invalid signature" };
  }

  // 2. Verify source IP (skip in sandbox — Vercel proxies may alter IP)
  if (!isSandbox) {
    const cleanIp = sourceIp.replace("::ffff:", "");
    if (!PAYFAST_IPS.includes(cleanIp)) {
      return { valid: false, error: `Invalid source IP: ${cleanIp}` };
    }
  }

  // 3. Check payment status
  if (data.payment_status !== "COMPLETE") {
    return {
      valid: false,
      error: `Payment not complete: ${data.payment_status}`,
    };
  }

  return { valid: true };
}
