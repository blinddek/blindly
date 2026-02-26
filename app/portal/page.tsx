import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/queries";
import { isEnabled } from "@/config/features";
import { requirePasswordChanged } from "@/lib/auth/customer";
import { getPortalStats, getNextBooking, getRecentOrders } from "@/lib/portal/queries";
import { formatPrice } from "@/lib/shop/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarDays,
  ShoppingBag,
  Clock,
  ArrowRight,
} from "lucide-react";

const orderStatusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  paid: "default",
  fulfilled: "secondary",
  cancelled: "destructive",
};

export default async function PortalDashboard() {
  // Onboarding guard — redirects to /portal/change-password or /portal/onboarding if needed
  if (isEnabled("clientOnboarding")) {
    await requirePasswordChanged();
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const email = authUser?.email ?? user.email;
  const firstName = user.full_name?.split(" ")[0] || "there";

  const hasBooking = isEnabled("booking");
  const hasShop = isEnabled("shop");

  const [stats, nextBooking, recentOrders] = await Promise.all([
    (hasBooking || hasShop)
      ? getPortalStats(user.id, email)
      : Promise.resolve({ upcomingBookings: 0, activeOrders: 0, totalBookings: 0 }),
    hasBooking ? getNextBooking(user.id) : Promise.resolve(null),
    hasShop ? getRecentOrders(email) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {firstName}</h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s what&apos;s happening with your account.
        </p>
      </div>

      {/* Stat Cards */}
      {(hasBooking || hasShop) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hasBooking && (
            <>
              <Card>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.upcomingBookings}</p>
                    <p className="text-xs text-muted-foreground">Upcoming Bookings</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                    <Clock className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalBookings}</p>
                    <p className="text-xs text-muted-foreground">Total Sessions</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          {hasShop && (
            <Card>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <ShoppingBag className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeOrders}</p>
                  <p className="text-xs text-muted-foreground">Active Orders</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Next Upcoming Booking */}
      {hasBooking && nextBooking && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Next Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">{nextBooking.service_name}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(nextBooking.date + "T00:00:00").toLocaleDateString("en-ZA", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {nextBooking.start_time} — {nextBooking.end_time}
                </p>
              </div>
              <Link href="/portal/bookings">
                <Button variant="outline" size="sm">
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      {hasShop && recentOrders.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Orders</CardTitle>
            <Link href="/portal/orders">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/portal/orders/${order.id}`}
                  className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Order #{order.id.slice(0, 8)}
                      </span>
                      <Badge variant={orderStatusColors[order.status] ?? "outline"}>
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("en-ZA", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <p className="text-sm font-medium">{formatPrice(order.total_cents)}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {hasBooking && (
              <Link href="/book">
                <Button variant="outline" size="sm">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Book Session
                </Button>
              </Link>
            )}
            {hasShop && (
              <Link href="/shop">
                <Button variant="outline" size="sm">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Browse Shop
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Empty state when no features enabled */}
      {!hasBooking && !hasShop && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Your portal is ready. Check back soon for updates.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
