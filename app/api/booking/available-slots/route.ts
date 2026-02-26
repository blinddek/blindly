import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/booking/availability";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("serviceId");
  const date = searchParams.get("date"); // YYYY-MM-DD

  if (!serviceId || !date) {
    return NextResponse.json(
      { error: "serviceId and date are required" },
      { status: 400 }
    );
  }

  const slots = await getAvailableSlots(serviceId, date);

  return NextResponse.json({ slots });
}
