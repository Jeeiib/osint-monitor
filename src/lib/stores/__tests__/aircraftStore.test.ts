import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAircraftStore } from "../aircraftStore";

describe("aircraftStore", () => {
  beforeEach(() => {
    // Reset to initial state before each test
    useAircraftStore.setState({
      aircraft: [],
      isLoading: false,
      error: null,
      lastUpdate: null,
    });

    // Reset fetch mock
    vi.resetAllMocks();
  });

  describe("initial state", () => {
    it("should have empty aircraft array", () => {
      const state = useAircraftStore.getState();

      expect(state.aircraft).toEqual([]);
    });

    it("should not be loading", () => {
      const state = useAircraftStore.getState();

      expect(state.isLoading).toBe(false);
    });

    it("should have no error", () => {
      const state = useAircraftStore.getState();

      expect(state.error).toBeNull();
    });

    it("should have no lastUpdate", () => {
      const state = useAircraftStore.getState();

      expect(state.lastUpdate).toBeNull();
    });
  });

  describe("fetchAircraft", () => {
    it("should set isLoading to true when starting fetch", async () => {
      const mockFetch = vi.fn(() => new Promise(() => {})); // Never resolves
      global.fetch = mockFetch;

      const { fetchAircraft } = useAircraftStore.getState();

      const fetchPromise = fetchAircraft();

      // Check immediately after calling fetch
      expect(useAircraftStore.getState().isLoading).toBe(true);
      expect(useAircraftStore.getState().error).toBeNull();

      // Clean up
      await Promise.race([fetchPromise, new Promise(resolve => setTimeout(resolve, 10))]);
    });

    it("should successfully fetch and store aircraft data", async () => {
      const mockAircraft = [
        {
          icao24: "abc123",
          callsign: "TEST001",
          latitude: 48.8566,
          longitude: 2.3522,
          altitude: 10000,
          velocity: 250,
          heading: 180,
          verticalRate: 0,
        },
        {
          icao24: "def456",
          callsign: "TEST002",
          latitude: 51.5074,
          longitude: -0.1278,
          altitude: 12000,
          velocity: 300,
          heading: 90,
          verticalRate: 5,
        },
      ];

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAircraft),
        } as Response)
      );
      global.fetch = mockFetch;

      const { fetchAircraft } = useAircraftStore.getState();

      await fetchAircraft();

      const state = useAircraftStore.getState();
      expect(state.aircraft).toEqual(mockAircraft);
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

      const { fetchAircraft } = useAircraftStore.getState();

      await fetchAircraft();

      expect(mockFetch).toHaveBeenCalledWith("/api/aircraft");
    });

    it("should silently handle HTTP errors and set isLoading to false", async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        } as Response)
      );
      global.fetch = mockFetch;

      const { fetchAircraft } = useAircraftStore.getState();

      await fetchAircraft();

      const state = useAircraftStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.aircraft).toEqual([]); // Remains empty
      expect(state.lastUpdate).toBeNull(); // Not updated
    });

    it("should silently handle network errors and set isLoading to false", async () => {
      const mockFetch = vi.fn(() =>
        Promise.reject(new Error("Network error"))
      );
      global.fetch = mockFetch;

      const { fetchAircraft } = useAircraftStore.getState();

      await fetchAircraft();

      const state = useAircraftStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.aircraft).toEqual([]); // Remains empty
      expect(state.lastUpdate).toBeNull(); // Not updated
    });

    it("should clear error before fetching", async () => {
      // Set an initial error
      useAircraftStore.setState({ error: "Previous error" });

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
      );
      global.fetch = mockFetch;

      const { fetchAircraft } = useAircraftStore.getState();

      await fetchAircraft();

      const state = useAircraftStore.getState();
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

      const { fetchAircraft } = useAircraftStore.getState();

      await fetchAircraft();

      const afterFetch = new Date();
      const state = useAircraftStore.getState();

      expect(state.lastUpdate).toBeInstanceOf(Date);
      expect(state.lastUpdate!.getTime()).toBeGreaterThanOrEqual(beforeFetch.getTime());
      expect(state.lastUpdate!.getTime()).toBeLessThanOrEqual(afterFetch.getTime());
    });
  });
});
