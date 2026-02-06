import { describe, it, expect, beforeEach, vi } from "vitest";
import { fetchEarthquakes } from "../usgs";
import type { USGSResponse } from "@/types/earthquake";

describe("fetchEarthquakes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const createMockUSGSResponse = (features: any[] = []): USGSResponse => ({
    features,
    metadata: {
      generated: Date.now(),
      count: features.length,
      title: "USGS Earthquakes",
    },
  });

  const createMockFeature = (overrides = {}) => ({
    id: "earthquake123",
    properties: {
      mag: 5.2,
      place: "Pacific Ocean",
      time: 1609459200000,
      url: "https://earthquake.usgs.gov/earthquakes/eventpage/earthquake123",
      felt: 42,
      sig: 456,
    },
    geometry: {
      coordinates: [-122.5, 37.8, 10.0], // [lng, lat, depth]
    },
    ...overrides,
  });

  describe("URL construction", () => {
    it("should construct URL with default parameters (day, 2.5)", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockUSGSResponse(),
      });
      global.fetch = mockFetch;

      await fetchEarthquakes();

      expect(mockFetch).toHaveBeenCalledWith(
        "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson",
        { next: { revalidate: 60 } }
      );
    });

    it("should construct URL with custom period (week)", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockUSGSResponse(),
      });
      global.fetch = mockFetch;

      await fetchEarthquakes("week", "4.5");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson",
        { next: { revalidate: 60 } }
      );
    });

    it("should construct URL with 'all' magnitude and 'hour' period", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockUSGSResponse(),
      });
      global.fetch = mockFetch;

      await fetchEarthquakes("hour", "all");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson",
        { next: { revalidate: 60 } }
      );
    });

    it("should construct URL with 'significant' magnitude and 'month' period", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockUSGSResponse(),
      });
      global.fetch = mockFetch;

      await fetchEarthquakes("month", "significant");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson",
        { next: { revalidate: 60 } }
      );
    });
  });

  describe("GeoJSON to Earthquake mapping", () => {
    it("should map USGS feature to Earthquake correctly", async () => {
      const mockFeature = createMockFeature();
      const mockResponse = createMockUSGSResponse([mockFeature]);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const earthquakes = await fetchEarthquakes();

      expect(earthquakes).toHaveLength(1);
      expect(earthquakes[0]).toEqual({
        id: "earthquake123",
        magnitude: 5.2,
        place: "Pacific Ocean",
        time: 1609459200000,
        latitude: 37.8, // Note: swapped from coordinates[1]
        longitude: -122.5, // Note: swapped from coordinates[0]
        depth: 10.0,
        url: "https://earthquake.usgs.gov/earthquakes/eventpage/earthquake123",
        felt: 42,
        significance: 456,
      });
    });

    it("should correctly swap longitude/latitude coordinates", async () => {
      const mockFeature = createMockFeature({
        geometry: {
          coordinates: [150.5, -35.2, 25.0], // [lng, lat, depth]
        },
      });
      const mockResponse = createMockUSGSResponse([mockFeature]);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const earthquakes = await fetchEarthquakes();

      expect(earthquakes[0].longitude).toBe(150.5);
      expect(earthquakes[0].latitude).toBe(-35.2);
      expect(earthquakes[0].depth).toBe(25.0);
    });

    it("should handle null felt value", async () => {
      const mockFeature = createMockFeature({
        properties: {
          mag: 4.5,
          place: "California",
          time: 1609459200000,
          url: "https://earthquake.usgs.gov/earthquakes/eventpage/test",
          felt: null,
          sig: 300,
        },
      });
      const mockResponse = createMockUSGSResponse([mockFeature]);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const earthquakes = await fetchEarthquakes();

      expect(earthquakes[0].felt).toBeNull();
    });

    it("should map multiple features correctly", async () => {
      const mockFeatures = [
        createMockFeature({
          id: "eq1",
          geometry: { coordinates: [100, 20, 5] },
        }),
        createMockFeature({
          id: "eq2",
          geometry: { coordinates: [-50, 30, 15] },
        }),
        createMockFeature({
          id: "eq3",
          geometry: { coordinates: [0, -10, 8] },
        }),
      ];
      const mockResponse = createMockUSGSResponse(mockFeatures);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const earthquakes = await fetchEarthquakes();

      expect(earthquakes).toHaveLength(3);
      expect(earthquakes[0].id).toBe("eq1");
      expect(earthquakes[0].latitude).toBe(20);
      expect(earthquakes[1].id).toBe("eq2");
      expect(earthquakes[1].latitude).toBe(30);
      expect(earthquakes[2].id).toBe("eq3");
      expect(earthquakes[2].latitude).toBe(-10);
    });
  });

  describe("error handling", () => {
    it("should throw error on non-ok response (404)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(fetchEarthquakes()).rejects.toThrow("USGS API error: 404");
    });

    it("should throw error on non-ok response (500)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(fetchEarthquakes()).rejects.toThrow("USGS API error: 500");
    });

    it("should throw error on network failure", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      await expect(fetchEarthquakes()).rejects.toThrow("Network error");
    });
  });

  describe("edge cases", () => {
    it("should return empty array when no features", async () => {
      const mockResponse = createMockUSGSResponse([]);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const earthquakes = await fetchEarthquakes();

      expect(earthquakes).toEqual([]);
    });

    it("should handle earthquake at equator and prime meridian", async () => {
      const mockFeature = createMockFeature({
        geometry: {
          coordinates: [0, 0, 0],
        },
      });
      const mockResponse = createMockUSGSResponse([mockFeature]);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const earthquakes = await fetchEarthquakes();

      expect(earthquakes[0].longitude).toBe(0);
      expect(earthquakes[0].latitude).toBe(0);
      expect(earthquakes[0].depth).toBe(0);
    });
  });
});
