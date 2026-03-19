import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Mail, User, Truck, StickyNote } from "lucide-react";
import { getBlindlyOrderWithItems } from "@/lib/admin/queries";
import { OrderStatusSelect } from "./order-status-select";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRand(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  refunded: "bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400",
};

const DELIVERY_LABEL: Record<string, string> = {
  self_install: "Self Install (DIY)",
  professional_install: "Professional Installation",
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getBlindlyOrderWithItems(id);

  if (!order) notFound();

  const address = order.delivery_address;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/blinds/orders"
            className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Order #{order.order_number}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Placed {formatDate(order.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
              PAYMENT_STATUS_STYLES[order.payment_status] ??
              "bg-muted text-muted-foreground"
            }`}
          >
            Payment: {order.payment_status}
          </span>
          <OrderStatusSelect orderId={order.id} currentStatus={order.order_status} />
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — order items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="rounded-xl border bg-card">
            <div className="px-5 py-4 border-b">
              <h2 className="font-semibold">
                Order Items ({order.items.length})
              </h2>
            </div>
            <div className="divide-y">
              {order.items.map((item, idx) => {
                const rangeName =
                  (item as unknown as { range_display_name?: string }).range_display_name ??
                  "Blind";
                return (
                  <div key={item.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            #{idx + 1}
                          </span>
                          <h3 className="font-medium text-sm truncate">
                            {rangeName}
                          </h3>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-xs text-muted-foreground mt-2">
                          {item.location_label && (
                            <div>
                              <span className="font-medium text-foreground">
                                Location:
                              </span>{" "}
                              {item.location_label}
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-foreground">
                              Dimensions:
                            </span>{" "}
                            {item.width_mm}mm x {item.drop_mm}mm
                          </div>
                          <div>
                            <span className="font-medium text-foreground">
                              Matched:
                            </span>{" "}
                            {item.matched_width_cm}cm x {item.matched_drop_cm}cm
                          </div>
                          <div>
                            <span className="font-medium text-foreground">
                              Mount:
                            </span>{" "}
                            {item.mount_type === "inside" ? "Inside" : "Outside"}
                          </div>
                          <div>
                            <span className="font-medium text-foreground">
                              Colour:
                            </span>{" "}
                            {item.colour}
                          </div>
                          {item.control_side && (
                            <div>
                              <span className="font-medium text-foreground">
                                Control:
                              </span>{" "}
                              {item.control_side === "left" ? "Left" : "Right"}
                            </div>
                          )}
                          {item.stacking && (
                            <div>
                              <span className="font-medium text-foreground">
                                Stacking:
                              </span>{" "}
                              {item.stacking.replace("_", " ")}
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-foreground">
                              Qty:
                            </span>{" "}
                            {item.quantity}
                          </div>
                        </div>

                        {item.selected_extras?.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-foreground mb-0.5">
                              Extras:
                            </p>
                            <ul className="text-xs text-muted-foreground space-y-0.5">
                              {item.selected_extras.map((extra) => (
                                <li key={extra.extra_id}>
                                  {extra.name} — {formatRand(extra.price_cents)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm">
                          {formatRand(item.line_total_cents)}
                        </p>
                        <div className="text-[10px] text-muted-foreground mt-0.5 space-y-0.5">
                          <p>Cost: {formatRand(item.supplier_price_cents)}</p>
                          <p>
                            Markup: {Number(item.markup_percent).toFixed(0)}% (
                            {formatRand(item.markup_cents)})
                          </p>
                          {item.extras_cents > 0 && (
                            <p>Extras: {formatRand(item.extras_cents)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals breakdown */}
          <div className="rounded-xl border bg-card">
            <div className="px-5 py-4 border-b">
              <h2 className="font-semibold">Totals</h2>
            </div>
            <div className="px-5 py-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatRand(order.subtotal_cents)}</span>
              </div>
              {order.extras_total_cents > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Extras</span>
                  <span>{formatRand(order.extras_total_cents)}</span>
                </div>
              )}
              {order.discount_cents > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>
                    Discount ({(Number(order.discount_rate) * 100).toFixed(0)}%)
                  </span>
                  <span>-{formatRand(order.discount_cents)}</span>
                </div>
              )}
              {order.delivery_fee_cents > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{formatRand(order.delivery_fee_cents)}</span>
                </div>
              )}
              {order.installation_fee_cents > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Installation</span>
                  <span>{formatRand(order.installation_fee_cents)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT (15%)</span>
                <span>{formatRand(order.vat_cents)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold text-base">
                <span>Total</span>
                <span>{formatRand(order.total_cents)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column — customer info & notes */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="rounded-xl border bg-card">
            <div className="px-5 py-4 border-b">
              <h2 className="font-semibold">Customer</h2>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{order.customer_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <a
                  href={`mailto:${order.customer_email}`}
                  className="text-primary hover:underline truncate"
                >
                  {order.customer_email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <a
                  href={`tel:${order.customer_phone}`}
                  className="text-primary hover:underline"
                >
                  {order.customer_phone}
                </a>
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="rounded-xl border bg-card">
            <div className="px-5 py-4 border-b">
              <h2 className="font-semibold">Delivery</h2>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Truck className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>
                  {DELIVERY_LABEL[order.delivery_type] ?? order.delivery_type}
                </span>
              </div>
              {address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p>{address.street}</p>
                    <p>
                      {address.city}, {address.province}
                    </p>
                    <p>{address.postal_code}</p>
                  </div>
                </div>
              )}
              {order.interested_in_other_services && (
                <p className="text-xs text-primary font-medium">
                  Interested in other services
                </p>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-xl border bg-card">
            <div className="px-5 py-4 border-b">
              <h2 className="font-semibold">Payment</h2>
            </div>
            <div className="px-5 py-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                    PAYMENT_STATUS_STYLES[order.payment_status] ??
                    "bg-muted text-muted-foreground"
                  }`}
                >
                  {order.payment_status}
                </span>
              </div>
              {order.payment_reference && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="text-xs font-mono">
                    {order.payment_reference}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {(order.customer_notes || order.admin_notes) && (
            <div className="rounded-xl border bg-card">
              <div className="px-5 py-4 border-b">
                <h2 className="font-semibold flex items-center gap-2">
                  <StickyNote className="h-4 w-4" />
                  Notes
                </h2>
              </div>
              <div className="px-5 py-4 space-y-3 text-sm">
                {order.customer_notes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Customer Notes
                    </p>
                    <p className="whitespace-pre-wrap">{order.customer_notes}</p>
                  </div>
                )}
                {order.admin_notes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Admin Notes
                    </p>
                    <p className="whitespace-pre-wrap">{order.admin_notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
