import { NextResponse } from "next/server";
import { fetchEarthquakes } from "@/lib/sources/usgs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") || "day") as "hour" | "day" | "week" | "month";
  const minMagnitude = (searchParams.get("minMag") || "2.5") as "significant" | "4.5" | "2.5" | "1.0" | "all";

  try {
    const earthquakes = await fetchEarthquakes(period, minMagnitude);
    return NextResponse.json(earthquakes);
  } catch (error) {
    console.error("Failed to fetch earthquakes:", error);
    return NextResponse.json(
      { error: "Failed to fetch earthquake data" },
      { status: 500 }
    );
  }
}
