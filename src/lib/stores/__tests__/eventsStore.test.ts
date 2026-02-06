import { describe, it, expect, beforeEach, vi } from "vitest";
import { useEventsStore } from "../eventsStore";

describe("eventsStore", () => {
  beforeEach(() => {
    // Reset to initial state before each test
    useEventsStore.setState({
      events: [],
      isLoading: false,
      error: null,
      lastUpdate: null,
      selectedEventIndex: null,
    });

    // Reset fetch mock
    vi.resetAllMocks();
  });

  describe("initial state", () => {
    it("should have empty events array", () => {
      const state = useEventsStore.getState();

      expect(state.events).toEqual([]);
    });

    it("should not be loading", () => {
      const state = useEventsStore.getState();

      expect(state.isLoading).toBe(false);
    });

    it("should have no error", () => {
      const state = useEventsStore.getState();

      expect(state.error).toBeNull();
    });

    it("should have no lastUpdate", () => {
      const state = useEventsStore.getState();

      expect(state.lastUpdate).toBeNull();
    });

    it("should have no selectedEventIndex", () => {
      const state = useEventsStore.getState();

      expect(state.selectedEventIndex).toBeNull();
    });
  });

  describe("fetchEvents", () => {
    it("should set isLoading to true when starting fetch", async () => {
      const mockFetch = vi.fn(() => new Promise(() => {})); // Never resolves
      global.fetch = mockFetch;

      const { fetchEvents } = useEventsStore.getState();

      const fetchPromise = fetchEvents();

      // Check immediately after calling fetch
      expect(useEventsStore.getState().isLoading).toBe(true);
      expect(useEventsStore.getState().error).toBeNull();

      // Clean up
      await Promise.race([fetchPromise, new Promise(resolve => setTimeout(resolve, 10))]);
    });

    it("should successfully fetch and store event data", async () => {
      const mockEvents = [
        {
          id: "evt1",
          title: "Military activity detected",
          description: "Satellite imagery shows increased activity",
          date: "2026-02-06",
          latitude: 50.4501,
          longitude: 30.5234,
          source: "OSINT Report",
          url: "https://example.com/evt1",
        },
        {
          id: "evt2",
          title: "Border incident reported",
          description: "Multiple sources confirm incident",
          date: "2026-02-05",
          latitude: 48.3794,
          longitude: 31.1656,
          source: "Local Media",
          url: "https://example.com/evt2",
        },
      ];

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEvents),
        } as Response)
      );
      global.fetch = mockFetch;

      const { fetchEvents } = useEventsStore.getState();

      await fetchEvents();

      const state = useEventsStore.getState();
      expect(state.events).toEqual(mockEvents);
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

      const { fetchEvents } = useEventsStore.getState();

      await fetchEvents();

      expect(mockFetch).toHaveBeenCalledWith("/api/events");
    });

    it("should silently handle HTTP errors and set isLoading to false", async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
        } as Response)
      );
      global.fetch = mockFetch;

      const { fetchEvents } = useEventsStore.getState();

      await fetchEvents();

      const state = useEventsStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.events).toEqual([]); // Remains empty
      expect(state.lastUpdate).toBeNull(); // Not updated
    });

    it("should silently handle network errors and set isLoading to false", async () => {
      const mockFetch = vi.fn(() =>
        Promise.reject(new Error("Network error"))
      );
      global.fetch = mockFetch;

      const { fetchEvents } = useEventsStore.getState();

      await fetchEvents();

      const state = useEventsStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.events).toEqual([]); // Remains empty
      expect(state.lastUpdate).toBeNull(); // Not updated
    });

    it("should clear error before fetching", async () => {
      // Set an initial error
      useEventsStore.setState({ error: "Previous error" });

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
      );
      global.fetch = mockFetch;

      const { fetchEvents } = useEventsStore.getState();

      await fetchEvents();

      const state = useEventsStore.getState();
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

      const { fetchEvents } = useEventsStore.getState();

      await fetchEvents();

      const afterFetch = new Date();
      const state = useEventsStore.getState();

      expect(state.lastUpdate).toBeInstanceOf(Date);
      expect(state.lastUpdate!.getTime()).toBeGreaterThanOrEqual(beforeFetch.getTime());
      expect(state.lastUpdate!.getTime()).toBeLessThanOrEqual(afterFetch.getTime());
    });
  });

  describe("selectEvent", () => {
    it("should set selectedEventIndex to the specified index", () => {
      const { selectEvent } = useEventsStore.getState();

      selectEvent(3);

      expect(useEventsStore.getState().selectedEventIndex).toBe(3);
    });

    it("should set selectedEventIndex to null when passed null", () => {
      // First set a selected event
      useEventsStore.setState({ selectedEventIndex: 5 });

      const { selectEvent } = useEventsStore.getState();

      selectEvent(null);

      expect(useEventsStore.getState().selectedEventIndex).toBeNull();
    });

    it("should allow selecting index 0", () => {
      const { selectEvent } = useEventsStore.getState();

      selectEvent(0);

      expect(useEventsStore.getState().selectedEventIndex).toBe(0);
    });

    it("should update selectedEventIndex multiple times", () => {
      const { selectEvent } = useEventsStore.getState();

      selectEvent(1);
      expect(useEventsStore.getState().selectedEventIndex).toBe(1);

      selectEvent(5);
      expect(useEventsStore.getState().selectedEventIndex).toBe(5);

      selectEvent(null);
      expect(useEventsStore.getState().selectedEventIndex).toBeNull();

      selectEvent(3);
      expect(useEventsStore.getState().selectedEventIndex).toBe(3);
    });

    it("should not affect other state properties", () => {
      // Set up some initial state
      useEventsStore.setState({
        events: [{ id: "test" } as any],
        isLoading: true,
        error: "Some error",
      });

      const { selectEvent } = useEventsStore.getState();

      selectEvent(2);

      const state = useEventsStore.getState();
      expect(state.selectedEventIndex).toBe(2);
      expect(state.events).toEqual([{ id: "test" }]);
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe("Some error");
    });
  });
});
