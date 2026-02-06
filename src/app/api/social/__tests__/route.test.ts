import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SocialPost } from "@/types/social";

const mocks = vi.hoisted(() => ({
  fetchAllBlueskyFeeds: vi.fn(),
  fetchRssFeed: vi.fn(),
  translateBatch: vi.fn(),
}));

vi.mock("@/lib/sources/bluesky", () => ({
  fetchAllBlueskyFeeds: mocks.fetchAllBlueskyFeeds,
}));

vi.mock("@/lib/sources/rss", () => ({
  fetchRssFeed: mocks.fetchRssFeed,
  RSS_FEEDS: [
    { url: "https://liveuamap.com/rss", name: "Liveuamap", handle: "@Liveuamap" },
    { url: "https://www.gdacs.org/xml/rss.xml", name: "GDACS", handle: "@GDACS" },
  ],
}));

vi.mock("@/lib/sources/translate", () => ({
  translateBatch: mocks.translateBatch,
}));

const createMockPost = (overrides: Partial<SocialPost> = {}): SocialPost => ({
  id: "post-1",
  author: "TestAuthor",
  authorHandle: "@test",
  platform: "rss",
  content: "Test content",
  url: "https://example.com/1",
  timestamp: new Date("2026-02-06T12:00:00Z"),
  topic: "general",
  ...overrides,
});

const makeRequest = (lang = "fr") =>
  new Request(`http://localhost:3000/api/social?lang=${lang}`);

describe("GET /api/social", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Default: translateBatch returns inputs unchanged
    mocks.translateBatch.mockImplementation(async (texts: string[]) => texts);
  });

  it("should return 200 with aggregated posts", async () => {
    const blueskyPosts = [createMockPost({ id: "bsky-1", url: "https://bsky.app/1", platform: "bluesky" })];
    const rssPosts1 = [createMockPost({ id: "rss-1", url: "https://liveuamap.com/1" })];
    const rssPosts2 = [createMockPost({ id: "rss-2", url: "https://gdacs.org/1" })];

    mocks.fetchAllBlueskyFeeds.mockResolvedValue(blueskyPosts);
    mocks.fetchRssFeed.mockResolvedValueOnce(rssPosts1).mockResolvedValueOnce(rssPosts2);

    const { GET } = await import("../route");
    const response = await GET(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(3);
  });

  it("should translate content to target language", async () => {
    const posts = [createMockPost({ id: "1", url: "https://example.com/1", content: "Military conflict reported" })];

    mocks.fetchAllBlueskyFeeds.mockResolvedValue(posts);
    mocks.fetchRssFeed.mockResolvedValue([]);
    mocks.translateBatch.mockResolvedValue(["Conflit militaire signalé"]);

    const { GET } = await import("../route");
    const response = await GET(makeRequest("fr"));
    const data = await response.json();

    expect(mocks.translateBatch).toHaveBeenCalledWith(["Military conflict reported"], "fr");
    expect(data[0].content).toBe("Conflit militaire signalé");
  });

  it("should deduplicate posts by URL", async () => {
    const duplicateUrl = "https://example.com/same";
    const posts = [
      createMockPost({ id: "1", url: duplicateUrl, platform: "bluesky" }),
      createMockPost({ id: "2", url: duplicateUrl }),
    ];

    mocks.fetchAllBlueskyFeeds.mockResolvedValue(posts);
    mocks.fetchRssFeed.mockResolvedValue([]);

    const { GET } = await import("../route");
    const response = await GET(makeRequest());
    const data = await response.json();

    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("1");
  });

  it("should sort posts by date descending", async () => {
    const posts = [
      createMockPost({ id: "old", url: "https://example.com/old", timestamp: new Date("2026-02-01") }),
      createMockPost({ id: "new", url: "https://example.com/new", timestamp: new Date("2026-02-06") }),
      createMockPost({ id: "mid", url: "https://example.com/mid", timestamp: new Date("2026-02-03") }),
    ];

    mocks.fetchAllBlueskyFeeds.mockResolvedValue(posts);
    mocks.fetchRssFeed.mockResolvedValue([]);

    const { GET } = await import("../route");
    const response = await GET(makeRequest());
    const data = await response.json();

    expect(data[0].id).toBe("new");
    expect(data[1].id).toBe("mid");
    expect(data[2].id).toBe("old");
  });

  it("should limit to 50 posts", async () => {
    const manyPosts = Array.from({ length: 60 }, (_, i) =>
      createMockPost({ id: `post-${i}`, url: `https://example.com/${i}` })
    );

    mocks.fetchAllBlueskyFeeds.mockResolvedValue(manyPosts);
    mocks.fetchRssFeed.mockResolvedValue([]);

    const { GET } = await import("../route");
    const response = await GET(makeRequest());
    const data = await response.json();

    expect(data).toHaveLength(50);
  });

  it("should gracefully handle Bluesky feed failure", async () => {
    mocks.fetchAllBlueskyFeeds.mockRejectedValue(new Error("Bluesky API down"));
    mocks.fetchRssFeed
      .mockResolvedValueOnce([createMockPost({ id: "rss-1", url: "https://liveuamap.com/1" })])
      .mockResolvedValueOnce([createMockPost({ id: "rss-2", url: "https://gdacs.org/1" })]);

    const { GET } = await import("../route");
    const response = await GET(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
  });

  it("should gracefully handle RSS feed failure", async () => {
    const blueskyPosts = [createMockPost({ id: "bsky-ok", url: "https://bsky.app/ok", platform: "bluesky" })];

    mocks.fetchAllBlueskyFeeds.mockResolvedValue(blueskyPosts);
    mocks.fetchRssFeed.mockRejectedValue(new Error("RSS down"));

    const { GET } = await import("../route");
    const response = await GET(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
  });

  it("should return empty array when all sources fail", async () => {
    mocks.fetchAllBlueskyFeeds.mockRejectedValue(new Error("Down"));
    mocks.fetchRssFeed.mockRejectedValue(new Error("Down"));

    const { GET } = await import("../route");
    const response = await GET(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it("should use cache for subsequent requests with same lang", async () => {
    const posts = [createMockPost({ id: "cached", url: "https://example.com/cached" })];

    mocks.fetchAllBlueskyFeeds.mockResolvedValue(posts);
    mocks.fetchRssFeed.mockResolvedValue([]);

    const { GET } = await import("../route");

    await GET(makeRequest("fr"));
    await GET(makeRequest("fr"));

    expect(mocks.fetchAllBlueskyFeeds).toHaveBeenCalledTimes(1);
  });

  it("should invalidate cache when language changes", async () => {
    mocks.fetchAllBlueskyFeeds.mockResolvedValue([
      createMockPost({ id: "1", url: "https://example.com/1", content: "Test" }),
    ]);
    mocks.fetchRssFeed.mockResolvedValue([]);
    mocks.translateBatch
      .mockResolvedValueOnce(["Test FR"])
      .mockResolvedValueOnce(["Test EN"]);

    const { GET } = await import("../route");

    await GET(makeRequest("fr"));
    await GET(makeRequest("en"));

    expect(mocks.fetchAllBlueskyFeeds).toHaveBeenCalledTimes(2);
    expect(mocks.translateBatch).toHaveBeenCalledTimes(2);
  });
});
