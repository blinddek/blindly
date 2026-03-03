/**
 * Blindly-specific TypeScript types.
 * Maps to migrations 026–030 (blinds products, pricing, orders, quotes).
 */

// ─── Product Catalogue ──────────────────────────────────

export interface BlindCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlindType {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  slat_size_mm: number | null;
  material: string | null;
  description: string | null;
  features: Record<string, boolean>;
  min_width_cm: number;
  max_width_cm: number;
  min_drop_cm: number;
  max_drop_cm: number;
  min_frame_depth_mm: number | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ColourOption {
  name: string;
  hex: string;
  swatch_url?: string;
}

export interface BlindRange {
  id: string;
  blind_type_id: string;
  name: string;
  slug: string;
  description: string | null;
  colour_options: ColourOption[];
  swatch_image_url: string | null;
  lifestyle_image_url: string | null;
  starting_price_cents: number | null;
  supplier: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PriceMatrix {
  id: string;
  blind_range_id: string;
  width_cm: number;
  drop_cm: number;
  supplier_price_cents: number;
  created_at: string;
}

export interface VerticalSlatMapping {
  id: string;
  blind_type_id: string;
  width_cm: number;
  slat_count: number;
}

// ─── Pricing & Extras ───────────────────────────────────

export type PricingType = "fixed" | "width_based" | "per_unit";
export type MarkupScope = "global" | "category" | "type" | "range";

export interface BlindExtra {
  id: string;
  name: string;
  description: string | null;
  applies_to_categories: string[] | null;
  applies_to_types: string[] | null;
  pricing_type: PricingType;
  fixed_price_cents: number | null;
  max_width_cm: number | null;
  is_upgrade: boolean;
  replaces_extra_id: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExtraPricePoint {
  id: string;
  extra_id: string;
  width_cm: number;
  price_cents: number;
}

export interface MechanismLookup {
  id: string;
  width_cm: number;
  drop_cm: number;
  tube_size: string;
}

export interface MotorisationOption {
  id: string;
  brand: string;
  model: string;
  tube_size_mm: number | null;
  description: string | null;
  is_rechargeable: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MotorisationPrice {
  id: string;
  motor_id: string;
  width_cm: number;
  price_cents: number;
}

export interface MarkupConfig {
  id: string;
  scope_type: MarkupScope;
  scope_id: string | null;
  markup_percent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PriceImport {
  id: string;
  filename: string;
  supplier: string;
  sheets_processed: number;
  prices_created: number;
  prices_updated: number;
  prices_unchanged: number;
  import_mode: "replace_all" | "update_changed";
  imported_by: string | null;
  error_log: Record<string, unknown> | null;
  created_at: string;
}

export interface ImportMapping {
  id: string;
  supplier: string;
  sheet_name: string;
  maps_to_range_id: string | null;
  parser_type: ParserType;
  display_name: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  slug: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Client-supplied sheet→range mapping override from the import UI. */
export interface SheetMappingOverride {
  sheet_name: string;
  parser_type: ParserType;
  maps_to_range_ids: string[];
  skip: boolean;
}

/** Preview of a parsed sheet for the import wizard UI. */
export interface SheetPreview {
  sheet_name: string;
  detected_parser: ParserType;
  stats: { rows: number; cols: number; prices: number };
  sample_data: unknown[][];
  existing_mapping: ImportMapping | null;
}

/** Full parse preview returned before import confirmation. */
export interface ParsePreview {
  filename: string;
  sheets: SheetPreview[];
  errors: string[];
}

// ─── Orders ─────────────────────────────────────────────

export type BlindlyOrderStatus =
  | "new"
  | "confirmed"
  | "ordered_from_supplier"
  | "shipped"
  | "delivered"
  | "installed"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type MountType = "inside" | "outside";
export type ControlSide = "left" | "right";
export type Stacking = "left" | "right" | "centre_stack" | "centre_open";

export interface BlindlyOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: {
    street: string;
    city: string;
    province: string;
    postal_code: string;
  } | null;
  delivery_type: "self_install" | "professional_install";
  interested_in_other_services: boolean;
  subtotal_cents: number;
  extras_total_cents: number;
  delivery_fee_cents: number;
  installation_fee_cents: number;
  vat_cents: number;
  total_cents: number;
  paystack_reference: string | null;
  paystack_access_code: string | null;
  payment_status: PaymentStatus;
  order_status: BlindlyOrderStatus;
  customer_notes: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SelectedExtra {
  extra_id: string;
  name: string;
  price_cents: number;
}

export interface BlindlyOrderItem {
  id: string;
  order_id: string;
  blind_range_id: string;
  location_label: string | null;
  mount_type: MountType;
  quantity: number;
  width_mm: number;
  drop_mm: number;
  matched_width_cm: number;
  matched_drop_cm: number;
  colour: string;
  control_side: ControlSide | null;
  stacking: Stacking | null;
  supplier_price_cents: number;
  markup_percent: number;
  markup_cents: number;
  extras_cents: number;
  line_total_cents: number;
  selected_extras: SelectedExtra[];
  room_preview_image_url: string | null;
  display_order: number;
  created_at: string;
}

export interface BlindlyOrderWithItems extends BlindlyOrder {
  items: BlindlyOrderItem[];
}

// ─── Quotes & Leads ─────────────────────────────────────

export interface SavedQuote {
  id: string;
  quote_token: string;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  cart_data: unknown;
  total_cents: number;
  email_sent_24h: boolean;
  email_sent_72h: boolean;
  email_sent_7d: boolean;
  converted_to_order_id: string | null;
  expires_at: string;
  created_at: string;
}

export type SwatchStatus = "new" | "sent" | "delivered";

export interface SwatchRequest {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  delivery_address: {
    street: string;
    city: string;
    province: string;
    postal_code: string;
  };
  blind_range_id: string | null;
  colour: string;
  status: SwatchStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type MeasureStatus =
  | "new"
  | "contacted"
  | "scheduled"
  | "completed"
  | "cancelled";

export interface MeasureRequest {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address: {
    street: string;
    city: string;
    province: string;
    postal_code: string;
  } | null;
  preferred_method: "in_person" | "virtual";
  notes: string | null;
  status: MeasureStatus;
  scheduled_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Pricing Engine ─────────────────────────────────────

export interface PriceLookupInput {
  blind_range_id: string;
  width_mm: number;
  drop_mm: number;
  mount_type: MountType;
}

export interface PriceLookupResult {
  supplier_price_cents: number;
  markup_percent: number;
  markup_cents: number;
  customer_price_cents: number;
  matched_width_cm: number;
  matched_drop_cm: number;
  vat_cents: number;
  total_with_vat_cents: number;
}

/** Customer-facing price (no supplier cost exposed) */
export interface CustomerPriceResult {
  customer_price_cents: number;
  matched_width_cm: number;
  matched_drop_cm: number;
  vat_cents: number;
  total_with_vat_cents: number;
}

export interface ExtraWithPrice {
  id: string;
  name: string;
  description: string | null;
  pricing_type: PricingType;
  price_cents: number;
  is_upgrade: boolean;
}

export interface MotorOptionWithPrice {
  id: string;
  brand: string;
  model: string;
  is_rechargeable: boolean;
  price_cents: number;
  compatible: boolean;
  incompatible_reason?: string;
}

export interface AvailableGrid {
  widths: number[];
  drops: number[];
  min_width_cm: number;
  max_width_cm: number;
  min_drop_cm: number;
  max_drop_cm: number;
}

// ─── XLS Parser ─────────────────────────────────────────

export type ParserType =
  | "standard_matrix"
  | "extras"
  | "mechanisms"
  | "motorisation"
  | "vertical";

export interface StandardMatrixResult {
  sheet_name: string;
  widths: number[];
  drops: number[];
  prices: number[][];
  valance_prices: number[] | null;
  row_count: number;
  col_count: number;
  total_prices: number;
}

export interface ExtrasResult {
  items: {
    name: string;
    widths: number[];
    prices: number[];
    max_width: number | null;
    pricing_type: "fixed" | "width_based";
  }[];
}

export interface MechanismsResult {
  entries: {
    width_cm: number;
    drop_cm: number;
    tube_size: string;
  }[];
}

export interface MotorisationResult {
  tube_cost: { widths: number[]; prices: number[] };
  motors: {
    brand: string;
    model: string;
    is_rechargeable: boolean;
    widths: number[];
    prices: number[];
  }[];
}

export interface VerticalResult {
  sheet_name: string;
  widths: number[];
  slat_counts: number[];
  drops: number[];
  prices: number[][];
  row_count: number;
  col_count: number;
  total_prices: number;
}

export interface SheetResult {
  sheet_name: string;
  detected_parser: ParserType;
  data:
    | StandardMatrixResult
    | ExtrasResult
    | MechanismsResult
    | MotorisationResult
    | VerticalResult;
  stats: {
    rows: number;
    cols: number;
    prices: number;
  };
}

export interface ParseResult {
  filename: string;
  sheets: SheetResult[];
  summary: {
    total_sheets: number;
    total_prices: number;
    errors: string[];
  };
}
