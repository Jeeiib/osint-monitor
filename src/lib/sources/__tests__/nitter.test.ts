import { describe, it, expect, beforeEach, vi } from "vitest";
import { fetchTwitterFeed, fetchAllTwitterFeeds, NITTER_INSTANCES, OSINT_HANDLES } from "../nitter";

const MOCK_RSS = `<rss version="2.0"><channel>
  <item>
    <title>RT by @IntelCrab: Breaking news from the region</title>
    <description>Military activity detected near border</description>
    <link>https://nitter.privacydev.net/IntelCrab/status/123</link>
    <pubDate>Thu, 06 Feb 2026 12:00:00 GMT</pubDate>
    <guid>https://twitter.com/IntelCrab/status/123</guid>
  </item>
</channel></rss>`;

describe("fetchTwitterFeed", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch from first working Nitter instance", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => MOCK_RSS,
    });

    const posts = await fetchTwitterFeed("IntelCrab");

    expect(posts).toHaveLength(1);
    expect(posts[0].platform).toBe("x");
    expect(posts[0].authorHandle).toBe("@IntelCrab");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/IntelCrab/rss"),
      expect.objectContaining({
        headers: { "User-Agent": "OSINT-Monitor/1.0" },
      })
    );
  });

  it("should fallback to second instance when first fails", async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new Error("Instance down"))
      .mockResolvedValueOnce({
        ok: true,
        text: async () => MOCK_RSS,
      });
    global.fetch = mockFetch;

    const posts = await fetchTwitterFeed("IntelCrab");

    expect(posts).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `${NITTER_INSTANCES[1]}/IntelCrab/rss`,
      expect.any(Object)
    );
  });

  it("should fallback to third instance when first two fail", async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new Error("Down"))
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => MOCK_RSS,
      });
    global.fetch = mockFetch;

    const posts = await fetchTwitterFeed("IntelCrab");

    expect(posts).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("should return empty array when all instances fail", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("All down"));

    const posts = await fetchTwitterFeed("IntelCrab");

    expect(posts).toEqual([]);
    expect(global.fetch).toHaveBeenCalledTimes(NITTER_INSTANCES.length);
  });

  it("should return empty array on HTTP error from all instances", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
    });

    const posts = await fetchTwitterFeed("OSINTdefender");

    expect(posts).toEqual([]);
  });

  it("should set platform to x for all posts", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => MOCK_RSS,
    });

    const posts = await fetchTwitterFeed("IntelCrab");

    for (const post of posts) {
      expect(post.platform).toBe("x");
    }
  });
});

describe("fetchAllTwitterFeeds", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch feeds for all OSINT handles", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => MOCK_RSS,
    });

    const posts = await fetchAllTwitterFeeds();

    // Each handle should produce 1 post from mock RSS
    expect(posts).toHaveLength(OSINT_HANDLES.length);
  });

  it("should aggregate results even if some handles fail", async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      // Fail every other handle (all 3 instances fail for that handle)
      if (callCount <= NITTER_INSTANCES.length) {
        return Promise.reject(new Error("Down"));
      }
      return Promise.resolve({
        ok: true,
        text: async () => MOCK_RSS,
      });
    });

    const posts = await fetchAllTwitterFeeds();

    // First handle fails entirely, rest succeed
    expect(posts.length).toBeGreaterThan(0);
    expect(posts.length).toBeLessThan(OSINT_HANDLES.length * 2);
  });

  it("should return empty array when all feeds fail", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("All down"));

    const posts = await fetchAllTwitterFeeds();

    expect(posts).toEqual([]);
  });
});
