// ─── Installation Pricing ─────────────────────────────────────────────────────

export interface InstallationTier {
  min_blinds: number;
  max_blinds: number | null; // null = no upper limit
  cost_cents: number;
}

export interface InstallationPricing {
  transport_free_radius_km: number;
  price_per_km_cents: number; // per km one-way (doubled for round trip)
  tiers: InstallationTier[];
}

export const DEFAULT_INSTALLATION_PRICING: InstallationPricing = {
  transport_free_radius_km: 50,
  price_per_km_cents: 1200, // R12/km, round trip = R24/km
  tiers: [
    { min_blinds: 1, max_blinds: 2, cost_cents: 75000 },   // R750
    { min_blinds: 3, max_blinds: 4, cost_cents: 60000 },   // R600
    { min_blinds: 5, max_blinds: 7, cost_cents: 40000 },   // R400
    { min_blinds: 8, max_blinds: null, cost_cents: 0 },    // free
  ],
};

// ─── Volume Discounts ─────────────────────────────────────────────────────────

export interface VolumeDiscountTier {
  min_cents: number;
  max_cents: number | null; // null = no upper limit
  rate: number;             // 0.025 = 2.5%
}

export interface VolumeDiscounts {
  tiers: VolumeDiscountTier[];
}

export const DEFAULT_VOLUME_DISCOUNTS: VolumeDiscounts = {
  tiers: [
    { min_cents: 2000000,  max_cents: 2499999, rate: 0.025 }, // R20k–R24,999
    { min_cents: 2500000,  max_cents: 2999999, rate: 0.030 }, // R25k–R29,999
    { min_cents: 3000000,  max_cents: 3999999, rate: 0.035 }, // R30k–R39,999
    { min_cents: 4000000,  max_cents: null,    rate: 0.050 }, // R40k+
  ],
};

// ─── Pure calculators (safe to use client + server) ──────────────────────────

/** Returns the installation cost tier for N blinds, or null if no rule matches. */
export function getInstallationTier(
  blindCount: number,
  pricing: InstallationPricing
): InstallationTier | null {
  return (
    pricing.tiers.find(
      (t) =>
        blindCount >= t.min_blinds &&
        (t.max_blinds === null || blindCount <= t.max_blinds)
    ) ?? null
  );
}

/** Installation labour cost: blindCount × tier rate (per blind). */
export function calcInstallationCents(
  blindCount: number,
  pricing: InstallationPricing
): number {
  const tier = getInstallationTier(blindCount, pricing);
  if (!tier) return 0;
  return tier.cost_cents * blindCount;
}

/** Transport cost for a given distance (round trip). Free within free radius. */
export function calcTransportCents(
  distanceKm: number,
  pricing: InstallationPricing
): number {
  if (distanceKm <= pricing.transport_free_radius_km) return 0;
  return Math.round(distanceKm * pricing.price_per_km_cents * 2);
}

/** Returns discount rate (0–1) for a given VAT-inclusive cart total, or 0 if no tier applies. */
export function getDiscountRate(
  grandTotalCents: number,
  discounts: VolumeDiscounts
): number {
  const tier = discounts.tiers.find(
    (t) =>
      grandTotalCents >= t.min_cents &&
      (t.max_cents === null || grandTotalCents <= t.max_cents)
  );
  return tier?.rate ?? 0;
}

/** Discount amount in cents for a given rate and grand total. */
export function calcDiscountCents(grandTotalCents: number, rate: number): number {
  return Math.round(grandTotalCents * rate);
}

// ─── Courier Pricing ──────────────────────────────────────────────────────────

export interface CourierTier {
  min_kg: number;
  max_kg: number | null; // null = no upper limit
  cost_cents: number;
}

export interface CategoryWeight {
  category_id: string;
  category_name: string;
  weight_per_m2_kg: number;
}

export interface CourierPricing {
  packaging_kg: number;
  category_weights: CategoryWeight[];
  tiers: CourierTier[];
}

export const DEFAULT_COURIER_PRICING: CourierPricing = {
  packaging_kg: 0.5,
  category_weights: [],
  tiers: [
    { min_kg: 0,  max_kg: 5,    cost_cents: 15_000 }, // R150
    { min_kg: 5,  max_kg: 15,   cost_cents: 25_000 }, // R250
    { min_kg: 15, max_kg: null, cost_cents: 40_000 }, // R400
  ],
};

/** Weight of a single blind in kg based on its area and the category's kg/m². */
export function calcItemWeightKg(
  item: { category_id: string; width_mm: number; drop_mm: number },
  categoryWeights: CategoryWeight[]
): number {
  const cw = categoryWeights.find((c) => c.category_id === item.category_id);
  if (!cw) return 0;
  const m2 = (item.width_mm / 1000) * (item.drop_mm / 1000);
  return m2 * cw.weight_per_m2_kg;
}

/** Total shipment weight in kg (all blinds + packaging). */
export function calcTotalWeightKg(
  items: { category_id: string; width_mm: number; drop_mm: number }[],
  courierPricing: CourierPricing
): number {
  const blindWeight = items.reduce(
    (sum, item) => sum + calcItemWeightKg(item, courierPricing.category_weights),
    0
  );
  return blindWeight + courierPricing.packaging_kg;
}

/** Courier cost in cents for the given cart items based on weight tiers. */
export function calcCourierCents(
  items: { category_id: string; width_mm: number; drop_mm: number }[],
  courierPricing: CourierPricing
): number {
  if (courierPricing.tiers.length === 0) return 0;
  const totalKg = calcTotalWeightKg(items, courierPricing);
  const tier = courierPricing.tiers.find(
    (t) => totalKg >= t.min_kg && (t.max_kg === null || totalKg < t.max_kg)
  );
  return tier?.cost_cents ?? 0;
}
