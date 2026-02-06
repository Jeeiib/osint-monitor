import type { SocialPost, SocialTopic } from "@/types/social";

/** Extract text content from an XML tag */
function extractTag(xml: string, tag: string): string {
  // Handle CDATA sections
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, "i");
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

/** Extract attribute value from an XML tag */
function extractAttr(xml: string, tag: string, attr: string): string {
  const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, "i");
  const match = xml.match(regex);
  return match ? match[1] : "";
}

/** Strip HTML tags from a string */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

/** Extract first image URL from HTML content */
function extractImageUrl(html: string): string | undefined {
  const match = html.match(/<img[^>]+src="([^"]+)"/i);
  return match ? match[1] : undefined;
}

/** Detect topic from text content */
export function detectTopic(text: string): SocialTopic {
  const lower = text.toLowerCase();

  if (/earthquake|seism|quake|magnitude|richter|tremor/i.test(lower)) return "earthquake";
  if (/military|army|navy|airforce|troops|weapon|missile|drone|defense|defence/i.test(lower)) return "military";
  if (/war|attack|strike|conflict|bomb|shell|combat|front\s?line|casualt/i.test(lower)) return "conflict";
  if (/flood|hurricane|typhoon|tsunami|volcano|wildfire|cyclone|disaster|relief|humanitarian/i.test(lower)) return "disaster";

  return "general";
}

interface RssSource {
  name: string;
  handle: string;
}

/** Parse RSS 2.0 or Atom XML into SocialPost[] */
export function parseRssFeed(xml: string, source: RssSource): SocialPost[] {
  const isAtom = xml.includes("<feed") && xml.includes("<entry");
  const posts: SocialPost[] = [];

  if (isAtom) {
    const entries = xml.split(/<entry[\s>]/i).slice(1);
    for (const entry of entries) {
      const title = stripHtml(extractTag(entry, "title"));
      const content = stripHtml(extractTag(entry, "content") || extractTag(entry, "summary"));
      const link = extractAttr(entry, "link", "href") || extractTag(entry, "link");
      const updated = extractTag(entry, "updated") || extractTag(entry, "published");
      const id = extractTag(entry, "id") || link;

      if (!title && !content) continue;

      posts.push({
        id: id || `${source.handle}-${posts.length}`,
        author: source.name,
        authorHandle: source.handle,
        platform: "rss",
        content: title || content,
        url: link,
        timestamp: new Date(updated || Date.now()),
        imageUrl: extractImageUrl(entry),
        topic: detectTopic(`${title} ${content}`),
      });
    }
  } else {
    // RSS 2.0
    const items = xml.split(/<item[\s>]/i).slice(1);
    for (const item of items) {
      const title = stripHtml(extractTag(item, "title"));
      const description = stripHtml(extractTag(item, "description"));
      const link = extractTag(item, "link");
      const pubDate = extractTag(item, "pubDate");
      const guid = extractTag(item, "guid") || link;
      const enclosure = extractAttr(item, "enclosure", "url");

      if (!title && !description) continue;

      posts.push({
        id: guid || `${source.handle}-${posts.length}`,
        author: source.name,
        authorHandle: source.handle,
        platform: "rss",
        content: title || description,
        url: link,
        timestamp: new Date(pubDate || Date.now()),
        imageUrl: enclosure || extractImageUrl(item),
        topic: detectTopic(`${title} ${description}`),
      });
    }
  }

  return posts;
}

/** RSS feed source configuration */
export interface RssFeedConfig {
  url: string;
  name: string;
  handle: string;
}

/** Predefined RSS sources */
export const RSS_FEEDS: RssFeedConfig[] = [
  {
    url: "https://liveuamap.com/rss",
    name: "Liveuamap",
    handle: "@Liveuamap",
  },
  {
    url: "https://www.gdacs.org/xml/rss.xml",
    name: "GDACS",
    handle: "@GDACS",
  },
  {
    url: "https://reliefweb.int/updates/rss.xml",
    name: "ReliefWeb",
    handle: "@ReliefWeb",
  },
  {
    url: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.atom",
    name: "USGS Earthquakes",
    handle: "@USGS",
  },
];

/** Fetch and parse a single RSS feed */
export async function fetchRssFeed(config: RssFeedConfig): Promise<SocialPost[]> {
  const response = await fetch(config.url, {
    headers: { "User-Agent": "OSINT-Monitor/1.0" },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`RSS fetch error: ${response.status} for ${config.url}`);
  }

  const xml = await response.text();
  return parseRssFeed(xml, { name: config.name, handle: config.handle });
}
