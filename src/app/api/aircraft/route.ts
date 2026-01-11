import { NextResponse } from "next/server";
import { fetchAircraft } from "@/lib/sources/opensky";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Optional bounding box
  const minLat = searchParams.get("minLat");
  const maxLat = searchParams.get("maxLat");
  const minLon = searchParams.get("minLon");
  const maxLon = searchParams.get("maxLon");

  const bounds =
    minLat && maxLat && minLon && maxLon
      ? {
          minLat: parseFloat(minLat),
          maxLat: parseFloat(maxLat),
          minLon: parseFloat(minLon),
          maxLon: parseFloat(maxLon),
        }
      : undefined;

  try {
    const aircraft = await fetchAircraft(bounds);
    return NextResponse.json(aircraft);
  } catch (error) {
    console.error("Failed to fetch aircraft:", error);
    return NextResponse.json(
      { error: "Failed to fetch aircraft data" },
      { status: 500 }
    );
  }
}
