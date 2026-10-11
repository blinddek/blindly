import {
  getDiscountRate,
  calcDiscountCents,
  calcInstallationCents,
  calcTransportCents,
  calcCourierCents,
  type InstallationPricing,
  type VolumeDiscounts,
  type CourierPricing,
} from "@/types/pricing-rules";

/**
 * The one computation of what an order costs. Pure: every input is already server-derived (prices
 * from `lookupPrice`, extras from the server's list, category from the range, distance from the
 * address), so the quote the page shows and the amount PayFast is asked for are the same function's
 * output. Decisions it holds (brief/DECISIONS.md, 2026-10-11):
 *   · the volume discount applies to blinds AND extras, VAT-inclusive;
 *   · self-install pays the courier fee by weight; professional install pays labour + transport.
 * Fees are VAT-inclusive amounts, as the rules store them.
 */
const VAT_RATE = 0.15;

export interface TotalsLine {
  /** Blind price ex VAT, its VAT and the sum, as `lookupPrice` returned them. */
  blindExVatCents: number;
  blindVatCents: number;
  blindIncVatCents: number;
  /** Server-priced extras for this blind, ex VAT. */
  extrasExVatCents: number;
  /** For the courier weight: the blind's category and size. */
  category_id: string;
  width_mm: number;
  drop_mm: number;
}

export type DeliveryType = "self_install" | "professional_install";

export interface OrderRules {
  installation: InstallationPricing;
  discounts: VolumeDiscounts;
  courier: CourierPricing;
}

export interface OrderTotals {
  /** Goods ex VAT: blinds + extras. */
  subtotalCents: number;
  /** VAT on the goods. */
  vatCents: number;
  /** Goods VAT-inclusive, before discount. */
  goodsIncVatCents: number;
  discountRate: number;
  discountCents: number;
  installationFeeCents: number;
  /** Transport (professional) or courier (self-install). */
  deliveryFeeCents: number;
  totalCents: number;
}

/** VAT-inclusive line total for one blind and its extras — what the order item stores. */
export function lineIncVatCents(line: Pick<TotalsLine, "blindIncVatCents" | "extrasExVatCents">): number {
  return line.blindIncVatCents + line.extrasExVatCents + Math.round(line.extrasExVatCents * VAT_RATE);
}

export function computeOrderTotals(
  lines: TotalsLine[],
  delivery: { type: DeliveryType; distanceKm: number | null },
  rules: OrderRules
): OrderTotals {
  const extrasExVat = lines.reduce((s, l) => s + l.extrasExVatCents, 0);
  const subtotalCents = lines.reduce((s, l) => s + l.blindExVatCents, 0) + extrasExVat;
  const vatCents =
    lines.reduce((s, l) => s + l.blindVatCents, 0) +
    lines.reduce((s, l) => s + Math.round(l.extrasExVatCents * VAT_RATE), 0);
  const goodsIncVatCents = lines.reduce((s, l) => s + lineIncVatCents(l), 0);

  const discountRate = getDiscountRate(goodsIncVatCents, rules.discounts);
  const discountCents = calcDiscountCents(goodsIncVatCents, discountRate);

  let installationFeeCents = 0;
  let deliveryFeeCents: number;
  if (delivery.type === "professional_install") {
    if (delivery.distanceKm == null) throw new Error("professional install is priced only with a distance");
    installationFeeCents = calcInstallationCents(lines.length, rules.installation);
    deliveryFeeCents = calcTransportCents(delivery.distanceKm, rules.installation);
  } else {
    deliveryFeeCents = calcCourierCents(lines, rules.courier);
  }

  return {
    subtotalCents,
    vatCents,
    goodsIncVatCents,
    discountRate,
    discountCents,
    installationFeeCents,
    deliveryFeeCents,
    totalCents: goodsIncVatCents - discountCents + installationFeeCents + deliveryFeeCents,
  };
}
