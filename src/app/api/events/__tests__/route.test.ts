import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchGdeltEvents: vi.fn(),
  translateBatch: vi.fn(),
}));

vi.mock("@/lib/sources/gdelt-doc", () => ({
  fetchGdeltEvents: mocks.fetchGdeltEvents,
}));

vi.mock("@/lib/sources/translate", () => ({
  translateBatch: mocks.translateBatch,
}));

describe("GET /api/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset modules to clear server-side cache between tests
    vi.resetModules();
  });

  it("should return 200 with events data and default to French", async () => {
    const mockEvents = [
      {
        id: "evt1",
        title: "Military conflict in region",
        coordinates: { latitude: 50.4501, longitude: 30.5234 },
        date: "2024-01-15",
        articles: [{ title: "Military conflict in region", url: "https://example.com/1" }],
      },
    ];

    mocks.fetchGdeltEvents.mockResolvedValue(mockEvents);
    mocks.translateBatch.mockResolvedValue(["Conflit militaire dans la région"]);

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost:3000/api/events"));
    const data = await response.json();

    expect(mocks.fetchGdeltEvents).toHaveBeenCalledWith({ maxPoints: 75, timespan: "24h" });
    expect(mocks.translateBatch).toHaveBeenCalledWith(["Military conflict in region"], "fr");
    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe("Conflit militaire dans la région");
  });

  it("should respect lang query parameter", async () => {
    const mockEvents = [
      {
        id: "evt2",
        title: "Natural disaster",
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
        date: "2024-01-15",
        articles: [{ title: "Natural disaster", url: "https://example.com/2" }],
      },
    ];

    mocks.fetchGdeltEvents.mockResolvedValue(mockEvents);
    mocks.translateBatch.mockResolvedValue(["Catástrofe natural"]);

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost:3000/api/events?lang=es"));
    const data = await response.json();

    expect(mocks.translateBatch).toHaveBeenCalledWith(["Natural disaster"], "es");
    expect(data[0].title).toBe("Catástrofe natural");
  });

  it("should handle empty events array", async () => {
    mocks.fetchGdeltEvents.mockResolvedValue([]);
    mocks.translateBatch.mockResolvedValue([]);

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost:3000/api/events"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
    expect(mocks.translateBatch).not.toHaveBeenCalled();
  });

  it("should handle partial translation failures gracefully", async () => {
    const mockEvents = [
      { id: "evt3", title: "Event 1", coordinates: { latitude: 0, longitude: 0 }, date: "2024-01-15", articles: [] },
      { id: "evt4", title: "Event 2", coordinates: { latitude: 0, longitude: 0 }, date: "2024-01-15", articles: [] },
    ];

    mocks.fetchGdeltEvents.mockResolvedValue(mockEvents);
    mocks.translateBatch.mockResolvedValue(["Événement 1", null]);

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost:3000/api/events?lang=fr"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data[0].title).toBe("Événement 1");
    expect(data[1].title).toBe("Event 2");
  });

  it("should return 500 with error message on fetch failure", async () => {
    mocks.fetchGdeltEvents.mockRejectedValue(new Error("GDELT API error"));

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost:3000/api/events"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Failed to fetch events" });
  });

  it("should return 500 when translation fails", async () => {
    const mockEvents = [
      { id: "evt5", title: "Test event", coordinates: { latitude: 0, longitude: 0 }, date: "2024-01-15", articles: [] },
    ];

    mocks.fetchGdeltEvents.mockResolvedValue(mockEvents);
    mocks.translateBatch.mockRejectedValue(new Error("Translation API error"));

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost:3000/api/events"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Failed to fetch events" });
  });

  it("should use cache when available and valid", async () => {
    const mockEvents = [
      { id: "evt6", title: "Cached event", coordinates: { latitude: 0, longitude: 0 }, date: "2024-01-15", articles: [] },
    ];

    mocks.fetchGdeltEvents.mockResolvedValue(mockEvents);
    mocks.translateBatch.mockResolvedValue(["Événement en cache"]);

    const { GET } = await import("../route");

    // First request
    const response1 = await GET(new Request("http://localhost:3000/api/events?lang=fr"));
    const data1 = await response1.json();

    // Second request (should use cache)
    const response2 = await GET(new Request("http://localhost:3000/api/events?lang=fr"));
    const data2 = await response2.json();

    expect(mocks.fetchGdeltEvents).toHaveBeenCalledTimes(1);
    expect(mocks.translateBatch).toHaveBeenCalledTimes(1);
    expect(data1).toEqual(data2);
    expect(data2[0].title).toBe("Événement en cache");
  });

  it("should invalidate cache when language changes", async () => {
    // Return fresh objects each call (route mutates titles in-place)
    mocks.fetchGdeltEvents.mockImplementation(async () => [
      { id: "evt7", title: "Language test", coordinates: { latitude: 0, longitude: 0 }, date: "2024-01-15", articles: [] },
    ]);
    mocks.translateBatch
      .mockResolvedValueOnce(["Test de langue"])
      .mockResolvedValueOnce(["Language test"]);

    const { GET } = await import("../route");

    // First request in French
    await GET(new Request("http://localhost:3000/api/events?lang=fr"));

    // Second request in English (cache invalidated)
    await GET(new Request("http://localhost:3000/api/events?lang=en"));

    expect(mocks.fetchGdeltEvents).toHaveBeenCalledTimes(2);
    expect(mocks.translateBatch).toHaveBeenCalledTimes(2);
    expect(mocks.translateBatch).toHaveBeenNthCalledWith(1, ["Language test"], "fr");
    expect(mocks.translateBatch).toHaveBeenNthCalledWith(2, ["Language test"], "en");
  });

  it("should handle multiple events with translation", async () => {
    const mockEvents = [
      { id: "evt8", title: "Event 1", coordinates: { latitude: 0, longitude: 0 }, date: "2024-01-15", articles: [] },
      { id: "evt9", title: "Event 2", coordinates: { latitude: 0, longitude: 0 }, date: "2024-01-15", articles: [] },
      { id: "evt10", title: "Event 3", coordinates: { latitude: 0, longitude: 0 }, date: "2024-01-15", articles: [] },
    ];

    mocks.fetchGdeltEvents.mockResolvedValue(mockEvents);
    mocks.translateBatch.mockResolvedValue(["Événement 1", "Événement 2", "Événement 3"]);

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost:3000/api/events?lang=fr"));
    const data = await response.json();

    expect(mocks.translateBatch).toHaveBeenCalledWith(["Event 1", "Event 2", "Event 3"], "fr");
    expect(data).toHaveLength(3);
    expect(data[0].title).toBe("Événement 1");
    expect(data[1].title).toBe("Événement 2");
    expect(data[2].title).toBe("Événement 3");
  });
});
