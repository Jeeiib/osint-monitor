import { NextResponse } from "next/server";
import { fetchGdeltEvents } from "@/lib/sources/gdelt-doc";
import { translateBatch } from "@/lib/sources/translate";

// Server-side cache per language (10 minutes)
const cacheByLang = new Map<string, { data: Awaited<ReturnType<typeof fetchGdeltEvents>>; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "fr";

  try {
    const cached = cacheByLang.get(lang);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
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

    cacheByLang.set(lang, { data: events, timestamp: Date.now() });

    return NextResponse.json(events);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
