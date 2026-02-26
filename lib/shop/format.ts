import { siteConfig } from "@/config/site";

const CURRENCY_SYMBOLS: Record<string, string> = {
  ZAR: "R",
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "CA$",
  AUD: "A$",
  NZD: "NZ$",
  CHF: "CHF",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  BRL: "R$",
  KES: "KSh",
  NGN: "₦",
  BWP: "P",
};

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_SYMBOLS);

export function getCurrencySymbol(currency?: string): string {
  const code = currency ?? siteConfig.currency;
  return CURRENCY_SYMBOLS[code] ?? code;
}

/**
 * Format price from cents to display string.
 * e.g. 15000 → "R 150.00" for ZAR
 */
export function formatPrice(cents: number, currency?: string): string {
  const code = currency ?? siteConfig.currency;
  // JPY has no decimal subdivision
  const amount = code === "JPY" ? Math.round(cents / 100).toString() : (cents / 100).toFixed(2);
  const symbol = CURRENCY_SYMBOLS[code];
  if (symbol) {
    // Symbols that are single chars or short get a space before the amount
    return `${symbol} ${amount}`;
  }
  return `${code} ${amount}`;
}
