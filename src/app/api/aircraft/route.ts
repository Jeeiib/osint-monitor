import { NextResponse } from "next/server";
import { fetchAllAircraft } from "@/lib/sources/airplaneslive";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Get center coordinates for local aircraft
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  const centerLat = lat ? parseFloat(lat) : undefined;
  const centerLon = lon ? parseFloat(lon) : undefined;

  try {
    const aircraft = await fetchAllAircraft(centerLat, centerLon);
    return NextResponse.json(aircraft);
  } catch (error) {
    console.error("Failed to fetch aircraft:", error);
    return NextResponse.json(
      { error: "Failed to fetch aircraft data" },
      { status: 500 }
    );
  }
}
