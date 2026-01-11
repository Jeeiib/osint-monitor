import { NextResponse } from "next/server";
import { fetchConflicts } from "@/lib/sources/gdelt";

// Cache for 5 minutes
let cache: { data: Awaited<ReturnType<typeof fetchConflicts>>; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    // Check cache
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json(cache.data);
    }

    const conflicts = await fetchConflicts();

    // Update cache
    cache = { data: conflicts, timestamp: Date.now() };

    return NextResponse.json(conflicts);
  } catch (error) {
    console.error("Failed to fetch conflicts:", error);
    return NextResponse.json(
      { error: "Failed to fetch conflict data" },
      { status: 500 }
    );
  }
}
