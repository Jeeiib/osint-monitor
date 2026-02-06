import { describe, it, expect, beforeEach, vi } from "vitest";
import { fetchMilitaryAircraft } from "../airplaneslive";
import type { AirplanesLiveResponse } from "@/types/aircraft";

// Constants from source file
const FEET_TO_METERS = 0.3048;
const KNOTS_TO_MS = 0.514444;
const FPM_TO_MS = 0.00508;

describe("fetchMilitaryAircraft", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const createMockAircraft = (overrides = {}) => ({
    hex: "AE1234",
    flight: "USAF123 ",
    r: "N12345",
    t: "F16",
    lat: 37.8,
    lon: -122.5,
    alt_baro: 35000,
    gs: 450,
    track: 180,
    baro_rate: 0,
    squawk: "7700",
    dbFlags: 1,
    seen: 2,
    ...overrides,
  });

  const createMockResponse = (ac: any[] = []): AirplanesLiveResponse => ({
    ac,
    msg: "ok",
    now: Date.now() / 1000,
    total: ac.length,
  });

  describe("API integration", () => {
    it("should fetch from correct endpoint", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([]),
      });
      global.fetch = mockFetch;

      await fetchMilitaryAircraft();

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.airplanes.live/v2/mil",
        { next: { revalidate: 1 } }
      );
    });

    it("should throw error on non-ok response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      });

      await expect(fetchMilitaryAircraft()).rejects.toThrow(
        "Airplanes.live API error: 503"
      );
    });

    it("should return empty array when ac is undefined", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ msg: "ok" }),
      });

      const result = await fetchMilitaryAircraft();

      expect(result).toEqual([]);
    });

    it("should return empty array when ac is empty", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result).toEqual([]);
    });
  });

  describe("country detection from hex (ICAO)", () => {
    it("should detect USA from single-char prefix 'A'", async () => {
      const mockAircraft = createMockAircraft({ hex: "A12345" });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockAircraft]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result[0].originCountry).toBe("USA");
    });

    it("should detect USA from two-char prefix 'AE'", async () => {
      const mockAircraft = createMockAircraft({ hex: "AE1234" });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockAircraft]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result[0].originCountry).toBe("USA");
    });

    it("should detect France from prefix '38'", async () => {
      const mockAircraft = createMockAircraft({ hex: "389ABC" });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockAircraft]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result[0].originCountry).toBe("France");
    });

    it("should detect UK from prefix '40'", async () => {
      const mockAircraft = createMockAircraft({ hex: "406789" });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockAircraft]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result[0].originCountry).toBe("Royaume-Uni");
    });

    it("should detect Canada from prefix 'C0'", async () => {
      const mockAircraft = createMockAircraft({ hex: "C01234" });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockAircraft]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result[0].originCountry).toBe("Canada");
    });

    it("should detect Russia from prefix '51'", async () => {
      const mockAircraft = createMockAircraft({ hex: "51ABCD" });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockAircraft]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result[0].originCountry).toBe("Russie");
    });

    it("should handle lowercase hex codes", async () => {
      const mockAircraft = createMockAircraft({ hex: "ae1234" });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockAircraft]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result[0].originCountry).toBe("USA");
    });

    it("should return null for unknown country prefix", async () => {
      const mockAircraft = createMockAircraft({ hex: "ZZZZZZ" });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockAircraft]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result[0].originCountry).toBeNull();
    });
  });

  describe("aircraft parsing and filtering", () => {
    it("should filter out aircraft missing latitude", async () => {
      const mockAircraft = createMockAircraft({ lat: undefined });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockAircraft]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result).toEqual([]);
    });

    it("should filter out aircraft missing longitude", async () => {
      const mockAircraft = createMockAircraft({ lon: undefined });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockAircraft]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result).toEqual([]);
    });

    it("should filter out aircraft on ground", async () => {
      const mockAircraft = createMockAircraft({ alt_baro: "ground" });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockAircraft]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result).toEqual([]);
    });

    it("should include airborne aircraft", async () => {
      const mockAircraft = createMockAircraft({ alt_baro: 35000 });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockAircraft]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result).toHaveLength(1);
      expect(result[0].onGround).toBe(false);
    });

    it("should parse military flag from dbFlags bit 0", async () => {
      const military = createMockAircraft({ dbFlags: 1 });
      const nonMilitary = createMockAircraft({ hex: "406789", dbFlags: 0 });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([military, nonMilitary]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result[0].isMilitary).toBe(true);
      expect(result[1].isMilitary).toBe(false);
    });

    it("should handle missing dbFlags as non-military", async () => {
      const mockAircraft = createMockAircraft({ dbFlags: undefined });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockAircraft]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result[0].isMilitary).toBe(false);
    });
  });

  describe("unit conversions", () => {
    it("should convert altitude from feet to meters", async () => {
      const mockAircraft = createMockAircraft({ alt_baro: 35000 });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockAircraft]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result[0].altitude).toBe(35000 * FEET_TO_METERS);
      expect(result[0].altitude).toBeCloseTo(10668, 0);
    });

    it("should convert ground speed from knots to m/s", async () => {
      const mockAircraft = createMockAircraft({ gs: 450 });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockAircraft]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result[0].velocity).toBe(450 * KNOTS_TO_MS);
      expect(result[0].velocity).toBeCloseTo(231.5, 1);
    });

    it("should convert vertical rate from fpm to m/s", async () => {
      const mockAircraft = createMockAircraft({ baro_rate: 2000 });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockAircraft]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result[0].verticalRate).toBe(2000 * FPM_TO_MS);
      expect(result[0].verticalRate).toBeCloseTo(10.16, 1);
    });

    it("should handle null altitude when on ground", async () => {
      const mockAircraft = createMockAircraft({ alt_baro: "ground" });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockAircraft]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result).toEqual([]); // Filtered out
    });

    it("should handle missing velocity", async () => {
      const mockAircraft = createMockAircraft({ gs: undefined });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockAircraft]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result[0].velocity).toBeNull();
    });

    it("should handle missing vertical rate", async () => {
      const mockAircraft = createMockAircraft({ baro_rate: undefined });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockAircraft]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result[0].verticalRate).toBeNull();
    });
  });

  describe("field mapping", () => {
    it("should map all fields correctly", async () => {
      const mockAircraft = createMockAircraft({
        hex: "AE1234",
        flight: "USAF123 ",
        r: "N12345",
        t: "F16",
        lat: 37.8,
        lon: -122.5,
        alt_baro: 35000,
        gs: 450,
        track: 180,
        baro_rate: 2000,
        squawk: "7700",
        dbFlags: 1,
        seen: 2,
      });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockAircraft]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result[0]).toEqual({
        icao24: "AE1234",
        callsign: "USAF123",
        registration: "N12345",
        aircraftType: "F16",
        originCountry: "USA",
        latitude: 37.8,
        longitude: -122.5,
        altitude: 35000 * FEET_TO_METERS,
        velocity: 450 * KNOTS_TO_MS,
        heading: 180,
        verticalRate: 2000 * FPM_TO_MS,
        onGround: false,
        isMilitary: true,
        squawk: "7700",
        lastSeen: 2,
      });
    });

    it("should trim callsign whitespace", async () => {
      const mockAircraft = createMockAircraft({ flight: "  USAF123  " });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockAircraft]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result[0].callsign).toBe("USAF123");
    });

    it("should handle missing optional fields as null", async () => {
      const mockAircraft = {
        hex: "AE1234",
        lat: 37.8,
        lon: -122.5,
        alt_baro: 35000,
        // All other fields missing
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockAircraft]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result[0].callsign).toBeNull();
      expect(result[0].registration).toBeNull();
      expect(result[0].aircraftType).toBeNull();
      expect(result[0].velocity).toBeNull();
      expect(result[0].heading).toBeNull();
      expect(result[0].verticalRate).toBeNull();
      expect(result[0].squawk).toBeNull();
    });

    it("should handle heading of 0 (north)", async () => {
      const mockAircraft = createMockAircraft({ track: 0 });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockResponse([mockAircraft]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result[0].heading).toBe(0);
    });
  });

  describe("multiple aircraft handling", () => {
    it("should parse multiple aircraft", async () => {
      const mockAircraft1 = createMockAircraft({ hex: "AE1111" });
      const mockAircraft2 = createMockAircraft({ hex: "AE2222" });
      const mockAircraft3 = createMockAircraft({ hex: "AE3333" });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () =>
          createMockResponse([mockAircraft1, mockAircraft2, mockAircraft3]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result).toHaveLength(3);
      expect(result[0].icao24).toBe("AE1111");
      expect(result[1].icao24).toBe("AE2222");
      expect(result[2].icao24).toBe("AE3333");
    });

    it("should filter mixed valid/invalid aircraft", async () => {
      const valid1 = createMockAircraft({ hex: "AE1111" });
      const noCoords = createMockAircraft({ hex: "AE2222", lat: undefined });
      const onGround = createMockAircraft({ hex: "AE3333", alt_baro: "ground" });
      const valid2 = createMockAircraft({ hex: "AE4444" });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () =>
          createMockResponse([valid1, noCoords, onGround, valid2]),
      });

      const result = await fetchMilitaryAircraft();

      expect(result).toHaveLength(2);
      expect(result[0].icao24).toBe("AE1111");
      expect(result[1].icao24).toBe("AE4444");
    });
  });
});
