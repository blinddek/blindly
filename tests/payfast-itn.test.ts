// The ITN signature is checked against the raw body only (d28e0fc). These are signed the way
// PayFast documents; a captured real ITN is still owed (gate G-07).
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { parseItnBody, verifyItn } from "@/lib/payfast/webhooks";

const PASS = "test pass";
const FIELDS = "m_payment_id=BL-1001&pf_payment_id=123&payment_status=COMPLETE&item_name=Blindly+order+BL-1001&amount_gross=1415.00&custom_str1=";

const sign = (fields: string) =>
  crypto.createHash("md5").update(`${fields}&passphrase=${encodeURIComponent(PASS).replace(/%20/g, "+")}`).digest("hex");

const check = (raw: string, ip = "197.97.145.144") => verifyItn(parseItnBody(raw), ip, raw);

beforeEach(() => {
  process.env.PAYFAST_PASSPHRASE = PASS;
  process.env.PAYFAST_SANDBOX = "false";
});

test("a body signed as PayFast signs it verifies — spaces as +, empty fields kept", () => {
  assert.deepEqual(check(`${FIELDS}&signature=${sign(FIELDS)}`), { valid: true });
});

test("a field appended to a signed body is refused (walk F7)", () => {
  assert.equal(check(`${FIELDS}&signature=${sign(FIELDS)}&amount_gross=1.00`).valid, false);
});

test("a body only the parsed rebuild would accept is refused", () => {
  // The rebuild (verifySignature) drops empty fields, so it signs FIELDS without `custom_str1=`.
  // Before d28e0fc either check sufficed, and this passed.
  const rebuildSig = sign(FIELDS.replace("&custom_str1=", ""));
  assert.equal(check(`${FIELDS}&signature=${rebuildSig}`).valid, false);
});

test("a changed amount is refused", () => {
  const sig = sign(FIELDS);
  assert.equal(check(`${FIELDS.replace("1415.00", "1.00")}&signature=${sig}`).valid, false);
});

test("a missing signature is refused", () => {
  assert.equal(check(FIELDS).valid, false);
});

test("outside sandbox, a source IP not on PayFast's list is refused", () => {
  const r = check(`${FIELDS}&signature=${sign(FIELDS)}`, "203.0.113.9");
  assert.equal(r.valid, false);
  assert.match(r.error ?? "", /source IP/);
});

test("a signed ITN whose status is not COMPLETE is not a payment", () => {
  const f = FIELDS.replace("COMPLETE", "CANCELLED");
  assert.equal(check(`${f}&signature=${sign(f)}`).valid, false);
});
