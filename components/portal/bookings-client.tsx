"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CalendarDays,
  ArrowRight,
  Clock,
  ExternalLink,
  Loader2,
  Save,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import {
  cancelBookingByCustomer,
  updateClientNotes,
} from "@/lib/booking/actions";

export interface SerializedBooking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  serviceName: string;
  durationMinutes: number;
  cutoffHours: number;
  clientNotes: string | null;
  meetingUrl: string | null;
}

interface Props {
  readonly bookings: SerializedBooking[];
  readonly userId: string;
}

const statusColors: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  confirmed: "default",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "destructive",
};

function formatDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-ZA", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isUpcoming(booking: SerializedBooking) {
  const today = new Date().toISOString().split("T")[0];
  return (
    booking.date >= today &&
    booking.status !== "cancelled" &&
    booking.status !== "completed" &&
    booking.status !== "no_show"
  );
}

function canCancel(booking: SerializedBooking) {
  if (
    booking.status === "cancelled" ||
    booking.status === "completed" ||
    booking.status === "no_show"
  )
    return false;
  const bookingTime = new Date(`${booking.date}T${booking.startTime}`);
  const hoursUntil =
    (bookingTime.getTime() - Date.now()) / (1000 * 60 * 60);
  return hoursUntil >= booking.cutoffHours;
}

export function BookingsClient({ bookings, userId }: Props) {
  const [selectedBooking, setSelectedBooking] =
    useState<SerializedBooking | null>(null);

  const upcoming = bookings.filter(isUpcoming);
  const past = bookings.filter((b) => !isUpcoming(b));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
          <p className="text-sm text-muted-foreground">
            View and manage your appointments.
          </p>
        </div>
        <Link href="/book">
          <Button size="sm">Book New</Button>
        </Link>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <CalendarDays className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium text-foreground">No bookings yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Book your first session to get started.
              </p>
            </div>
            <Link href="/book">
              <Button variant="outline" size="sm">
                Book a Session
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Upcoming
              </h2>
              {upcoming.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onClick={() => setSelectedBooking(booking)}
                />
              ))}
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Past
              </h2>
              {past.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onClick={() => setSelectedBooking(booking)}
                  faded
                />
              ))}
            </div>
          )}
        </>
      )}

      <SessionDetailDialog
        booking={selectedBooking}
        userId={userId}
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  );
}

// ─── Booking Card ──────────────────────────────────────────────

function BookingCard({
  booking,
  onClick,
  faded,
}: Readonly<{
  booking: SerializedBooking;
  onClick: () => void;
  faded?: boolean;
}>) {
  return (
    <Card
      className={`cursor-pointer transition-colors hover:bg-muted/50 ${faded ? "opacity-75" : ""}`}
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-between py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{booking.serviceName}</span>
            <Badge variant={statusColors[booking.status] ?? "outline"}>
              {booking.status}
            </Badge>
            {booking.clientNotes && (
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDate(booking.date)}
          </p>
          <p className="text-sm text-muted-foreground">
            {booking.startTime} — {booking.endTime}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

// ─── Session Detail Dialog ─────────────────────────────────────

function SessionDetailDialog({
  booking,
  userId,
  onClose,
}: Readonly<{
  booking: SerializedBooking | null;
  userId: string;
  onClose: () => void;
}>) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [isSaving, startSaveTransition] = useTransition();
  const [isCancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const upcoming = booking ? isUpcoming(booking) : false;
  const cancelAllowed = booking ? canCancel(booking) : false;

  function handleOpen(open: boolean) {
    if (!open) {
      onClose();
      setShowCancelConfirm(false);
      return;
    }
  }

  // Sync notes when booking changes
  if (booking && notes !== (booking.clientNotes ?? "")) {
    // Only reset on booking change, not on every render
    if (!isSaving) {
      setNotes(booking.clientNotes ?? "");
    }
  }

  function handleSaveNotes() {
    if (!booking) return;
    startSaveTransition(async () => {
      const result = await updateClientNotes(booking.id, userId, notes);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Notes saved");
        router.refresh();
      }
    });
  }

  async function handleCancel() {
    if (!booking) return;
    setCancelling(true);
    const result = await cancelBookingByCustomer(booking.id, userId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Booking cancelled");
      onClose();
      router.refresh();
    }
    setCancelling(false);
  }

  return (
    <Dialog open={!!booking} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        {booking && (
          <>
            <DialogHeader>
              <DialogTitle>{booking.serviceName}</DialogTitle>
              <DialogDescription>
                {formatDate(booking.date)} &middot; {booking.startTime} —{" "}
                {booking.endTime}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Status & details */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusColors[booking.status] ?? "outline"}>
                  {booking.status}
                </Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {booking.durationMinutes} min
                </span>
              </div>

              {/* Meeting link */}
              {booking.meetingUrl && upcoming && (
                <a
                  href={booking.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md border p-3 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  Join Meeting
                </a>
              )}

              {/* Client notes */}
              {upcoming ? (
                <div className="space-y-2">
                  <Label htmlFor="clientNotes">
                    Things I&apos;d like to discuss
                  </Label>
                  <Textarea
                    id="clientNotes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Add any topics or questions for your session..."
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSaveNotes}
                    disabled={
                      isSaving || notes === (booking.clientNotes ?? "")
                    }
                  >
                    {isSaving ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Save Notes
                  </Button>
                </div>
              ) : (
                booking.clientNotes && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Your notes
                    </p>
                    <p className="rounded-md border p-3 text-sm">
                      {booking.clientNotes}
                    </p>
                  </div>
                )
              )}
            </div>

            {/* Actions */}
            {upcoming && (
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                {cancelAllowed && !showCancelConfirm && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setShowCancelConfirm(true)}
                  >
                    Cancel Booking
                  </Button>
                )}

                {showCancelConfirm && (
                  <div className="flex w-full flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-sm">
                      Are you sure? This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCancelConfirm(false)}
                        disabled={isCancelling}
                      >
                        Keep Booking
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleCancel}
                        disabled={isCancelling}
                      >
                        {isCancelling ? (
                          <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          "Yes, Cancel"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
