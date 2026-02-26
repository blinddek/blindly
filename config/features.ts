/**
 * Feature flag helper — tier-aware.
 *
 * Usage:
 *   import { isEnabled } from "@/config/features";
 *   if (isEnabled("blog")) { ... }
 *
 * A feature is enabled if:
 *   1. Explicitly set to `true` in siteConfig.features, OR
 *   2. Included in the tier's default feature set
 */

import { siteConfig, type Tier } from "./site";

const TIER_FEATURES: Record<Tier, string[]> = {
  brochure: [],
  business: ["blog", "portfolio", "newsletter"],
  commerce: [
    "blog", "portfolio", "newsletter", "shop",
    "customerAuth", "portal", "billing", "coupons",
  ],
};

type FeatureKey = keyof typeof siteConfig.features;

export function isEnabled(feature: string): boolean {
  const featureKey = feature as FeatureKey;

  // Explicit opt-in/out in config takes priority
  if (featureKey in siteConfig.features) {
    if (siteConfig.features[featureKey] === true) return true;
    // If explicitly false, still check tier defaults
  }

  // Tier-based defaults
  return TIER_FEATURES[siteConfig.tier]?.includes(feature) ?? false;
}

/**
 * Feature dependency rules (enforced by setup-db.sh):
 *   sessionCredits  → booking + customerAuth
 *   billing         → customerAuth
 *   clientOnboarding → customerAuth
 *   hybridPackages  → shop or booking
 *   coupons         → shop or booking
 *   clientImport    → customerAuth
 *   microsoftGraph  → booking
 *   googleCalendar  → booking
 *
 * seoAdvanced is always opt-in (not included in any tier by default).
 * facebookPixel is opt-in — fires on all pages when enabled.
 */
