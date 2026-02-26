/**
 * Facebook / Meta Pixel event helpers.
 * All events are gated behind cookie consent check.
 * Safe to call even if pixel isn't loaded — they're no-ops.
 */

import { hasConsent } from "@/components/shared/cookie-consent";

function track(event: string, params?: Record<string, unknown>) {
  if (typeof globalThis.fbq !== "function") return;
  if (!hasConsent()) return;
  if (params) {
    globalThis.fbq("track", event, params);
  } else {
    globalThis.fbq("track", event);
  }
}

export function trackViewContent(params: {
  content_name?: string;
  content_type?: string;
  value?: number;
  currency?: string;
}) {
  track("ViewContent", params);
}

export function trackAddToCart(params: {
  content_name?: string;
  value?: number;
  currency?: string;
}) {
  track("AddToCart", params);
}

export function trackInitiateCheckout(params?: {
  value?: number;
  currency?: string;
  num_items?: number;
}) {
  track("InitiateCheckout", params);
}

export function trackPurchase(params: {
  value: number;
  currency: string;
  content_type?: string;
}) {
  track("Purchase", params);
}

export function trackLead(params?: { content_name?: string }) {
  track("Lead", params);
}

export function trackSchedule(params?: { content_name?: string }) {
  track("Schedule", params);
}

export function trackSubscribe(params?: { content_name?: string }) {
  track("Subscribe", params);
}

export function trackSearch(params?: { search_string?: string }) {
  track("Search", params);
}
