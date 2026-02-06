import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextResponse } from "next/server";
import { GET } from "../route";

// Mock the airplaneslive source module
vi.mock("@/lib/sources/airplaneslive", () => ({
  fetchMilitaryAircraft: vi.fn(),
}));

// Import the mocked function to control it in tests
import { fetchMilitaryAircraft } from "@/lib/sources/airplaneslive";

describe("GET /api/aircraft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should return 200 with aircraft data on success", async () => {
    // Arrange
    const mockAircraft = [
      {
        icao: "AE01CE",
        callsign: "RCH123",
        latitude: 48.8566,
        longitude: 2.3522,
        altitude: 35000,
        heading: 270,
        speed: 450,
        type: "C17",
        registration: "01-0189",
        isMilitary: true,
      },
      {
        icao: "43C6E2",
        callsign: "POLO11",
        latitude: 51.5074,
        longitude: -0.1278,
        altitude: 28000,
        heading: 180,
        speed: 380,
        type: "A400M",
        registration: "ZM401",
        isMilitary: true,
      },
    ];

    vi.mocked(fetchMilitaryAircraft).mockResolvedValue(mockAircraft);

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(fetchMilitaryAircraft).toHaveBeenCalledTimes(1);
    expect(fetchMilitaryAircraft).toHaveBeenCalledWith();
    expect(response.status).toBe(200);
    expect(data).toEqual(mockAircraft);
    expect(data).toHaveLength(2);
    expect(data[0]).toHaveProperty("isMilitary", true);
    expect(data[1]).toHaveProperty("callsign", "POLO11");
  });

  it("should return empty array when no military aircraft found", async () => {
    // Arrange
    vi.mocked(fetchMilitaryAircraft).mockResolvedValue([]);

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
    const mockError = new Error("AirplanesLive API unavailable");
    vi.mocked(fetchMilitaryAircraft).mockRejectedValue(mockError);

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(fetchMilitaryAircraft).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Failed to fetch aircraft data" });
  });

  it("should return 500 when fetchMilitaryAircraft throws network error", async () => {
    // Arrange
    vi.mocked(fetchMilitaryAircraft).mockRejectedValue(new Error("ENOTFOUND"));

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch aircraft data");
  });

  it("should return 500 when fetchMilitaryAircraft throws timeout error", async () => {
    // Arrange
    vi.mocked(fetchMilitaryAircraft).mockRejectedValue(new Error("Request timeout"));

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data).toHaveProperty("error", "Failed to fetch aircraft data");
  });

  it("should handle malformed data gracefully", async () => {
    // Arrange - simulate API returning unexpected data
    vi.mocked(fetchMilitaryAircraft).mockResolvedValue([
      {
        icao: "TEST123",
        // Missing some optional fields
        latitude: 0,
        longitude: 0,
        altitude: 0,
        heading: 0,
        speed: 0,
        isMilitary: true,
      } as any,
    ]);

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].icao).toBe("TEST123");
  });
});
