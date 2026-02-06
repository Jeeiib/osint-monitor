import { NextResponse } from "next/server";
import { fetchGdeltEvents } from "@/lib/sources/gdelt-doc";
import { translateBatch } from "@/lib/sources/translate";

// Server-side cache (10 minutes)
let cache: { data: Awaited<ReturnType<typeof fetchGdeltEvents>>; timestamp: number; lang: string } | null = null;
const CACHE_DURATION = 10 * 60 * 1000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "fr";

  try {
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION && cache.lang === lang) {
      return NextResponse.json(cache.data);
    }

    const events = await fetchGdeltEvents({ maxPoints: 75, timespan: "24h" });

    // Translate titles to target language
    if (events.length > 0) {
      const titles = events.map((e) => e.title);
      const translated = await translateBatch(titles, lang);
      for (let i = 0; i < events.length; i++) {
        if (translated[i]) {
          events[i].title = translated[i];
        }
      }
    }

    cache = { data: events, timestamp: Date.now(), lang };

    return NextResponse.json(events);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
