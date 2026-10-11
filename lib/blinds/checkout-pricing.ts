import { lookupPrice, PriceInputError, getApplicableExtras, getMotorOptions } from "@/lib/pricing";
import { getInstallationPricing, getVolumeDiscounts, getCourierPricing } from "@/lib/pricing-rules";
import { createAdminClient } from "@/lib/supabase/admin";
import { roadDistanceKm } from "@/lib/distance";
import { computeOrderTotals, type DeliveryType, type OrderTotals, type TotalsLine } from "./order-totals";
import type { MountType, PriceLookupResult, SelectedExtra } from "@/types/blinds";

/**
 * Checkout's input, parsed, and its price, computed — shared by `/api/blinds/quote` (what the page
 * shows) and `/api/blinds/checkout` (what PayFast is asked for). Nothing the browser sends is a
 * price, a fee, a distance or a category: each is derived here from the database or the address.
 */

/** A refusal the customer can act on: the route answers it with `status`, never a 500. */
export class CheckoutInputError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

interface CheckoutItemInput {
  blind_range_id: string;
  colour: string;
  mount_type: MountType;
  width_mm: number;
  drop_mm: number;
  control_side: "left" | "right";
  location_label: string | null;
  extra_ids: string[];
}

export interface CheckoutInput {
  items: CheckoutItemInput[];
  customer: { name: string; email: string; phone: string };
  delivery_address: { street: string; city: string; province: string; postal_code: string };
  delivery_type: DeliveryType;
  customer_notes: string | null;
  /** The total the page showed the customer; checkout refuses if the server's differs. */
  expected_total_cents: number | null;
}

const MAX_ITEMS = 50;
const MAX_EXTRAS = 20;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** A trimmed string of at most `max` characters; `required` refuses an empty one. */
function text(v: unknown, field: string, max: number, required: boolean): string {
  if (v == null) v = "";
  if (typeof v !== "string") throw new CheckoutInputError(`${field} must be text`);
  const s = v.trim();
  if (required && !s) throw new CheckoutInputError(`${field} is required`);
  if (s.length > max) throw new CheckoutInputError(`${field} is too long`);
  return s;
}

// blind_ranges.id is a UUID; anything else would fail the range query as a 500 instead of a 400.
function uuid(v: unknown, field: string): string {
  if (typeof v !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) {
    throw new CheckoutInputError(`${field} is not valid`);
  }
  return v;
}

function oneOf<T extends string>(v: unknown, field: string, allowed: readonly T[]): T {
  if (typeof v !== "string" || !allowed.includes(v as T)) throw new CheckoutInputError(`${field} is not valid`);
  return v as T;
}

function wholeMm(v: unknown, field: string): number {
  if (typeof v !== "number" || !Number.isInteger(v) || v <= 0) {
    throw new CheckoutInputError(`${field} must be a positive whole number of millimetres`);
  }
  return v;
}

