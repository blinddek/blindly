/**
 * Master site configuration — controls tier, features, branding, and locale.
 *
 * Every visible string, image, and colour comes from DB or this config.
 * The setup script (`scripts/setup.sh`) or `scripts/setup-from-yoros.ts`
 * generates this file from the project manifest.
 */

export type Tier = "brochure" | "business" | "commerce";

export interface SiteConfig {
  name: string;
  description: string;
  domain: string;
  tier: Tier;
  locale: {
    default: "en" | "af";
    supported: ("en" | "af")[];
  };
  currency: string;
  timezone: string;
  brand: {
    primary: string;
    secondary: string;
    accent: string;
    dark: string;
    font: {
      heading: string;
      body: string;
    };
  };
  features: {
    blog: boolean;
    portfolio: boolean;
    booking: boolean;
    shop: boolean;
    lms: boolean;
    newsletter: boolean;
    i18n: boolean;
    customerAuth: boolean;
    portal: boolean;
    darkMode: boolean;
    whatsapp: boolean;
    googleMaps: boolean;
    serviceAreaPages: boolean;
    seoAdvanced: boolean;
    facebookPixel: boolean;
    googleCalendar: boolean;
    sessionCredits: boolean;
    billing: boolean;
    legalDocs: boolean;
    clientOnboarding: boolean;
    emailCampaigns: boolean;
    dripEmails: boolean;
    hybridPackages: boolean;
    multiCurrency: boolean;
    coupons: boolean;
    gifts: boolean;
    clientImport: boolean;
    blindsImport: boolean;
    microsoftGraph: boolean;
  };
  integrations: {
    paystack: boolean;
    googleAnalytics: boolean;
    resend: boolean;
  };
  pages: {
    home: boolean;
    about: boolean;
    services: boolean;
    contact: boolean;
    faq: boolean;
    terms: boolean;
    privacy: boolean;
  };
  /** Booking cancel/reschedule thresholds. Only used when features.booking is true. */
  bookingPolicy?: {
    cancelNoticeHours: number;
    maxReschedules: number;
    rescheduleNoticeHours: number;
    lateCancelForfeit: boolean;
    allowSameDayBooking: boolean;
  };
  /** Which optional profile fields to show. Only used when features.customerAuth is true. */
  clientFields?: {
    dateOfBirth: boolean;
    gender: boolean;
    address: boolean;
    relationshipStatus: boolean;
    emergencyContact: boolean;
    referralSource: boolean;
    medicalInfo: boolean;
    companyName: boolean;
  };
}

export const siteConfig: SiteConfig = {
  name: "Blindly",
  description: "Premium custom window blinds — configured to your exact specifications.",
  domain: "blindly.co.za",
  tier: "commerce",
  locale: { default: "en", supported: ["en"] },
  currency: "ZAR",
  timezone: "Africa/Johannesburg",
  brand: {
    primary: "#C4663A",
    secondary: "#6B8F71",
    accent: "#C4663A",
    dark: "#3A3632",
    font: { heading: "DM Serif Display", body: "DM Sans" },
  },
  features: {
    blog: false,
    portfolio: false,
    booking: false,
    shop: true,
    lms: false,
    newsletter: true,
    i18n: false,
    customerAuth: true,
    portal: true,
    darkMode: true,
    whatsapp: true,
    googleMaps: true,
    serviceAreaPages: false,
    seoAdvanced: false,
    facebookPixel: false,
    googleCalendar: false,
    sessionCredits: false,
    billing: false,
    legalDocs: false,
    clientOnboarding: false,
    emailCampaigns: true,
    dripEmails: true,
    hybridPackages: false,
    multiCurrency: false,
    coupons: false,
    gifts: false,
    clientImport: false,
    blindsImport: true,
    microsoftGraph: false,
  },
  integrations: {
    paystack: true,
    googleAnalytics: true,
    resend: true,
  },
  pages: {
    home: true,
    about: true,
    services: false,
    contact: true,
    faq: true,
    terms: true,
    privacy: true,
  },
};
