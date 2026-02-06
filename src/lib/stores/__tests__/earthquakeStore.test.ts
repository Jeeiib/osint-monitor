import { describe, it, expect, beforeEach, vi } from "vitest";
import { useEarthquakeStore } from "../earthquakeStore";

describe("earthquakeStore", () => {
  beforeEach(() => {
    // Reset to initial state before each test
    useEarthquakeStore.setState({
      earthquakes: [],
      isLoading: false,
      error: null,
      lastUpdate: null,
    });

    // Reset fetch mock
    vi.resetAllMocks();
  });

  describe("initial state", () => {
    it("should have empty earthquakes array", () => {
      const state = useEarthquakeStore.getState();

      expect(state.earthquakes).toEqual([]);
    });

    it("should not be loading", () => {
      const state = useEarthquakeStore.getState();

      expect(state.isLoading).toBe(false);
    });

    it("should have no error", () => {
      const state = useEarthquakeStore.getState();

      expect(state.error).toBeNull();
    });

    it("should have no lastUpdate", () => {
      const state = useEarthquakeStore.getState();

      expect(state.lastUpdate).toBeNull();
    });
  });

  describe("fetchEarthquakes", () => {
    it("should set isLoading to true when starting fetch", async () => {
      const mockFetch = vi.fn(() => new Promise(() => {})); // Never resolves
      global.fetch = mockFetch;

      const { fetchEarthquakes } = useEarthquakeStore.getState();

      const fetchPromise = fetchEarthquakes();

      // Check immediately after calling fetch
      expect(useEarthquakeStore.getState().isLoading).toBe(true);
      expect(useEarthquakeStore.getState().error).toBeNull();

      // Clean up
      await Promise.race([fetchPromise, new Promise(resolve => setTimeout(resolve, 10))]);
    });

    it("should successfully fetch and store earthquake data", async () => {
      const mockEarthquakes = [
        {
          id: "us7000kzx1",
          magnitude: 6.5,
          place: "Near the coast of Japan",
          time: Date.now(),
          latitude: 35.6762,
          longitude: 139.6503,
          depth: 10,
          url: "https://earthquake.usgs.gov/earthquakes/eventpage/us7000kzx1",
        },
        {
          id: "us7000kzy2",
          magnitude: 5.2,
          place: "Southern California",
          time: Date.now() - 60000,
          latitude: 34.0522,
          longitude: -118.2437,
          depth: 15,
          url: "https://earthquake.usgs.gov/earthquakes/eventpage/us7000kzy2",
        },
      ];

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEarthquakes),
        } as Response)
      );
      global.fetch = mockFetch;

      const { fetchEarthquakes } = useEarthquakeStore.getState();

      await fetchEarthquakes();

      const state = useEarthquakeStore.getState();
      expect(state.earthquakes).toEqual(mockEarthquakes);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.lastUpdate).toBeInstanceOf(Date);
    });

    it("should call the correct API endpoint", async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
      );
      global.fetch = mockFetch;

      const { fetchEarthquakes } = useEarthquakeStore.getState();

      await fetchEarthquakes();

      expect(mockFetch).toHaveBeenCalledWith("/api/earthquakes");
    });

    it("should silently handle HTTP errors and set isLoading to false", async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 503,
        } as Response)
      );
      global.fetch = mockFetch;

      const { fetchEarthquakes } = useEarthquakeStore.getState();

      await fetchEarthquakes();

      const state = useEarthquakeStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.earthquakes).toEqual([]); // Remains empty
      expect(state.lastUpdate).toBeNull(); // Not updated
    });

    it("should silently handle network errors and set isLoading to false", async () => {
      const mockFetch = vi.fn(() =>
        Promise.reject(new Error("Network error"))
      );
      global.fetch = mockFetch;

      const { fetchEarthquakes } = useEarthquakeStore.getState();

      await fetchEarthquakes();

      const state = useEarthquakeStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.earthquakes).toEqual([]); // Remains empty
      expect(state.lastUpdate).toBeNull(); // Not updated
    });

    it("should clear error before fetching", async () => {
      // Set an initial error
      useEarthquakeStore.setState({ error: "Previous error" });

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
      );
      global.fetch = mockFetch;

      const { fetchEarthquakes } = useEarthquakeStore.getState();

      await fetchEarthquakes();

      const state = useEarthquakeStore.getState();
      expect(state.error).toBeNull();
    });

    it("should update lastUpdate timestamp on successful fetch", async () => {
      const beforeFetch = new Date();

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
      );
      global.fetch = mockFetch;

      const { fetchEarthquakes } = useEarthquakeStore.getState();

      await fetchEarthquakes();

      const afterFetch = new Date();
      const state = useEarthquakeStore.getState();

      expect(state.lastUpdate).toBeInstanceOf(Date);
      expect(state.lastUpdate!.getTime()).toBeGreaterThanOrEqual(beforeFetch.getTime());
      expect(state.lastUpdate!.getTime()).toBeLessThanOrEqual(afterFetch.getTime());
    });

    it("should handle JSON parsing errors silently", async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.reject(new Error("Invalid JSON")),
        } as Response)
      );
      global.fetch = mockFetch;

      const { fetchEarthquakes } = useEarthquakeStore.getState();

      await fetchEarthquakes();

      const state = useEarthquakeStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.earthquakes).toEqual([]);
      expect(state.lastUpdate).toBeNull();
    });
  });
});
