import { describe, it, expect, beforeEach, vi } from "vitest";
import { parseRssFeed, fetchRssFeed, detectTopic, type RssFeedConfig } from "../rss";

describe("detectTopic", () => {
  it("should detect earthquake topic", () => {
    expect(detectTopic("Magnitude 6.2 earthquake hits Turkey")).toBe("earthquake");
    expect(detectTopic("Strong seismic activity detected")).toBe("earthquake");
  });

  it("should detect military topic", () => {
    expect(detectTopic("Military troops deployed near border")).toBe("military");
    expect(detectTopic("New missile defense system tested")).toBe("military");
  });

  it("should detect conflict topic", () => {
    expect(detectTopic("Air strike reported in eastern region")).toBe("conflict");
    expect(detectTopic("Heavy combat near the front line")).toBe("conflict");
  });

  it("should detect disaster topic", () => {
    expect(detectTopic("Hurricane approaching Florida coast")).toBe("disaster");
    expect(detectTopic("Humanitarian relief efforts underway")).toBe("disaster");
  });

  it("should return general for unmatched text", () => {
    expect(detectTopic("Economic summit in Geneva")).toBe("general");
    expect(detectTopic("")).toBe("general");
  });
});

describe("parseRssFeed", () => {
  const source = { name: "TestFeed", handle: "@test" };

  describe("RSS 2.0", () => {
    it("should parse standard RSS 2.0 items", () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>Test Feed</title>
            <item>
              <title>Military operation in progress</title>
              <description>Troops were deployed near the border region</description>
              <link>https://example.com/article1</link>
              <pubDate>Thu, 06 Feb 2026 12:00:00 GMT</pubDate>
              <guid>article1</guid>
            </item>
            <item>
              <title>Earthquake reported</title>
              <description>A 5.4 magnitude earthquake struck the coast</description>
              <link>https://example.com/article2</link>
              <pubDate>Thu, 06 Feb 2026 11:00:00 GMT</pubDate>
              <guid>article2</guid>
            </item>
          </channel>
        </rss>`;

      const posts = parseRssFeed(xml, source);

      expect(posts).toHaveLength(2);
      expect(posts[0].content).toBe("Military operation in progress");
      expect(posts[0].url).toBe("https://example.com/article1");
      expect(posts[0].id).toBe("article1");
      expect(posts[0].author).toBe("TestFeed");
      expect(posts[0].authorHandle).toBe("@test");
      expect(posts[0].platform).toBe("rss");
      expect(posts[0].topic).toBe("military");
      expect(posts[1].topic).toBe("earthquake");
    });

    it("should handle CDATA content", () => {
      const xml = `<rss version="2.0"><channel>
        <item>
          <title><![CDATA[Breaking: Attack reported]]></title>
          <description><![CDATA[<p>Heavy shelling in the area</p>]]></description>
          <link>https://example.com/cdata</link>
          <pubDate>Thu, 06 Feb 2026 10:00:00 GMT</pubDate>
        </item>
      </channel></rss>`;

      const posts = parseRssFeed(xml, source);

      expect(posts).toHaveLength(1);
      expect(posts[0].content).toBe("Breaking: Attack reported");
    });

    it("should extract image from enclosure", () => {
      const xml = `<rss version="2.0"><channel>
        <item>
          <title>Photo report</title>
          <link>https://example.com/photo</link>
          <enclosure url="https://example.com/image.jpg" type="image/jpeg"/>
          <pubDate>Thu, 06 Feb 2026 10:00:00 GMT</pubDate>
        </item>
      </channel></rss>`;

      const posts = parseRssFeed(xml, source);

      expect(posts[0].imageUrl).toBe("https://example.com/image.jpg");
    });

    it("should extract image from description HTML", () => {
      const xml = `<rss version="2.0"><channel>
        <item>
          <title>Photo report</title>
          <description>&lt;img src="https://example.com/img.png"/&gt; Some text</description>
          <link>https://example.com/photo</link>
          <pubDate>Thu, 06 Feb 2026 10:00:00 GMT</pubDate>
        </item>
      </channel></rss>`;

      const posts = parseRssFeed(xml, source);
      // Image extraction works on raw HTML before stripping
      expect(posts[0].content).toBe("Photo report");
    });

    it("should skip items without title and description", () => {
      const xml = `<rss version="2.0"><channel>
        <item>
          <link>https://example.com/empty</link>
        </item>
        <item>
          <title>Valid item</title>
          <link>https://example.com/valid</link>
        </item>
      </channel></rss>`;

      const posts = parseRssFeed(xml, source);

      expect(posts).toHaveLength(1);
      expect(posts[0].content).toBe("Valid item");
    });

    it("should use link as fallback guid", () => {
      const xml = `<rss version="2.0"><channel>
        <item>
          <title>No guid item</title>
          <link>https://example.com/no-guid</link>
          <pubDate>Thu, 06 Feb 2026 10:00:00 GMT</pubDate>
        </item>
      </channel></rss>`;

      const posts = parseRssFeed(xml, source);

      expect(posts[0].id).toBe("https://example.com/no-guid");
    });

    it("should decode HTML entities in title", () => {
      const xml = `<rss version="2.0"><channel>
        <item>
          <title>Breaking &amp; developing: the &quot;situation&quot;</title>
          <link>https://example.com/entities</link>
        </item>
      </channel></rss>`;

      const posts = parseRssFeed(xml, source);

      expect(posts[0].content).toBe('Breaking & developing: the "situation"');
    });
  });

  describe("Atom", () => {
    it("should parse standard Atom entries", () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Test Atom Feed</title>
          <entry>
            <title>Earthquake M5.0 - Pacific Ocean</title>
            <link href="https://example.com/eq1"/>
            <id>urn:earthquake:eq1</id>
            <updated>2026-02-06T12:00:00Z</updated>
            <summary>A magnitude 5.0 earthquake occurred</summary>
          </entry>
        </feed>`;

      const posts = parseRssFeed(xml, source);

      expect(posts).toHaveLength(1);
      expect(posts[0].content).toBe("Earthquake M5.0 - Pacific Ocean");
      expect(posts[0].url).toBe("https://example.com/eq1");
      expect(posts[0].id).toBe("urn:earthquake:eq1");
      expect(posts[0].topic).toBe("earthquake");
      expect(posts[0].timestamp).toEqual(new Date("2026-02-06T12:00:00Z"));
    });

    it("should prefer content over summary", () => {
      const xml = `<feed xmlns="http://www.w3.org/2005/Atom">
        <entry>
          <title></title>
          <link href="https://example.com/entry"/>
          <content>Full content here with military details</content>
          <summary>Short summary</summary>
          <updated>2026-02-06T12:00:00Z</updated>
        </entry>
      </feed>`;

      const posts = parseRssFeed(xml, source);

      expect(posts[0].content).toBe("Full content here with military details");
    });

    it("should use published date when updated is missing", () => {
      const xml = `<feed xmlns="http://www.w3.org/2005/Atom">
        <entry>
          <title>Entry with published only</title>
          <link href="https://example.com/pub"/>
          <published>2026-01-15T08:00:00Z</published>
        </entry>
      </feed>`;

      const posts = parseRssFeed(xml, source);

      expect(posts[0].timestamp).toEqual(new Date("2026-01-15T08:00:00Z"));
    });
  });

  describe("empty and invalid feeds", () => {
    it("should return empty array for empty RSS feed", () => {
      const xml = `<rss version="2.0"><channel></channel></rss>`;
      expect(parseRssFeed(xml, source)).toEqual([]);
    });

    it("should return empty array for empty Atom feed", () => {
      const xml = `<feed xmlns="http://www.w3.org/2005/Atom"></feed>`;
      expect(parseRssFeed(xml, source)).toEqual([]);
    });

    it("should return empty array for non-XML content", () => {
      expect(parseRssFeed("not xml at all", source)).toEqual([]);
    });
  });
});

describe("fetchRssFeed", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const config: RssFeedConfig = {
    url: "https://example.com/rss",
    name: "Test",
    handle: "@test",
  };

  it("should fetch and parse RSS feed", async () => {
    const rssXml = `<rss version="2.0"><channel>
      <item>
        <title>Test article</title>
        <link>https://example.com/1</link>
        <pubDate>Thu, 06 Feb 2026 12:00:00 GMT</pubDate>
      </item>
    </channel></rss>`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => rssXml,
    });

    const posts = await fetchRssFeed(config);

    expect(posts).toHaveLength(1);
    expect(posts[0].content).toBe("Test article");
    expect(global.fetch).toHaveBeenCalledWith(config.url, expect.objectContaining({
      headers: { "User-Agent": "OSINT-Monitor/1.0" },
    }));
  });

  it("should throw on non-ok response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    });

    await expect(fetchRssFeed(config)).rejects.toThrow("RSS fetch error: 503");
  });

  it("should throw on network error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    await expect(fetchRssFeed(config)).rejects.toThrow("Network error");
  });
});
