/**
 * Shared TypeScript types for the client template.
 * Shared TypeScript types for Blindly.
 */

// ─── Auth & Users ─────────────────────────────────────────

export type UserRole = "admin" | "customer";

export interface UserProfile {
  id: string;
  role: string;
  full_name: string;
  phone: string;
  business_name: string;
  avatar_url: string | null;
  notification_prefs: { email: boolean; sms: boolean };
  email: string;
  // Extended profile fields (from 017_extended_profiles migration)
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  relationship_status: string | null;
  emergency_contact: string | null;
  referral_source: string | null;
  referral_detail: string | null;
  medical_info: string | null;
  company_name: string | null;
  password_changed: boolean;
  billing_type: string;
  status: string;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Contact ──────────────────────────────────────────────

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  read: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Newsletter ───────────────────────────────────────────

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name: string | null;
  source: string;
  deleted_at: string | null;
  created_at: string;
}

// ─── Blog ─────────────────────────────────────────────────

export interface BlogPost {
  id: string;
  slug: string;
  title: LocalizedString;
  excerpt: LocalizedString | null;
  content: LocalizedString | null;
  author: string;
  category_id: string | null;
  tags: string[];
  featured_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogCategory {
  id: string;
  name: LocalizedString;
  slug: string;
  description: LocalizedString | null;
}

// ─── Portfolio ────────────────────────────────────────────

export interface PortfolioItem {
  id: string;
  slug: string;
  title: LocalizedString;
  description: LocalizedString | null;
  hero_image_url: string | null;
  images: string[];
  alt_text: LocalizedString | null;
  industry: string | null;
  features: LocalizedString[];
  tech_stack: string[];
  live_url: string | null;
  is_featured: boolean;
  is_published: boolean;
  deleted_at: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// ─── Booking ──────────────────────────────────────────────

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

export interface BookingService {
  id: string;
  name: LocalizedString;
  description: LocalizedString | null;
  duration_minutes: number;
  buffer_minutes: number;
  price_cents: number;
  cancellation_cutoff_hours: number;
  max_advance_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string | null;
  service_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  notes: string | null;
  client_notes: string | null;
  admin_notes: string | null;
  meeting_url: string | null;
  google_calendar_event_id: string | null;
  confirmation_token: string;
  reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Shop ─────────────────────────────────────────────────

export type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled";

export interface Product {
  id: string;
  name: LocalizedString;
  slug: string;
  description: LocalizedString | null;
  price_cents: number;
  images: string[];
  category_id: string | null;
  stock_quantity: number;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: string;
  name: LocalizedString;
  slug: string;
  image: string | null;
  is_active: boolean;
  deleted_at: string | null;
}

export interface Order {
  id: string;
  user_id: string | null;
  email: string;
  status: OrderStatus;
  total_cents: number;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  items: OrderItem[];
  shipping: ShippingAddress;
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price_cents: number;
  quantity: number;
}

export interface ShippingAddress {
  name: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  province: string;
  postal_code: string;
  phone: string;
}

// ─── Activity Log ─────────────────────────────────────────

export interface ActivityLogEntry {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

// ─── Localization ─────────────────────────────────────────

export type LocalizedString = { en: string; af: string };
