"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/shop/format";
import type { Booking, BookingService } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  confirmed: "default",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "destructive",
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      let query = supabase
        .from("bookings")
        .select("*")
        .order("date", { ascending: false })
        .order("start_time", { ascending: false });

      if (statusFilter) query = query.eq("status", statusFilter);
      if (search) {
        query = query.or(
          `client_name.ilike.%${search}%,client_email.ilike.%${search}%`
        );
      }

      const [bookingsRes, servicesRes] = await Promise.all([
        query,
        supabase.from("booking_services").select("*"),
      ]);

      if (bookingsRes.error) toast.error(bookingsRes.error.message);
      else if (bookingsRes.data) setBookings(bookingsRes.data as Booking[]);

      if (servicesRes.data) setServices(servicesRes.data as BookingService[]);
      setLoading(false);
    }
    load();
  }, [statusFilter, search]);

  const serviceMap = new Map(services.map((s) => [s.id, s]));

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
        <p className="text-sm text-muted-foreground">
          Manage customer appointments.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/booking/services"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Services
        </Link>
        <Link
          href="/admin/booking/availability"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Availability
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2">
          {["", "pending", "confirmed", "completed", "cancelled", "no_show"].map(
            (s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  statusFilter === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted"
                }`}
              >
                {s || "All"}
              </button>
            )
          )}
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-56"
        />
      </div>

      {bookings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No bookings found.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const service = serviceMap.get(booking.service_id);
            return (
              <Link
                key={booking.id}
                href={`/admin/booking/${booking.id}`}
              >
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {booking.client_name}
                        </span>
                        <Badge
                          variant={statusColors[booking.status] ?? "outline"}
                        >
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {service?.name.en ?? "Unknown service"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.client_email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {new Date(
                          booking.date + "T00:00:00"
                        ).toLocaleDateString("en-ZA", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.start_time} — {booking.end_time}
                      </p>
                      {service && service.price_cents > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(service.price_cents)}
                        </p>
                      )}
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
