import type { SocialPost } from "@/types/social";
import { parseRssFeed } from "./rss";

/** Nitter/xcancel instances to try, in order of preference */
export const NITTER_INSTANCES = [
  "https://xcancel.com",
  "https://nitter.privacydev.net",
  "https://nitter.poast.org",
];

/** OSINT Twitter handles to follow */
export const OSINT_HANDLES = [
  "IntelCrab",
  "OSINTdefender",
  "Liveuamap",
  "TheIntelLab",
  "sentdefender",
  "GeoConfirmed",
];

/** Fetch a Twitter user's feed via a single Nitter instance */
async function fetchFromInstance(
  instanceUrl: string,
  handle: string
): Promise<SocialPost[]> {
  const url = `${instanceUrl}/${handle}/rss`;

  const response = await fetch(url, {
    headers: { "User-Agent": "OSINT-Monitor/1.0" },
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    throw new Error(`Nitter ${response.status}: ${instanceUrl}/${handle}`);
  }

  const xml = await response.text();
  const posts = parseRssFeed(xml, { name: handle, handle: `@${handle}` });

  // Override platform to "x" (Nitter RSS is really Twitter data)
  return posts.map((post) => ({ ...post, platform: "x" as const }));
}

/** Fetch a Twitter user's feed, trying multiple Nitter instances */
export async function fetchTwitterFeed(handle: string): Promise<SocialPost[]> {
  for (const instance of NITTER_INSTANCES) {
    try {
      return await fetchFromInstance(instance, handle);
    } catch {
      // Try next instance
      continue;
    }
  }

  // All instances failed — return empty gracefully
  return [];
}

/** Fetch all OSINT Twitter feeds */
export async function fetchAllTwitterFeeds(): Promise<SocialPost[]> {
  const results = await Promise.allSettled(
    OSINT_HANDLES.map((handle) => fetchTwitterFeed(handle))
  );

  return results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );
}
