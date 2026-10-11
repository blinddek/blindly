// computeOrderTotals is the one computation of what an order costs: the quote the page shows and the
// amount PayFast is asked for. These pin the 2026-10-11 decisions (brief/DECISIONS.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeOrderTotals, lineIncVatCents, type TotalsLine } from "@/lib/blinds/order-totals";
import {
  DEFAULT_COURIER_PRICING,
  DEFAULT_INSTALLATION_PRICING,
  DEFAULT_VOLUME_DISCOUNTS,
} from "@/types/pricing-rules";

const rules = {
  installation: DEFAULT_INSTALLATION_PRICING,
  discounts: DEFAULT_VOLUME_DISCOUNTS,
  courier: DEFAULT_COURIER_PRICING,
};

const line = (over: Partial<TotalsLine> = {}): TotalsLine => ({
  blindExVatCents: 100_000,
  blindVatCents: 15_000,
  blindIncVatCents: 115_000,
  vatPercent: 15,
  extrasExVatCents: 10_000,
  category_id: "roller",
  width_mm: 1200,
  drop_mm: 1500,
  ...over,
});

test("a line's VAT-inclusive total adds the extras and their VAT", () => {
  assert.equal(lineIncVatCents(line()), 115_000 + 10_000 + 1_500);
});

test("extras pay the blind's VAT rate, not a fixed 15% (G-13: the database rate is the one source)", () => {
  const at10 = line({ vatPercent: 10, blindVatCents: 10_000, blindIncVatCents: 110_000 });
  assert.equal(lineIncVatCents(at10), 110_000 + 10_000 + 1_000);
  const t = computeOrderTotals([at10], { type: "self_install", distanceKm: null }, rules);
  assert.equal(t.vatCents, 11_000);
  assert.equal(t.subtotalCents + t.vatCents, t.goodsIncVatCents);
});

test("subtotal and VAT include the extras, and sum to the goods total", () => {
  const t = computeOrderTotals([line()], { type: "self_install", distanceKm: null }, rules);
  assert.equal(t.subtotalCents, 110_000);
  assert.equal(t.vatCents, 16_500);
  assert.equal(t.subtotalCents + t.vatCents, t.goodsIncVatCents);
});

test("self-install pays the courier fee", () => {
  // No category weights: the shipment is the 0.5 kg of packaging, the first tier.
  const t = computeOrderTotals([line()], { type: "self_install", distanceKm: null }, rules);
  assert.equal(t.deliveryFeeCents, 15_000);
  assert.equal(t.installationFeeCents, 0);
  assert.equal(t.totalCents, 126_500 + 15_000);
});

test("the volume discount counts blinds AND extras", () => {
  // Blinds alone are under the R20 000 tier; with the extras the goods cross it.
  const big = line({ blindExVatCents: 1_652_174, blindVatCents: 247_826, blindIncVatCents: 1_900_000, extrasExVatCents: 100_000 });
  const t = computeOrderTotals([big], { type: "self_install", distanceKm: null }, rules);
  assert.equal(t.goodsIncVatCents, 2_015_000);
  assert.equal(t.discountRate, 0.025);
  assert.equal(t.discountCents, Math.round(2_015_000 * 0.025));
  assert.equal(t.totalCents, t.goodsIncVatCents - t.discountCents + t.deliveryFeeCents);
});

test("professional install refuses to price without a distance", () => {
  assert.throws(() => computeOrderTotals([line()], { type: "professional_install", distanceKm: null }, rules));
});

test("professional install charges labour, and transport beyond the free radius", () => {
  const near = computeOrderTotals([line()], { type: "professional_install", distanceKm: 50 }, rules);
  assert.equal(near.installationFeeCents, 75_000);
  assert.equal(near.deliveryFeeCents, 0);
  const far = computeOrderTotals([line()], { type: "professional_install", distanceKm: 80 }, rules);
  assert.equal(far.deliveryFeeCents, 80 * 1_200 * 2);
  assert.equal(far.totalCents, 126_500 + 75_000 + 192_000);
});

test("every amount is a whole number of cents", () => {
  const odd = line({ extrasExVatCents: 3_333 });
  const t = computeOrderTotals([odd, odd, odd], { type: "professional_install", distanceKm: 77 }, rules);
  for (const [k, v] of Object.entries(t)) if (k !== "discountRate") assert.ok(Number.isInteger(v), `${k} = ${v}`);
});
