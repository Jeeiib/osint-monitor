import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextResponse } from "next/server";
import { GET } from "../route";

// Mock the USGS source module
vi.mock("@/lib/sources/usgs", () => ({
  fetchEarthquakes: vi.fn(),
}));

// Import the mocked function to control it in tests
import { fetchEarthquakes } from "@/lib/sources/usgs";

describe("GET /api/earthquakes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should return 200 with earthquake data on success", async () => {
    // Arrange
    const mockEarthquakes = [
      {
        id: "us7000m8ng",
        magnitude: 6.2,
        location: "123km NW of Kota Ternate, Indonesia",
        coordinates: { latitude: 1.6527, longitude: 126.4263 },
        depth: 10,
        timestamp: "2024-01-15T12:34:56.789Z",
      },
      {
        id: "us7000m8nh",
        magnitude: 5.8,
        location: "Southern Alaska",
        coordinates: { latitude: 61.2345, longitude: -149.8765 },
        depth: 45.2,
        timestamp: "2024-01-15T10:20:30.000Z",
      },
    ];

    vi.mocked(fetchEarthquakes).mockResolvedValue(mockEarthquakes);

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(fetchEarthquakes).toHaveBeenCalledTimes(1);
    expect(fetchEarthquakes).toHaveBeenCalledWith("week", "4.5");
    expect(response.status).toBe(200);
    expect(data).toEqual(mockEarthquakes);
    expect(data).toHaveLength(2);
    expect(data[0]).toHaveProperty("magnitude", 6.2);
  });

  it("should return empty array when no earthquakes found", async () => {
    // Arrange
    vi.mocked(fetchEarthquakes).mockResolvedValue([]);

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toEqual([]);
    expect(data).toHaveLength(0);
  });

  it("should return 500 with error message on fetch failure", async () => {
    // Arrange
    const mockError = new Error("USGS API timeout");
    vi.mocked(fetchEarthquakes).mockRejectedValue(mockError);

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(fetchEarthquakes).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Failed to fetch earthquake data" });
  });

  it("should return 500 when fetchEarthquakes throws network error", async () => {
    // Arrange
    vi.mocked(fetchEarthquakes).mockRejectedValue(new Error("Network error"));

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch earthquake data");
  });

  it("should return 500 when fetchEarthquakes throws unexpected error", async () => {
    // Arrange
    vi.mocked(fetchEarthquakes).mockRejectedValue(new Error("Unexpected error"));

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data).toHaveProperty("error");
  });
});
