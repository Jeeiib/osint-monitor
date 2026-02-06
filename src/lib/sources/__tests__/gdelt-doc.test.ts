import { describe, it, expect, beforeEach, vi } from "vitest";
import { fetchGdeltEvents } from "../gdelt-doc";
import type { GdeltGeoResponse } from "@/types/gdelt";

describe("fetchGdeltEvents", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const createMockFeature = (overrides = {}) => ({
    type: "Feature" as const,
    geometry: {
      type: "Point" as const,
      coordinates: [-122.5, 37.8],
    },
    properties: {
      name: "Test Location",
      html: '<a href="https://example.com/article1">Test Article Title</a>',
      shareimage: "https://example.com/image.jpg",
      count: "5",
      url: "https://example.com",
    },
    ...overrides,
  });

  const createMockResponse = (features: any[] = []): GdeltGeoResponse => ({
    type: "FeatureCollection",
    features,
  });

  describe("API integration", () => {
    it("should fetch with default parameters", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([]),
      });
      global.fetch = mockFetch;

      await fetchGdeltEvents();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("https://api.gdeltproject.org/api/v2/geo/geo"),
        { next: { revalidate: 600 } }
      );

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("maxpoints=75");
      expect(calledUrl).toContain("timespan=24h");
      expect(calledUrl).toContain("mode=PointData");
      expect(calledUrl).toContain("format=GeoJSON");
      // URLSearchParams encodes spaces as + and special chars
      expect(calledUrl).toContain("sourcelang");
      expect(calledUrl).toContain("tone");
    });

    it("should fetch with custom parameters", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([]),
      });
      global.fetch = mockFetch;

      await fetchGdeltEvents({ maxPoints: 100, timespan: "48h" });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("maxpoints=100");
      expect(calledUrl).toContain("timespan=48h");
    });

    it("should throw error on non-ok response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      });

      await expect(fetchGdeltEvents()).rejects.toThrow(
        "GDELT GEO API error: 503"
      );
    });

    it("should return empty array when features is undefined", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ type: "FeatureCollection" }),
      });

      const result = await fetchGdeltEvents();

      expect(result).toEqual([]);
    });

    it("should return empty array when features is empty", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([]),
      });

      const result = await fetchGdeltEvents();

      expect(result).toEqual([]);
    });
  });

  describe("HTML article extraction", () => {
    it("should extract article from HTML", async () => {
      const mockFeature = createMockFeature({
        properties: {
          name: "Test Location",
          html: '<a href="https://example.com/article">Breaking News</a>',
          shareimage: "https://example.com/image.jpg",
          count: "5",
          url: "https://example.com",
        },
      });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockFeature]),
      });

      const result = await fetchGdeltEvents();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Breaking News");
      expect(result[0].url).toBe("https://example.com/article");
    });

    it("should decode HTML entities in titles", async () => {
      const mockFeature = createMockFeature({
        properties: {
          name: "Test Location",
          html: '<a href="https://example.com/article">Biden&apos;s &quot;New Deal&quot; &amp; Economic Policy</a>',
          shareimage: "",
          count: "1",
          url: "https://example.com",
        },
      });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockFeature]),
      });

      const result = await fetchGdeltEvents();

      expect(result[0].title).toBe('Biden\'s "New Deal" & Economic Policy');
    });

    it("should decode various HTML entities", async () => {
      const mockFeature = createMockFeature({
        properties: {
          name: "Test",
          html: '<a href="https://example.com">Test &lt;tag&gt; &#39;quoted&#39; &#x27;text&#x27; &#x2F;slash</a>',
          shareimage: "",
          count: "1",
          url: "",
        },
      });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockFeature]),
      });

      const result = await fetchGdeltEvents();

      expect(result[0].title).toBe("Test <tag> 'quoted' 'text' /slash");
    });

    it("should filter out gdeltproject.org links", async () => {
      const mockFeature = createMockFeature({
        properties: {
          name: "Test",
          html: '<a href="https://gdeltproject.org/about">GDELT Info</a><a href="https://example.com">Real Article</a>',
          shareimage: "",
          count: "1",
          url: "",
        },
      });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockFeature]),
      });

      const result = await fetchGdeltEvents();

      expect(result[0].url).toBe("https://example.com");
      expect(result[0].title).toBe("Real Article");
    });

    it("should skip features with no valid articles", async () => {
      const mockFeature = createMockFeature({
        properties: {
          name: "Test",
          html: '<a href="https://gdeltproject.org">Only GDELT Link</a>',
          shareimage: "",
          count: "1",
          url: "",
        },
      });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockFeature]),
      });

      const result = await fetchGdeltEvents();

      expect(result).toEqual([]);
    });

    it("should extract multiple articles but use only first", async () => {
      const mockFeature = createMockFeature({
        properties: {
          name: "Test",
          html: '<a href="https://example.com/1">First Article</a><a href="https://example.com/2">Second Article</a>',
          shareimage: "",
          count: "1",
          url: "",
        },
      });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockFeature]),
      });

      const result = await fetchGdeltEvents();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("First Article");
      expect(result[0].url).toBe("https://example.com/1");
    });
  });

  describe("GeoJSON mapping", () => {
    it("should map feature to article correctly", async () => {
      const mockFeature = createMockFeature({
        geometry: {
          type: "Point",
          coordinates: [-122.5, 37.8],
        },
        properties: {
          name: "San Francisco Bay",
          html: '<a href="https://example.com/article">Test Article</a>',
          shareimage: "https://example.com/image.jpg",
          count: "12",
          url: "https://example.com",
        },
      });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockFeature]),
      });

      const result = await fetchGdeltEvents();

      expect(result[0]).toEqual({
        title: "Test Article",
        url: "https://example.com/article",
        image: "https://example.com/image.jpg",
        sourceDomain: "example.com",
        latitude: 37.8,
        longitude: -122.5,
        locationName: "San Francisco Bay",
        count: 12,
        shareImage: "https://example.com/image.jpg",
      });
    });

    it("should extract domain from URL correctly", async () => {
      const mockFeature = createMockFeature({
        properties: {
          name: "Test",
          html: '<a href="https://www.bbc.co.uk/news/article">BBC Article</a>',
          shareimage: "",
          count: "1",
          url: "",
        },
      });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockFeature]),
      });

      const result = await fetchGdeltEvents();

      expect(result[0].sourceDomain).toBe("bbc.co.uk");
    });

    it("should handle invalid URL domains", async () => {
      const mockFeature = createMockFeature({
        properties: {
          name: "Test",
          html: '<a href="not-a-valid-url">Article</a>',
          shareimage: "",
          count: "1",
          url: "",
        },
      });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockFeature]),
      });

      const result = await fetchGdeltEvents();

      expect(result[0].sourceDomain).toBe("unknown");
    });

    it("should handle missing shareimage as empty string", async () => {
      const mockFeature = createMockFeature({
        properties: {
          name: "Test",
          html: '<a href="https://example.com">Article</a>',
          shareimage: "",
          count: "1",
          url: "",
        },
      });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockFeature]),
      });

      const result = await fetchGdeltEvents();

      expect(result[0].image).toBe("");
      expect(result[0].shareImage).toBe("");
    });

    it("should handle missing location name", async () => {
      const mockFeature = createMockFeature({
        properties: {
          name: "",
          html: '<a href="https://example.com">Article</a>',
          shareimage: "",
          count: "1",
          url: "",
        },
      });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockFeature]),
      });

      const result = await fetchGdeltEvents();

      expect(result[0].locationName).toBe("Unknown");
    });

    it("should parse count as integer with default", async () => {
      const mockFeature = createMockFeature({
        properties: {
          name: "Test",
          html: '<a href="https://example.com">Article</a>',
          shareimage: "",
          count: "invalid",
          url: "",
        },
      });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockFeature]),
      });

      const result = await fetchGdeltEvents();

      expect(result[0].count).toBe(1);
    });
  });

  describe("deduplication", () => {
    it("should deduplicate articles with similar titles", async () => {
      const feature1 = createMockFeature({
        properties: {
          name: "Location 1",
          html: '<a href="https://example.com/1">Russia Ukraine Conflict Latest Updates</a>',
          shareimage: "",
          count: "10",
          url: "",
        },
      });
      const feature2 = createMockFeature({
        properties: {
          name: "Location 2",
          html: '<a href="https://example.com/2">Russia Ukraine Conflict Latest News Updates</a>',
          shareimage: "",
          count: "5",
          url: "",
        },
      });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([feature1, feature2]),
      });

      const result = await fetchGdeltEvents();

      // Should keep higher count (10 > 5)
      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(10);
      expect(result[0].url).toBe("https://example.com/1");
    });

    it("should keep article with higher count when deduplicating", async () => {
      const feature1 = createMockFeature({
        properties: {
          name: "Location",
          html: '<a href="https://example.com/1">Military Action Report Update</a>',
          shareimage: "",
          count: "3",
          url: "",
        },
      });
      const feature2 = createMockFeature({
        properties: {
          name: "Location",
          html: '<a href="https://example.com/2">Military Action Report Updates</a>',
          shareimage: "",
          count: "15",
          url: "",
        },
      });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([feature1, feature2]),
      });

      const result = await fetchGdeltEvents();

      // Should keep higher count (15 > 3)
      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(15);
      expect(result[0].url).toBe("https://example.com/2");
    });

    it("should not deduplicate articles with different titles", async () => {
      const feature1 = createMockFeature({
        properties: {
          name: "Location",
          html: '<a href="https://example.com/1">Russia Ukraine Conflict Updates</a>',
          shareimage: "",
          count: "5",
          url: "",
        },
      });
      const feature2 = createMockFeature({
        properties: {
          name: "Location",
          html: '<a href="https://example.com/2">Israel Gaza Tensions Escalate</a>',
          shareimage: "",
          count: "5",
          url: "",
        },
      });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([feature1, feature2]),
      });

      const result = await fetchGdeltEvents();

      expect(result).toHaveLength(2);
    });

    it("should handle multiple similar articles keeping highest count", async () => {
      const features = [
        createMockFeature({
          properties: {
            name: "Location",
            html: '<a href="https://example.com/1">Breaking News Military Conflict</a>',
            shareimage: "",
            count: "5",
            url: "",
          },
        }),
        createMockFeature({
          properties: {
            name: "Location",
            html: '<a href="https://example.com/2">Breaking News Military Conflict Update</a>',
            shareimage: "",
            count: "20",
            url: "",
          },
        }),
        createMockFeature({
          properties: {
            name: "Location",
            html: '<a href="https://example.com/3">Breaking Military Conflict News</a>',
            shareimage: "",
            count: "10",
            url: "",
          },
        }),
      ];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse(features),
      });

      const result = await fetchGdeltEvents();

      // Should keep only the one with count 20
      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(20);
      expect(result[0].url).toBe("https://example.com/2");
    });
  });

  describe("multiple features handling", () => {
    it("should process multiple valid features", async () => {
      const features = [
        createMockFeature({
          geometry: { type: "Point", coordinates: [10, 20] },
          properties: {
            name: "Location 1",
            html: '<a href="https://example.com/1">Russia launches massive drone attack on Ukrainian infrastructure</a>',
            shareimage: "",
            count: "1",
            url: "",
          },
        }),
        createMockFeature({
          geometry: { type: "Point", coordinates: [30, 40] },
          properties: {
            name: "Location 2",
            html: '<a href="https://example.com/2">Israel Gaza ceasefire negotiations stall amid escalating tensions</a>',
            shareimage: "",
            count: "1",
            url: "",
          },
        }),
        createMockFeature({
          geometry: { type: "Point", coordinates: [50, 60] },
          properties: {
            name: "Location 3",
            html: '<a href="https://example.com/3">Earthquake devastates remote Turkish province killing dozens</a>',
            shareimage: "",
            count: "1",
            url: "",
          },
        }),
      ];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse(features),
      });

      const result = await fetchGdeltEvents();

      expect(result).toHaveLength(3);
      expect(result[0].longitude).toBe(10);
      expect(result[0].latitude).toBe(20);
      expect(result[1].longitude).toBe(30);
      expect(result[1].latitude).toBe(40);
      expect(result[2].longitude).toBe(50);
      expect(result[2].latitude).toBe(60);
    });

    it("should skip features without valid articles", async () => {
      const features = [
        createMockFeature({
          properties: {
            name: "Valid",
            html: '<a href="https://example.com">Russia deploys military forces near border region</a>',
            shareimage: "",
            count: "1",
            url: "",
          },
        }),
        createMockFeature({
          properties: {
            name: "Invalid",
            html: '<a href="https://gdeltproject.org">GDELT Only</a>',
            shareimage: "",
            count: "1",
            url: "",
          },
        }),
        createMockFeature({
          properties: {
            name: "Valid 2",
            html: '<a href="https://example2.com">Earthquake strikes Mediterranean coast causing tsunami warning</a>',
            shareimage: "",
            count: "1",
            url: "",
          },
        }),
      ];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse(features),
      });

      const result = await fetchGdeltEvents();

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("Russia deploys military forces near border region");
      expect(result[1].title).toBe("Earthquake strikes Mediterranean coast causing tsunami warning");
    });
  });
});
