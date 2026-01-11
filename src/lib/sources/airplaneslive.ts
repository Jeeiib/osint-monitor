import type { Aircraft, AirplanesLiveResponse, AirplanesLiveAircraft } from "@/types/aircraft";

const API_BASE_URL = "https://api.airplanes.live/v2";

// Conversion constants
const FEET_TO_METERS = 0.3048;
const KNOTS_TO_MS = 0.514444;
const FPM_TO_MS = 0.00508; // feet/min to m/s

function parseAircraft(ac: AirplanesLiveAircraft): Aircraft | null {
  // Skip if no position
  if (ac.lat === undefined || ac.lon === undefined) return null;

  const isOnGround = ac.alt_baro === "ground";
  const altitudeMeters = typeof ac.alt_baro === "number"
    ? ac.alt_baro * FEET_TO_METERS
    : null;

  return {
    icao24: ac.hex,
    callsign: ac.flight?.trim() || null,
    registration: ac.r || null,
    aircraftType: ac.t || null,
    latitude: ac.lat,
    longitude: ac.lon,
    altitude: altitudeMeters,
    velocity: ac.gs ? ac.gs * KNOTS_TO_MS : null,
    heading: ac.track ?? null,
    verticalRate: ac.baro_rate ? ac.baro_rate * FPM_TO_MS : null,
    onGround: isOnGround,
    isMilitary: (ac.dbFlags ?? 0) & 1 ? true : false,
    squawk: ac.squawk || null,
    lastSeen: ac.seen ?? 0,
  };
}

export async function fetchMilitaryAircraft(): Promise<Aircraft[]> {
  const response = await fetch(`${API_BASE_URL}/mil`, {
    next: { revalidate: 1 }, // Cache 1 second (rate limit)
  });

  if (!response.ok) {
    throw new Error(`Airplanes.live API error: ${response.status}`);
  }

  const data: AirplanesLiveResponse = await response.json();

  if (!data.ac) return [];

  return data.ac
    .map(parseAircraft)
    .filter((a): a is Aircraft => a !== null && !a.onGround);
}

export async function fetchAircraftByPoint(
  lat: number,
  lon: number,
  radiusNm: number = 250
): Promise<Aircraft[]> {
  const response = await fetch(
    `${API_BASE_URL}/point/${lat}/${lon}/${Math.min(radiusNm, 250)}`,
    { next: { revalidate: 1 } }
  );

  if (!response.ok) {
    throw new Error(`Airplanes.live API error: ${response.status}`);
  }

  const data: AirplanesLiveResponse = await response.json();

  if (!data.ac) return [];

  return data.ac
    .map(parseAircraft)
    .filter((a): a is Aircraft => a !== null && !a.onGround);
}
