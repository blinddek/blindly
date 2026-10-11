// parseVatPercent is the guard both sides of the one VAT rate use: getVatPercent refuses what it
// refuses (and so fails the price), and updateVatPercent will not save it (G-13).
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseVatPercent } from "@/lib/pricing/vat";

test("a rate from 0 to 100, as text or a number, is a rate", () => {
  assert.equal(parseVatPercent("15"), 15);
  assert.equal(parseVatPercent(" 15 "), 15);
  assert.equal(parseVatPercent(0), 0);
  assert.equal(parseVatPercent("100"), 100);
  assert.equal(parseVatPercent("15.5"), 15.5);
});

test("an empty, non-numeric or out-of-range value is not a rate (migration 027: value TEXT DEFAULT '')", () => {
  for (const v of ["", "   ", "abc", "NaN", "-1", "101", Number.NaN, Infinity, null, undefined, true, {}]) {
    assert.equal(parseVatPercent(v), null, `${JSON.stringify(v)} must be refused`);
  }
});
