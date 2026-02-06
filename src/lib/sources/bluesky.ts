import type { SocialPost } from "@/types/social";
import { detectTopic } from "./rss";

const BLUESKY_API = "https://public.api.bsky.app/xrpc";
const POSTS_PER_ACCOUNT = 10;

export interface BlueskyHandle {
  handle: string;
  displayName: string;
}

/** OSINT Bluesky accounts to follow — verified active as of Feb 2026 */
export const BLUESKY_HANDLES: BlueskyHandle[] = [
  // High frequency (daily posts)
  { handle: "noelreports.com", displayName: "NOELREPORTS" },
  { handle: "wartranslated.bsky.social", displayName: "WarTranslated" },
  { handle: "eliothiggins.bsky.social", displayName: "Eliot Higgins" },
  { handle: "covertshores.bsky.social", displayName: "H I Sutton" },
  { handle: "allsourcenews.bsky.social", displayName: "All Source News" },
  { handle: "dankaszeta.bsky.social", displayName: "Dan Kaszeta" },
  { handle: "bellingcat.com", displayName: "Bellingcat" },
  { handle: "geoconfirmed.org", displayName: "GeoConfirmed" },
  { handle: "warspotting.bsky.social", displayName: "WarSpotting" },
  { handle: "armscontrolwonk.bsky.social", displayName: "Stanford CISAC" },
  { handle: "stratcomcentre.bsky.social", displayName: "SPRAVDI" },
  // Medium frequency (weekly posts)
  { handle: "osinttechnical.bsky.social", displayName: "OSINTtechnical" },
  { handle: "tatarigami.bsky.social", displayName: "Tatarigami" },
  { handle: "rebel44cz.bsky.social", displayName: "Jakub Janovsky" },
  { handle: "topcargo200.com", displayName: "TopCargo200" },
];

/** Convert a Bluesky AT-URI to a web URL */
function atUriToWebUrl(uri: string, handle: string): string {
  // at://did:plc:xxx/app.bsky.feed.post/yyy -> https://bsky.app/profile/{handle}/post/yyy
  const rkey = uri.split("/").pop() ?? "";
  return `https://bsky.app/profile/${handle}/post/${rkey}`;
}

/** Extract the first image thumbnail from a Bluesky post embed */
function extractImageFromEmbed(embed: Record<string, unknown> | undefined): string | undefined {
  if (!embed) return undefined;

  // Direct images
  if (embed.$type === "app.bsky.embed.images#view") {
    const images = embed.images as Array<{ thumb?: string }> | undefined;
    return images?.[0]?.thumb;
  }

  // Images inside a record-with-media embed (quote + image)
  if (embed.$type === "app.bsky.embed.recordWithMedia#view") {
    const media = embed.media as Record<string, unknown> | undefined;
    if (media?.$type === "app.bsky.embed.images#view") {
      const images = media.images as Array<{ thumb?: string }> | undefined;
      return images?.[0]?.thumb;
    }
  }

  // External link with thumbnail
  if (embed.$type === "app.bsky.embed.external#view") {
    const external = embed.external as { thumb?: string } | undefined;
    return external?.thumb;
  }

  return undefined;
}

/** Fetch a single Bluesky account's feed via the public API */
export async function fetchBlueskyFeed(account: BlueskyHandle): Promise<SocialPost[]> {
  const url = `${BLUESKY_API}/app.bsky.feed.getAuthorFeed?actor=${account.handle}&limit=${POSTS_PER_ACCOUNT}&filter=posts_no_replies`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const feed = (data.feed ?? []) as Array<Record<string, unknown>>;

    const posts: SocialPost[] = [];

    for (const item of feed) {
      // Skip replies that slipped through the filter
      if (item.reply) continue;

      const post = item.post as Record<string, unknown>;
      const record = post.record as Record<string, unknown>;
      const author = post.author as Record<string, unknown>;
      const handle = (author.handle as string) ?? account.handle;
      const displayName = (author.displayName as string) ?? account.displayName;
      const text = (record.text as string) ?? "";
      const createdAt = (record.createdAt as string) ?? "";
      const uri = (post.uri as string) ?? "";
      const embed = post.embed as Record<string, unknown> | undefined;

      if (!text) continue;

      posts.push({
        id: uri,
        author: displayName,
        authorHandle: `@${handle}`,
        platform: "bluesky",
        content: text,
        url: atUriToWebUrl(uri, handle),
        timestamp: new Date(createdAt),
        imageUrl: extractImageFromEmbed(embed),
        topic: detectTopic(text),
      });
    }

    return posts;
  } catch {
    return [];
  }
}

/** Fetch all OSINT Bluesky feeds in parallel */
export async function fetchAllBlueskyFeeds(): Promise<SocialPost[]> {
  const results = await Promise.allSettled(
    BLUESKY_HANDLES.map((account) => fetchBlueskyFeed(account))
  );

  return results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );
}
