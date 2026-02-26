import { NextResponse } from "next/server";
import { getAvailableDates } from "@/lib/booking/availability";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("serviceId");
  const month = searchParams.get("month"); // YYYY-MM

  if (!serviceId || !month) {
    return NextResponse.json(
      { error: "serviceId and month are required" },
      { status: 400 }
    );
  }

  // Calculate range start/end for the month
  const [year, mon] = month.split("-").map(Number);
  const rangeStart = `${year}-${String(mon).padStart(2, "0")}-01`;
  const lastDay = new Date(year, mon, 0).getDate();
  const rangeEnd = `${year}-${String(mon).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const dates = await getAvailableDates(serviceId, rangeStart, rangeEnd);

  return NextResponse.json({ dates });
}
