/**
 * CMS types for the client template.
 * Stripped of Yoros-specific types (pricing tiers, quote wizard, etc.)
 */

// ─── Localization ─────────────────────────────────────────

export type LocalizedString = { en: string; af: string };

// ─── Site Settings ────────────────────────────────────────

export interface SiteSettings {
  logo_text: string;
  company_name: string;
  company_tagline: LocalizedString;
  login_label: LocalizedString;
  login_url: string;
  cta_label: LocalizedString;
  cta_url: string;
  registration_number?: string;
  whatsapp_number?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  google_maps_url?: string;
  google_maps_coordinates?: { lat: number; lng: number };
  coordinates?: string;
  business_hours?: string | DaySchedule[];
  social_links?: { platform: string; url: string }[];
  social_facebook?: string;
  social_instagram?: string;
  social_twitter?: string;
  social_linkedin?: string;
  social_youtube?: string;
  social_tiktok?: string;
  facebook_pixel_id?: string;
}

// ─── Business Hours ──────────────────────────────────────

export interface DaySchedule {
  day: string;
  open: boolean;
  from: string;
  to: string;
}

// ─── Navigation ───────────────────────────────────────────

export interface NavLink {
  id: string;
  label: LocalizedString;
  href: string;
  display_order: number;
  is_active: boolean;
  hide_in_nav: boolean;
}

export interface FooterLink {
  label: LocalizedString;
  href: string;
}

export interface FooterSection {
  id: string;
  title: LocalizedString;
  links: FooterLink[];
  display_order: number;
  is_active: boolean;
}

// ─── Homepage Sections ────────────────────────────────────

export interface HomepageSection {
  id: string;
  section_key: string;
  content: Record<string, unknown>;
  display_order: number;
  is_active: boolean;
}

// ─── FAQ ──────────────────────────────────────────────────

export interface Faq {
  id: string;
  question: LocalizedString;
  answer: LocalizedString;
  display_order: number;
  is_active: boolean;
}

// ─── Page SEO ─────────────────────────────────────────────

export interface PageSeo {
  id: string;
  page_key: string;
  title: LocalizedString;
  description: LocalizedString;
  og_image_url: string | null;
  keywords: string | null;
  og_type: string | null;
  twitter_card: string | null;
  canonical_url: string | null;
  noindex: boolean;
  priority: number | null;
  changefreq: string | null;
}

// ─── Section Meta (used by section-header-form) ─────────

export interface SectionMeta {
  heading: LocalizedString;
  subheading: LocalizedString;
  cta_label?: LocalizedString;
  cta_url?: string;
  cta_icon?: string;
  footer_note?: LocalizedString;
}

// ─── Aggregated Layout Data ───────────────────────────────

export interface LayoutData {
  siteSettings: SiteSettings;
  navLinks: NavLink[];
  footerSections: FooterSection[];
}
