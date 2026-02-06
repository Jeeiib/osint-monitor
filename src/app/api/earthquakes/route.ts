import { NextResponse } from "next/server";
import { fetchEarthquakes } from "@/lib/sources/usgs";

export async function GET() {
  try {
    // Fetch M4.5+ for the past week, client filters to M5.5+
    const earthquakes = await fetchEarthquakes("week", "4.5");
    return NextResponse.json(earthquakes);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch earthquake data" },
      { status: 500 }
    );
  }
}
