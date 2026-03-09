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
