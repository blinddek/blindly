"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateOrderStatus } from "@/lib/shop/actions";
import { formatPrice } from "@/lib/shop/format";
import type { Order, OrderItem, ShippingAddress } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  paid: "default",
  fulfilled: "secondary",
  cancelled: "destructive",
};

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();
      if (error) toast.error(error.message);
      else setOrder(data as Order);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleStatusChange(
    status: "pending" | "paid" | "fulfilled" | "cancelled"
  ) {
    if (!order) return;
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, status);
      setOrder({ ...order, status });
      toast.success(`Order marked as ${status}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  if (!order) {
    return <p className="text-muted-foreground">Order not found.</p>;
  }

  const items = order.items as OrderItem[];
  const shipping = order.shipping as ShippingAddress;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/shop/orders"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to Orders
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-foreground">
            Order Detail
          </h1>
        </div>
        <Badge
          variant={statusColors[order.status] ?? "outline"}
          className="text-sm"
        >
          {order.status}
        </Badge>
      </div>

      {/* Overview */}
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Reference</p>
            <p className="font-mono text-sm">
              {order.payment_reference ?? order.id}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Customer Email</p>
            <p className="text-sm">{order.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="text-sm">
              {new Date(order.created_at).toLocaleString("en-ZA")}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">
              {formatPrice(order.total_cents)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-3 text-lg font-semibold">Items</h2>
          <div className="divide-y">
            {items?.map((item, i) => (
              <div key={i} className="flex justify-between py-2 text-sm">
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>{formatPrice(item.price_cents * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(order.subtotal_cents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{formatPrice(order.shipping_cents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatPrice(order.tax_cents)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatPrice(order.total_cents)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping */}
      {shipping && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-3 text-lg font-semibold">Shipping Address</h2>
            <div className="text-sm">
              <p>{shipping.name}</p>
              <p>{shipping.address_line_1}</p>
              {shipping.address_line_2 && <p>{shipping.address_line_2}</p>}
              <p>
                {shipping.city}, {shipping.province} {shipping.postal_code}
              </p>
              <p>{shipping.phone}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status actions */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-3 text-lg font-semibold">Update Status</h2>
          <div className="flex flex-wrap gap-2">
            {(
              ["pending", "paid", "fulfilled", "cancelled"] as const
            ).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={order.status === s ? "default" : "outline"}
                disabled={order.status === s || updating}
                onClick={() => handleStatusChange(s)}
              >
                {updating && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
