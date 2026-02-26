// Paystack webhook signature verification
// Extended by commerce tier for shop order processing

import crypto from "node:crypto";

export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] PAYSTACK_WEBHOOK_SECRET is not set");
    return false;
  }

  const hash = crypto
    .createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");

  return hash === signature;
}

// Commerce tier: add handleChargeSuccess, handleSubscriptionCreate, etc.
