// parseCheckoutBody is the only gate between unvalidated JSON and the order insert; lookupPrice's own
// guard catches a size that reaches it by another route (/api/blinds/price).
import { test } from "node:test";
import assert from "node:assert/strict";
import { CheckoutInputError, parseCheckoutBody } from "@/lib/blinds/checkout-pricing";
import { PriceInputError, lookupPrice } from "@/lib/pricing";

const RANGE = "3f2b6c1e-8a4d-4f0e-9b7a-2c5d8e1f4a6b";

const body = (item: Record<string, unknown> = {}, top: Record<string, unknown> = {}) => ({
  items: [{ blind_range_id: RANGE, colour: "White", mount_type: "inside", width_mm: 1200, drop_mm: 1500, control_side: "left", ...item }],
  customer: { name: "A Customer", email: "a@example.com", phone: "0821234567" },
  delivery_address: { street: "1 Main Road", city: "Cape Town" },
  delivery_type: "self_install",
  expected_total_cents: 141_500,
  ...top,
});

const refused = (raw: unknown) => assert.throws(() => parseCheckoutBody(raw), CheckoutInputError);

test("a well-formed body parses", () => {
  const p = parseCheckoutBody(body());
  assert.equal(p.items[0].width_mm, 1200);
  assert.equal(p.expected_total_cents, 141_500);
});

test("a size that is not a positive whole number is refused", () => {
  for (const width_mm of ["1200", 1200.5, 0, -5, Number.NaN, null]) refused(body({ width_mm }));
});

test("a range id that is not a UUID is refused as input, not left to fail the query", () => {
  refused(body({ blind_range_id: "1; drop table" }));
});

test("enums, required fields and the expected total are checked", () => {
  refused(body({ mount_type: "sideways" }));
  refused(body({ control_side: "up" }));
  refused(body({}, { delivery_type: "drone" }));
  refused(body({}, { customer: { name: "", email: "a@example.com", phone: "1" } }));
  refused(body({}, { customer: { name: "A", email: "not-an-email", phone: "1" } }));
  refused(body({}, { expected_total_cents: 10.5 }));
  refused(body({}, { items: [] }));
});

test("lookupPrice refuses a non-numeric or fractional size before any database read", async () => {
  for (const width_mm of [Number.NaN, 1200.5, -1, "abc" as unknown as number]) {
    await assert.rejects(
      lookupPrice({ blind_range_id: RANGE, width_mm, drop_mm: 1500, mount_type: "inside" }),
      PriceInputError
    );
  }
});
