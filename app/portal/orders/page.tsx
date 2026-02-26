import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/queries";
import { getCustomerOrders } from "@/lib/portal/queries";
import { formatPrice } from "@/lib/shop/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, ArrowRight } from "lucide-react";

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  paid: "default",
  fulfilled: "secondary",
  cancelled: "destructive",
};

export default async function PortalOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const email = authUser?.email ?? user.email;
  const orders = await getCustomerOrders(email);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Orders</h1>
          <p className="text-sm text-muted-foreground">
            View your order history and track deliveries.
          </p>
        </div>
        <Link href="/shop">
          <Button size="sm">Browse Shop</Button>
        </Link>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium text-foreground">No orders yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse our shop and place your first order.
              </p>
            </div>
            <Link href="/shop">
              <Button variant="outline" size="sm">
                Browse Shop
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const dateDisplay = new Date(order.created_at).toLocaleDateString("en-ZA", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            });
            const itemCount = order.items?.length ?? 0;

            return (
              <Link key={order.id} href={`/portal/orders/${order.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          Order #{order.id.slice(0, 8)}
                        </span>
                        <Badge variant={statusColors[order.status] ?? "outline"}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {dateDisplay} &middot; {itemCount} {itemCount === 1 ? "item" : "items"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(order.total_cents)}</p>
                      <ArrowRight className="ml-auto mt-1 h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