/** Validate the checkout body. Throws `CheckoutInputError` (a 400) on anything malformed. */
export function parseCheckoutBody(raw: unknown): CheckoutInput {
  if (!isRecord(raw)) throw new CheckoutInputError("Invalid request");
  if (!Array.isArray(raw.items) || raw.items.length === 0) throw new CheckoutInputError("Your cart is empty");
  if (raw.items.length > MAX_ITEMS) throw new CheckoutInputError(`At most ${MAX_ITEMS} blinds per order`);

  const items = raw.items.map((it: unknown, i: number): CheckoutItemInput => {
    const n = `Blind ${i + 1}`;
    if (!isRecord(it)) throw new CheckoutInputError(`${n} is not valid`);
    const extras = it.selected_extras ?? [];
    if (!Array.isArray(extras) || extras.length > MAX_EXTRAS) throw new CheckoutInputError(`${n}: accessories are not valid`);
    return {
      blind_range_id: uuid(it.blind_range_id, `${n}: range`),
      colour: text(it.colour, `${n}: colour`, 100, true),
      mount_type: oneOf(it.mount_type, `${n}: mount type`, ["inside", "outside"] as const),
      width_mm: wholeMm(it.width_mm, `${n}: width`),
      drop_mm: wholeMm(it.drop_mm, `${n}: drop`),
      control_side: oneOf(it.control_side, `${n}: control side`, ["left", "right"] as const),
      location_label: text(it.location_label, `${n}: location`, 100, false) || null,
      extra_ids: extras.map((e: unknown) => {
        if (!isRecord(e)) throw new CheckoutInputError(`${n}: accessories are not valid`);
        return text(e.extra_id, `${n}: accessory`, 64, true);
      }),
    };
  });

  const c = isRecord(raw.customer) ? raw.customer : {};
  const email = text(c.email, "Email", 254, true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new CheckoutInputError("Invalid email address");

  const a = isRecord(raw.delivery_address) ? raw.delivery_address : {};
  const expected = raw.expected_total_cents;
  if (expected != null && (typeof expected !== "number" || !Number.isInteger(expected) || expected < 0)) {
    throw new CheckoutInputError("Invalid expected total");
  }

  return {
    items,
    customer: { name: text(c.name, "Name", 200, true), email, phone: text(c.phone, "Phone", 40, true) },
    delivery_address: {
      street: text(a.street, "Street address", 200, true),
      city: text(a.city, "City", 100, true),
      province: text(a.province, "Province", 100, false),
      postal_code: text(a.postal_code, "Postal code", 20, false),
    },
    delivery_type: oneOf(raw.delivery_type, "Delivery type", ["self_install", "professional_install"] as const),
    customer_notes: text(raw.customer_notes, "Notes", 2000, false) || null,
    expected_total_cents: expected ?? null,
  };
}

interface PricedItem {
  item: CheckoutItemInput;
  price: PriceLookupResult;
  selected_extras: SelectedExtra[];
  extrasExVatCents: number;
}

export interface PricedCheckout {
  items: PricedItem[];
  totals: OrderTotals;
  /** The server's distance, for professional install; null otherwise. */
  distanceKm: number | null;
}

/** Price a parsed checkout entirely from server data. Throws `CheckoutInputError` on a refusal. */
export async function priceCheckout(input: CheckoutInput): Promise<PricedCheckout> {
  const supabase = createAdminClient();
  const rangeIds = [...new Set(input.items.map((i) => i.blind_range_id))];

  const [ranges, installation, discounts, courier, distance] = await Promise.all([
    supabase.from("blind_ranges").select("id, blind_types(category_id)").in("id", rangeIds),
    getInstallationPricing(),
    getVolumeDiscounts(),
    getCourierPricing(),
    input.delivery_type === "professional_install"
      ? roadDistanceKm({
          address: input.delivery_address.street,
          city: input.delivery_address.city,
          province: input.delivery_address.province,
          postal_code: input.delivery_address.postal_code,
        })
      : Promise.resolve(null),
  ]);

  if (ranges.error) throw new Error(`range lookup failed: ${ranges.error.message}`);
  const categoryOf = new Map<string, string>();
  for (const r of ranges.data ?? []) {
    const t = r.blind_types as unknown as { category_id: string } | { category_id: string }[] | null;
    const cat = Array.isArray(t) ? t[0]?.category_id : t?.category_id;
    if (cat) categoryOf.set(r.id as string, cat);
  }

  let distanceKm: number | null = null;
  if (distance) {
    if ("error" in distance) {
      throw new CheckoutInputError(
        `We could not work out the installation distance to your address (${distance.error}). Check the address, choose courier delivery, or contact us.`,
        422
      );
    }
    distanceKm = distance.distance_km;
  }

  let items: PricedItem[];
  try {
    items = await Promise.all(
      input.items.map(async (item) => {
        if (!categoryOf.has(item.blind_range_id)) throw new CheckoutInputError("A blind in your cart is no longer available");
        const price = await lookupPrice({
          blind_range_id: item.blind_range_id,
          width_mm: item.width_mm,
          drop_mm: item.drop_mm,
          mount_type: item.mount_type,
        });
        const selected_extras = await repriceExtras(item);
        return { item, price, selected_extras, extrasExVatCents: selected_extras.reduce((s, e) => s + e.price_cents, 0) };
      })
    );
  } catch (err) {
    // lookupPrice refuses an out-of-range size or a range with no prices: the customer's to fix.
    // Anything else (a failed read) is ours, and propagates as a 500 rather than a 400.
    if (err instanceof PriceInputError) throw new CheckoutInputError(err.message);
    throw err;
  }

  const lines: TotalsLine[] = items.map(({ item, price, extrasExVatCents }) => ({
    blindExVatCents: price.customer_price_cents,
    blindVatCents: price.vat_cents,
    blindIncVatCents: price.total_with_vat_cents,
    extrasExVatCents,
    category_id: categoryOf.get(item.blind_range_id)!,
    width_mm: item.width_mm,
    drop_mm: item.drop_mm,
  }));

  const totals = computeOrderTotals(lines, { type: input.delivery_type, distanceKm }, { installation, discounts, courier });
  return { items, totals, distanceKm };
}

/**
 * Each selected extra at the server's price for this blind, using the same width/drop the
 * configurator's accessories step priced it at. Extras and motors share the list (a motor is stored
 * as an extra keyed by its motor id). An id the server does not offer for this blind is refused.
 */
async function repriceExtras(item: CheckoutItemInput): Promise<SelectedExtra[]> {
  if (!item.extra_ids.length) return [];
  const widthCm = Math.ceil(item.width_mm / 10);
  const dropCm = Math.ceil(item.drop_mm / 10);
  const [extras, motors] = await Promise.all([
    getApplicableExtras(item.blind_range_id, widthCm),
    getMotorOptions(widthCm, dropCm),
  ]);
  // Name as well as price: the name is printed on the supplier's order form.
  const offered = new Map<string, { name: string; price_cents: number }>([
    ...extras.map((e) => [e.id, { name: e.name, price_cents: e.price_cents }] as const),
    ...motors
      .filter((m) => m.compatible)
      .map((m) => [m.id, { name: `${m.brand} ${m.model}`.trim(), price_cents: m.price_cents }] as const),
  ]);
  return item.extra_ids.map((id) => {
    const server = offered.get(id);
    if (!server) throw new CheckoutInputError("An accessory in your cart is not available for this blind");
    return { extra_id: id, ...server };
  });
}
