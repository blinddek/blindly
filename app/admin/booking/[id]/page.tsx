"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  updateBookingStatus,
  updateBookingNotes,
  deleteBooking,
} from "@/lib/booking/actions";
import { formatPrice } from "@/lib/shop/format";
import type { Booking, BookingService } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import Link from "next/link";

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  confirmed: "default",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "destructive",
};

export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [service, setService] = useState<BookingService | null>(null);
  const [previousSessions, setPreviousSessions] = useState<
    {
      id: string;
      date: string;
      start_time: string;
      status: string;
      admin_notes: string | null;
      client_notes: string | null;
      service_name: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        const b = data as Booking;
        setBooking(b);
        setNotes(b.admin_notes ?? "");
        // Load service
        const { data: svc } = await supabase
          .from("booking_services")
          .select("*")
          .eq("id", b.service_id)
          .single();
        if (svc) setService(svc as BookingService);

        // Load previous sessions for same client
        const userId = b.user_id;
        if (userId) {
          const { data: prev } = await supabase
            .from("bookings")
            .select("id, date, start_time, status, admin_notes, client_notes, service_id")
            .eq("user_id", userId)
            .neq("id", b.id)
            .in("status", ["completed", "no_show"])
            .order("date", { ascending: false })
            .limit(5);

          if (prev && prev.length > 0) {
            // Resolve service names
            const serviceIds = [...new Set(prev.map((p: Record<string, unknown>) => p.service_id as string))];
            const { data: svcNames } = await supabase
              .from("booking_services")
              .select("id, name")
              .in("id", serviceIds);
            const svcMap = new Map(
              (svcNames ?? []).map((s: { id: string; name: { en: string } }) => [s.id, s.name?.en ?? "Session"])
            );

            setPreviousSessions(
              prev.map((p: Record<string, unknown>) => ({
                id: p.id as string,
                date: p.date as string,
                start_time: p.start_time as string,
                status: p.status as string,
                admin_notes: p.admin_notes as string | null,
                client_notes: p.client_notes as string | null,
                service_name: svcMap.get(p.service_id as string) ?? "Session",
              }))
            );
          }
        }
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleStatusChange(
    status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show"
  ) {
    if (!booking) return;
    setUpdating(true);
    try {
      await updateBookingStatus(booking.id, status);
      setBooking({ ...booking, status });
      toast.success(`Booking marked as ${status}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  }

  async function handleSaveNotes() {
    if (!booking) return;
    setSavingNotes(true);
    try {
      await updateBookingNotes(booking.id, notes);
      toast.success("Notes saved");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleDelete() {
    if (!booking) return;
    if (!confirm("Are you sure you want to delete this booking?")) return;
    try {
      await deleteBooking(booking.id);
      toast.success("Booking deleted");
      router.push("/admin/booking");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  if (!booking) {
    return <p className="text-muted-foreground">Booking not found.</p>;
  }

  const dateDisplay = new Date(booking.date + "T00:00:00").toLocaleDateString(
    "en-ZA",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/booking"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to Bookings
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-foreground">
            Booking Detail
          </h1>
        </div>
        <Badge
          variant={statusColors[booking.status] ?? "outline"}
          className="text-sm"
        >
          {booking.status}
        </Badge>
      </div>

      {/* Session info */}
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Service</p>
            <p className="font-medium">{service?.name.en ?? "Unknown"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="font-medium">{dateDisplay}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Time</p>
            <p className="font-medium">
              {booking.start_time} — {booking.end_time}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="font-medium">
              {service?.duration_minutes ?? "?"} minutes
            </p>
          </div>
          {service && service.price_cents > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="font-medium">
                {formatPrice(service.price_cents)}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Created</p>
            <p className="font-medium">
              {new Date(booking.created_at).toLocaleString("en-ZA")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Client info */}
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="font-medium">{booking.client_name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="font-medium">{booking.client_email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="font-medium">{booking.client_phone || "—"}</p>
          </div>
          {booking.notes && (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Client Notes</p>
              <p className="text-sm">{booking.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin notes */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-3 text-lg font-semibold">Admin Notes</h2>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Internal notes (not visible to client)..."
          />
          <Button
            size="sm"
            className="mt-3"
            onClick={handleSaveNotes}
            disabled={savingNotes}
          >
            {savingNotes && (
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            )}
            Save Notes
          </Button>
        </CardContent>
      </Card>

      {/* Client's pre-session notes */}
      {booking.client_notes && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-3 text-lg font-semibold">Notes from Client</h2>
            <p className="rounded-md border bg-muted/50 p-3 text-sm">
              {booking.client_notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Previous session notes */}
      {previousSessions.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-3 text-lg font-semibold">
              Previous Session Notes
            </h2>
            <div className="space-y-3">
              {previousSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-md border p-3 text-sm"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{session.service_name}</span>
                      <Badge
                        variant={statusColors[session.status] ?? "outline"}
                        className="text-xs"
                      >
                        {session.status === "no_show" ? "No Show" : session.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(session.date + "T00:00:00").toLocaleDateString(
                        "en-ZA",
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
                    </span>
                  </div>
                  {session.admin_notes && (
                    <div className="mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        Your notes:{" "}
                      </span>
                      <span>{session.admin_notes}</span>
                    </div>
                  )}
                  {session.client_notes && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Client notes:{" "}
                      </span>
                      <span>{session.client_notes}</span>
                    </div>
                  )}
                  {!session.admin_notes && !session.client_notes && (
                    <p className="text-muted-foreground">No notes recorded</p>
                  )}
                  <Link
                    href={`/admin/booking/${session.id}`}
                    className="mt-1 inline-block text-xs text-primary hover:underline"
                  >
                    View details &rarr;
                  </Link>
                </div>
              ))}
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
              [
                "pending",
                "confirmed",
                "completed",
                "cancelled",
                "no_show",
              ] as const
            ).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={booking.status === s ? "default" : "outline"}
                disabled={booking.status === s || updating}
                onClick={() => handleStatusChange(s)}
              >
                {updating && (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                )}
                {s === "no_show" ? "No Show" : s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete */}
      <div className="flex justify-end">
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete Booking
        </Button>
      </div>
    </div>
  );
}
