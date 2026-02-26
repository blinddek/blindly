/**
 * Email template types for the client template.
 * Stripped down from Yoros's 30+ templates to just the template-relevant set.
 */

export type EmailTemplate =
  // Registration
  | "welcome"
  // Bookings (if booking enabled)
  | "booking_confirmed"
  | "booking_reminder_24h"
  | "booking_reminder_1h"
  | "booking_cancellation"
  | "admin_new_booking"
  // Newsletter
  | "newsletter_welcome"
  // Contact
  | "contact_form_confirmation"
  // Shop / Orders
  | "order_confirmation"
  | "admin_new_order"
  // LMS / Courses
  | "enrollment_confirmation"
  // Admin notifications
  | "admin_new_message";

// ─── Template Props ───────────────────────────────────────

export interface WelcomeProps {
  clientName: string;
  portalUrl: string;
}

export interface BookingConfirmedProps {
  clientName: string;
  bookingType: string;
  date: string;
  time: string;
  videoLink?: string;
  portalUrl: string;
}

export interface BookingReminder24hProps {
  clientName: string;
  bookingType: string;
  date: string;
  time: string;
  videoLink?: string;
  portalUrl: string;
}

export interface BookingReminder1hProps {
  clientName: string;
  bookingType: string;
  time: string;
  videoLink?: string;
  portalUrl: string;
}

export interface BookingCancellationProps {
  clientName: string;
  bookingType: string;
  date: string;
  time: string;
  bookingUrl: string;
}

export interface AdminNewBookingProps {
  clientName: string;
  clientEmail: string;
  bookingType: string;
  date: string;
  time: string;
  adminUrl: string;
}

export interface NewsletterWelcomeProps {
  subscriberName?: string;
  unsubscribeToken: string;
}

export interface ContactFormConfirmationProps {
  senderName: string;
}

export interface OrderConfirmationProps {
  customerName: string;
  orderReference: string;
  items: { name: string; quantity: number; price_cents: number }[];
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
}

export interface AdminNewOrderProps {
  orderReference: string;
  customerEmail: string;
  total: string;
  itemCount: number;
  adminUrl: string;
}

export interface EnrollmentConfirmationProps {
  studentName: string;
  courseName: string;
  courseUrl: string;
}

export interface AdminNewMessageProps {
  clientName: string;
  projectName: string;
  messagePreview: string;
  adminUrl: string;
}
