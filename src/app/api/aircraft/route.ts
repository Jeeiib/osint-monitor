import { NextResponse } from "next/server";
import { fetchMilitaryAircraft } from "@/lib/sources/airplaneslive";

export async function GET() {
  try {
    // Fetch military aircraft from airplanes.live
    const aircraft = await fetchMilitaryAircraft();
    return NextResponse.json(aircraft);
  } catch (error) {
    console.error("Failed to fetch aircraft:", error);
    return NextResponse.json(
      { error: "Failed to fetch aircraft data" },
      { status: 500 }
    );
  }
}
