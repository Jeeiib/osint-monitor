import { NextResponse } from "next/server";
import { fetchAllBlueskyFeeds } from "@/lib/sources/bluesky";
import { fetchRssFeed, RSS_FEEDS } from "@/lib/sources/rss";
import { translateBatch } from "@/lib/sources/translate";
import type { SocialPost } from "@/types/social";

// Server-side cache per language (5 minutes)
const cacheByLang = new Map<string, { data: SocialPost[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000;
const MAX_POSTS = 50;

/** Deduplicate posts by URL */
function deduplicateByUrl(posts: SocialPost[]): SocialPost[] {
  const seen = new Set<string>();
  return posts.filter((post) => {
    if (!post.url || seen.has(post.url)) return false;
    seen.add(post.url);
    return true;
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "fr";

  try {
    const cached = cacheByLang.get(lang);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // Fetch all sources in parallel
    const [blueskyResult, ...rssResults] = await Promise.allSettled([
      fetchAllBlueskyFeeds(),
      ...RSS_FEEDS.map((feed) => fetchRssFeed(feed)),
    ]);

    // Aggregate results (only fulfilled promises)
    const allPosts: SocialPost[] = [];

    if (blueskyResult.status === "fulfilled") {
      allPosts.push(...blueskyResult.value);
    }

    for (const result of rssResults) {
      if (result.status === "fulfilled") {
        allPosts.push(...result.value);
      }
    }

    // Deduplicate, sort by date descending, limit
    const posts = deduplicateByUrl(allPosts)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, MAX_POSTS);

    // Translate content to target language
    if (posts.length > 0) {
      const contents = posts.map((p) => p.content);
      const translated = await translateBatch(contents, lang);
      for (let i = 0; i < posts.length; i++) {
        if (translated[i]) {
          posts[i].content = translated[i];
        }
      }
    }

    cacheByLang.set(lang, { data: posts, timestamp: Date.now() });

    return NextResponse.json(posts);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch social feed" },
      { status: 500 }
    );
  }
}
