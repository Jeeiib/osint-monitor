import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SocialPost } from "@/types/social";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

/** Build a minimal Bluesky API response for getAuthorFeed */
function makeBlueskyResponse(posts: Array<{
  text: string;
  createdAt: string;
  uri: string;
  displayName?: string;
  handle?: string;
  imageUrl?: string;
}>) {
  return {
    feed: posts.map((p) => ({
      post: {
        uri: p.uri,
        cid: "bafyreifake",
        author: {
          did: "did:plc:fake",
          handle: p.handle ?? "testuser.bsky.social",
          displayName: p.displayName ?? "Test User",
        },
        record: {
          $type: "app.bsky.feed.post",
          text: p.text,
          createdAt: p.createdAt,
          ...(p.imageUrl
            ? {
                embed: {
                  $type: "app.bsky.embed.images",
                  images: [{ image: { ref: { $link: "fake" }, mimeType: "image/jpeg" }, alt: "" }],
                },
              }
            : {}),
        },
        embed: p.imageUrl
          ? {
              $type: "app.bsky.embed.images#view",
              images: [{ thumb: p.imageUrl, fullsize: p.imageUrl, alt: "" }],
            }
          : undefined,
      },
    })),
  };
}

describe("bluesky connector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("BLUESKY_HANDLES", () => {
    it("should export a non-empty array of handles", async () => {
      const { BLUESKY_HANDLES } = await import("../bluesky");
      expect(Array.isArray(BLUESKY_HANDLES)).toBe(true);
      expect(BLUESKY_HANDLES.length).toBeGreaterThan(0);
    });

    it("should contain well-known OSINT accounts", async () => {
      const { BLUESKY_HANDLES } = await import("../bluesky");
      const handles = BLUESKY_HANDLES.map((h) => h.handle);
      expect(handles).toContain("osinttechnical.bsky.social");
      expect(handles).toContain("bellingcat.com");
      expect(handles).toContain("geoconfirmed.org");
    });
  });

  describe("fetchBlueskyFeed", () => {
    it("should fetch and parse posts from the public API", async () => {
      const apiResponse = makeBlueskyResponse([
        {
          text: "Breaking: major conflict in region X",
          createdAt: "2026-02-06T10:00:00.000Z",
          uri: "at://did:plc:fake/app.bsky.feed.post/abc123",
          handle: "osinttechnical.bsky.social",
          displayName: "OSINTtechnical",
        },
      ]);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => apiResponse,
      });

      const { fetchBlueskyFeed } = await import("../bluesky");
      const posts = await fetchBlueskyFeed({
        handle: "osinttechnical.bsky.social",
        displayName: "OSINTtechnical",
      });

      expect(posts).toHaveLength(1);
      expect(posts[0].platform).toBe("bluesky");
      expect(posts[0].author).toBe("OSINTtechnical");
      expect(posts[0].authorHandle).toBe("@osinttechnical.bsky.social");
      expect(posts[0].content).toBe("Breaking: major conflict in region X");
      expect(posts[0].url).toContain("bsky.app/profile/");
      expect(posts[0].timestamp).toEqual(new Date("2026-02-06T10:00:00.000Z"));
    });

    it("should detect topic from post content", async () => {
      const apiResponse = makeBlueskyResponse([
        {
          text: "Massive earthquake hits Turkey, magnitude 7.2",
          createdAt: "2026-02-06T10:00:00.000Z",
          uri: "at://did:plc:fake/app.bsky.feed.post/eq1",
        },
        {
          text: "Heavy shelling and combat reported on the front line near Bakhmut",
          createdAt: "2026-02-06T09:00:00.000Z",
          uri: "at://did:plc:fake/app.bsky.feed.post/conflict1",
        },
        {
          text: "New missile system deployed by NATO forces",
          createdAt: "2026-02-06T08:00:00.000Z",
          uri: "at://did:plc:fake/app.bsky.feed.post/mil1",
        },
      ]);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => apiResponse,
      });

      const { fetchBlueskyFeed } = await import("../bluesky");
      const posts = await fetchBlueskyFeed({ handle: "test.bsky.social", displayName: "Test" });

      expect(posts[0].topic).toBe("earthquake");
      expect(posts[1].topic).toBe("conflict");
      expect(posts[2].topic).toBe("military");
    });

    it("should extract image URLs from embedded images", async () => {
      const apiResponse = makeBlueskyResponse([
        {
          text: "Satellite image of damage",
          createdAt: "2026-02-06T10:00:00.000Z",
          uri: "at://did:plc:fake/app.bsky.feed.post/img1",
          imageUrl: "https://cdn.bsky.app/img/feed_thumbnail/thumb.jpg",
        },
      ]);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => apiResponse,
      });

      const { fetchBlueskyFeed } = await import("../bluesky");
      const posts = await fetchBlueskyFeed({ handle: "test.bsky.social", displayName: "Test" });

      expect(posts[0].imageUrl).toBe("https://cdn.bsky.app/img/feed_thumbnail/thumb.jpg");
    });

    it("should build correct profile URLs", async () => {
      const apiResponse = makeBlueskyResponse([
        {
          text: "Test post",
          createdAt: "2026-02-06T10:00:00.000Z",
          uri: "at://did:plc:abc123/app.bsky.feed.post/xyz789",
          handle: "bellingcat.com",
        },
      ]);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => apiResponse,
      });

      const { fetchBlueskyFeed } = await import("../bluesky");
      const posts = await fetchBlueskyFeed({ handle: "bellingcat.com", displayName: "Bellingcat" });

      expect(posts[0].url).toBe("https://bsky.app/profile/bellingcat.com/post/xyz789");
    });

    it("should return empty array on API error", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const { fetchBlueskyFeed } = await import("../bluesky");
      const posts = await fetchBlueskyFeed({ handle: "test.bsky.social", displayName: "Test" });

      expect(posts).toEqual([]);
    });

    it("should return empty array on network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network timeout"));

      const { fetchBlueskyFeed } = await import("../bluesky");
      const posts = await fetchBlueskyFeed({ handle: "test.bsky.social", displayName: "Test" });

      expect(posts).toEqual([]);
    });

    it("should skip reply posts", async () => {
      const response = {
        feed: [
          {
            post: {
              uri: "at://did:plc:fake/app.bsky.feed.post/original1",
              cid: "bafyreifake",
              author: { did: "did:plc:fake", handle: "test.bsky.social", displayName: "Test" },
              record: {
                $type: "app.bsky.feed.post",
                text: "Original post",
                createdAt: "2026-02-06T10:00:00.000Z",
              },
            },
          },
          {
            reply: { parent: { uri: "at://did:plc:other/app.bsky.feed.post/parent" } },
            post: {
              uri: "at://did:plc:fake/app.bsky.feed.post/reply1",
              cid: "bafyreifake2",
              author: { did: "did:plc:fake", handle: "test.bsky.social", displayName: "Test" },
              record: {
                $type: "app.bsky.feed.post",
                text: "This is a reply",
                createdAt: "2026-02-06T09:00:00.000Z",
              },
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => response,
      });

      const { fetchBlueskyFeed } = await import("../bluesky");
      const posts = await fetchBlueskyFeed({ handle: "test.bsky.social", displayName: "Test" });

      expect(posts).toHaveLength(1);
      expect(posts[0].content).toBe("Original post");
    });

    it("should call the correct API endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ feed: [] }),
      });

      const { fetchBlueskyFeed } = await import("../bluesky");
      await fetchBlueskyFeed({ handle: "osinttechnical.bsky.social", displayName: "OSINTtechnical" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=osinttechnical.bsky.social&limit=10&filter=posts_no_replies",
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });
  });

  describe("fetchAllBlueskyFeeds", () => {
    it("should aggregate posts from all handles", async () => {
      // Each call returns 1 post
      const makeResponse = (handle: string, text: string) =>
        makeBlueskyResponse([
          {
            text,
            createdAt: "2026-02-06T10:00:00.000Z",
            uri: `at://did:plc:fake/app.bsky.feed.post/${handle}`,
            handle,
          },
        ]);

      // Mock will be called once per handle
      const { BLUESKY_HANDLES } = await import("../bluesky");
      for (const h of BLUESKY_HANDLES) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => makeResponse(h.handle, `Post from ${h.handle}`),
        });
      }

      const { fetchAllBlueskyFeeds } = await import("../bluesky");
      const posts = await fetchAllBlueskyFeeds();

      expect(posts.length).toBe(BLUESKY_HANDLES.length);
      expect(posts.every((p: SocialPost) => p.platform === "bluesky")).toBe(true);
    });

    it("should gracefully handle individual feed failures", async () => {
      const { BLUESKY_HANDLES } = await import("../bluesky");

      // First call fails, rest succeed
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      for (let i = 1; i < BLUESKY_HANDLES.length; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () =>
            makeBlueskyResponse([
              {
                text: `Post ${i}`,
                createdAt: "2026-02-06T10:00:00.000Z",
                uri: `at://did:plc:fake/app.bsky.feed.post/post${i}`,
              },
            ]),
        });
      }

      const { fetchAllBlueskyFeeds } = await import("../bluesky");
      const posts = await fetchAllBlueskyFeeds();

      expect(posts.length).toBe(BLUESKY_HANDLES.length - 1);
    });

    it("should return empty array when all feeds fail", async () => {
      const { BLUESKY_HANDLES } = await import("../bluesky");
      for (let i = 0; i < BLUESKY_HANDLES.length; i++) {
        mockFetch.mockRejectedValueOnce(new Error("All down"));
      }

      const { fetchAllBlueskyFeeds } = await import("../bluesky");
      const posts = await fetchAllBlueskyFeeds();

      expect(posts).toEqual([]);
    });
  });
});
