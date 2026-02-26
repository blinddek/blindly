import { createClient } from "@/lib/supabase/server";
import type { Booking, Order } from "@/types";

// ---------- Dashboard Stats ----------

export interface PortalStats {
  upcomingBookings: number;
  activeOrders: number;
  totalBookings: number;
}

export async function getPortalStats(
  userId: string,
  userEmail: string
): Promise<PortalStats> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const [bookingsResult, ordersResult, totalBookingsResult] = await Promise.all([
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("date", today)
      .in("status", ["pending", "confirmed"]),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("email", userEmail)
      .in("status", ["pending", "paid"]),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  return {
    upcomingBookings: bookingsResult.count ?? 0,
    activeOrders: ordersResult.count ?? 0,
    totalBookings: totalBookingsResult.count ?? 0,
  };
}

// ---------- Next Upcoming Booking ----------

export async function getNextBooking(userId: string): Promise<
  | (Booking & { service_name?: string })
  | null
> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .gte("date", today)
    .in("status", ["pending", "confirmed"])
    .order("date")
    .order("start_time")
    .limit(1)
    .single();

  if (!booking) return null;

  // Get service name
  const { data: service } = await supabase
    .from("booking_services")
    .select("name")
    .eq("id", booking.service_id)
    .single();

  return {
    ...(booking as Booking),
    service_name: (service?.name as { en: string })?.en ?? "Appointment",
  };
}

// ---------- Recent Orders ----------

export async function getRecentOrders(
  userEmail: string,
  limit = 3
): Promise<Order[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("email", userEmail)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Order[]) ?? [];
}

// ---------- All Customer Orders ----------

export async function getCustomerOrders(userEmail: string): Promise<Order[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("email", userEmail)
    .order("created_at", { ascending: false });
  return (data as Order[]) ?? [];
}

// ---------- Customer Order By ID ----------

export async function getCustomerOrderById(
  id: string,
  userEmail: string
): Promise<Order | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("email", userEmail)
    .single();
  return (data as Order) ?? null;
}
