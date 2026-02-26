import { createClient } from "@/lib/supabase/server";
import type { BookingService, Booking } from "@/types";

// ---------- Booking Services ----------

export async function getActiveServices(): Promise<BookingService[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("booking_services")
    .select("*")
    .eq("is_active", true)
    .order("price_cents");
  return (data as BookingService[]) ?? [];
}

export async function getServiceById(
  id: string
): Promise<BookingService | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("booking_services")
    .select("*")
    .eq("id", id)
    .single();
  return (data as BookingService) ?? null;
}

export async function getAllServices(): Promise<BookingService[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("booking_services")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as BookingService[]) ?? [];
}

// ---------- Availability Rules ----------

export interface AvailabilityRule {
  id: string;
  service_id: string | null;
  day_of_week: number; // 0=Sunday
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export async function getAvailabilityRules(
  serviceId?: string
): Promise<AvailabilityRule[]> {
  const supabase = await createClient();
  let query = supabase
    .from("availability_rules")
    .select("*")
    .eq("is_active", true)
    .order("day_of_week")
    .order("start_time");

  if (serviceId) {
    // Get service-specific rules OR global rules (service_id IS NULL)
    query = query.or(`service_id.eq.${serviceId},service_id.is.null`);
  }

  const { data } = await query;
  return (data as AvailabilityRule[]) ?? [];
}

export async function getAllAvailabilityRules(): Promise<AvailabilityRule[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("availability_rules")
    .select("*")
    .order("day_of_week")
    .order("start_time");
  return (data as AvailabilityRule[]) ?? [];
}

// ---------- Blocked Dates ----------

export interface BlockedDate {
  id: string;
  date: string;
  reason: { en: string; af: string } | null;
  all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  source: "manual" | "google_calendar";
  created_at: string;
}

export async function getBlockedDates(
  rangeStart: string,
  rangeEnd: string
): Promise<BlockedDate[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blocked_dates")
    .select("*")
    .gte("date", rangeStart)
    .lte("date", rangeEnd);
  return (data as BlockedDate[]) ?? [];
}

export async function getAllBlockedDates(): Promise<BlockedDate[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blocked_dates")
    .select("*")
    .gte("date", new Date().toISOString().split("T")[0])
    .order("date");
  return (data as BlockedDate[]) ?? [];
}

// ---------- Bookings ----------

export async function getBookings(options?: {
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<Booking[]> {
  const supabase = await createClient();
  let query = supabase
    .from("bookings")
    .select("*")
    .order("date", { ascending: false })
    .order("start_time", { ascending: false });

  if (options?.status) query = query.eq("status", options.status);
  if (options?.search) {
    query = query.or(
      `client_name.ilike.%${options.search}%,client_email.ilike.%${options.search}%`
    );
  }
  if (options?.dateFrom) query = query.gte("date", options.dateFrom);
  if (options?.dateTo) query = query.lte("date", options.dateTo);

  const { data } = await query;
  return (data as Booking[]) ?? [];
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();
  return (data as Booking) ?? null;
}

export async function getBookingByToken(
  token: string
): Promise<Booking | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("confirmation_token", token)
    .single();
  return (data as Booking) ?? null;
}

export async function getBookingsForDate(
  date: string,
  serviceId?: string
): Promise<Booking[]> {
  const supabase = await createClient();
  let query = supabase
    .from("bookings")
    .select("*")
    .eq("date", date)
    .in("status", ["pending", "confirmed"]);

  if (serviceId) query = query.eq("service_id", serviceId);

  const { data } = await query;
  return (data as Booking[]) ?? [];
}

export async function getUserBookings(userId: string): Promise<Booking[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  return (data as Booking[]) ?? [];
}
