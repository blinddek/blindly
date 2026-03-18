import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { getAllBlindlyOrders } from "@/lib/admin/queries";

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
    month: "short",
    year: "numeric",
  });
}

const ORDER_STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  confirmed:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  ordered_from_supplier:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  shipped:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  delivered:
    "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  installed:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cancelled:
    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  refunded:
    "bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400",
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  new: "New",
  confirmed: "Confirmed",
  ordered_from_supplier: "Ordered",
  shipped: "Shipped",
  delivered: "Delivered",
  installed: "Installed",
  cancelled: "Cancelled",
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminOrdersPage() {
  const orders = await getAllBlindlyOrders();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {orders.length} order{orders.length !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>

      {/* Orders table */}
      <div className="rounded-xl border bg-card">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              No orders yet. They will appear here once customers place orders.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3 hidden md:table-cell">Phone</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 hidden sm:table-cell text-right">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="group hover:bg-accent/50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/blinds/orders/${order.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        #{order.order_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {order.customer_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {order.customer_email}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">
                      {order.customer_phone}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          ORDER_STATUS_STYLES[order.order_status] ??
                          "bg-muted text-muted-foreground"
                        }`}
                      >
                        {ORDER_STATUS_LABEL[order.order_status] ??
                          order.order_status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                          PAYMENT_STATUS_STYLES[order.payment_status] ??
                          "bg-muted text-muted-foreground"
                        }`}
                      >
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium whitespace-nowrap">
                      {formatRand(order.total_cents)}
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell text-right text-muted-foreground whitespace-nowrap">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
