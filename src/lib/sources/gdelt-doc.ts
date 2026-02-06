import type { GdeltGeoResponse, GdeltArticle } from "@/types/gdelt";

const GDELT_GEO_URL = "https://api.gdeltproject.org/api/v2/geo/geo";

const GEOPOLITICAL_QUERY = [
  "theme:CONFLICT",
  "theme:MILITARY",
  "theme:WAR",
  "theme:ARMED_CONFLICT",
  "theme:TERROR",
  "theme:DIPLOMATIC_CRISIS",
].join(" OR ");

interface FetchEventsOptions {
  maxPoints?: number;
  timespan?: string;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

function extractArticlesFromHtml(html: string): { title: string; url: string }[] {
  const articles: { title: string; url: string }[] = [];
  const regex = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const url = match[1];
    const title = decodeHtmlEntities(match[2].trim());
    if (title && url && !url.includes("gdeltproject.org")) {
      articles.push({ title, url });
    }
  }
  return articles;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-zà-ÿ0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

function deduplicateArticles(articles: GdeltArticle[]): GdeltArticle[] {
  const dominated = new Set<number>();

  for (let i = 0; i < articles.length; i++) {
    if (dominated.has(i)) continue;
    for (let j = i + 1; j < articles.length; j++) {
      if (dominated.has(j)) continue;
      if (jaccardSimilarity(articles[i].title, articles[j].title) > 0.5) {
        dominated.add(articles[i].count >= articles[j].count ? j : i);
      }
    }
  }

  return articles.filter((_, idx) => !dominated.has(idx));
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "unknown";
  }
}

export async function fetchGdeltEvents(
  options: FetchEventsOptions = {}
): Promise<GdeltArticle[]> {
  const { maxPoints = 75, timespan = "24h" } = options;

  const params = new URLSearchParams({
    query: `(${GEOPOLITICAL_QUERY}) sourcelang:english tone<-5`,
    mode: "PointData",
    format: "GeoJSON",
    timespan,
    maxpoints: String(maxPoints),
  });

  const response = await fetch(`${GDELT_GEO_URL}?${params}`, {
    next: { revalidate: 600 },
  });

  if (!response.ok) {
    throw new Error(`GDELT GEO API error: ${response.status}`);
  }

  const data: GdeltGeoResponse = await response.json();

  if (!data.features) return [];

  const articles: GdeltArticle[] = [];

  for (const feature of data.features) {
    const { geometry, properties } = feature;
    const [longitude, latitude] = geometry.coordinates;
    const extracted = extractArticlesFromHtml(properties.html);

    const firstArticle = extracted[0];
    if (!firstArticle) continue;

    articles.push({
      title: firstArticle.title,
      url: firstArticle.url,
      image: properties.shareimage || "",
      sourceDomain: extractDomain(firstArticle.url),
      latitude,
      longitude,
      locationName: properties.name || "Unknown",
      count: parseInt(properties.count) || 1,
      shareImage: properties.shareimage || "",
    });
  }

  return deduplicateArticles(articles);
}
