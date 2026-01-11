import type { Aircraft, AirplanesLiveResponse, AirplanesLiveAircraft } from "@/types/aircraft";

const API_BASE_URL = "https://api.airplanes.live/v2";

// Conversion constants
const FEET_TO_METERS = 0.3048;
const KNOTS_TO_MS = 0.514444;
const FPM_TO_MS = 0.00508; // feet/min to m/s

// ICAO hex prefix to country mapping (first 2-3 chars)
const ICAO_COUNTRIES: Record<string, string> = {
  // Europe
  "38": "France", "39": "France", "3A": "France", "3B": "France",
  "40": "Royaume-Uni", "41": "Royaume-Uni", "42": "Royaume-Uni", "43": "Royaume-Uni",
  "44": "Allemagne", "45": "Allemagne",
  "46": "Allemagne", "47": "Allemagne",
  "48": "Italie", "49": "Italie",
  "4A": "Espagne", "4B": "Espagne",
  "4C": "Pays-Bas",
  "4D": "Belgique",
  "50": "Ukraine",
  "51": "Russie", "52": "Russie", "53": "Russie", "54": "Russie", "55": "Russie",
  // North America
  "A": "États-Unis", "A0": "États-Unis", "A1": "États-Unis", "A2": "États-Unis",
  "A3": "États-Unis", "A4": "États-Unis", "A5": "États-Unis", "A6": "États-Unis",
  "A7": "États-Unis", "A8": "États-Unis", "A9": "États-Unis", "AA": "États-Unis",
  "AB": "États-Unis", "AC": "États-Unis", "AD": "États-Unis", "AE": "États-Unis",
  "C0": "Canada", "C1": "Canada", "C2": "Canada", "C3": "Canada",
  // Asia
  "78": "Chine", "79": "Chine", "7A": "Chine", "7B": "Chine", "7C": "Australie",
  "84": "Japon", "85": "Japon", "86": "Japon", "87": "Japon",
  "71": "Inde", "72": "Inde", "73": "Inde",
  // Middle East
  "70": "Israël",
  "74": "Iran",
  "89": "Corée du Sud", "8A": "Corée du Sud",
  // Africa
  "01": "Afrique du Sud",
  "06": "Égypte",
  // South America
  "E0": "Brésil", "E1": "Brésil", "E2": "Brésil", "E3": "Brésil",
  "E4": "Argentine",
};

function getCountryFromHex(hex: string): string | null {
  const upper = hex.toUpperCase();
  // Try 2 chars first, then 1 char
  return ICAO_COUNTRIES[upper.substring(0, 2)]
    || ICAO_COUNTRIES[upper.substring(0, 1)]
    || null;
}

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
    originCountry: getCountryFromHex(ac.hex),
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
    next: { revalidate: 1 },
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

// Track last fetch time to respect rate limits
let lastFetchTime = 0;
const MIN_FETCH_INTERVAL = 1500; // 1.5 seconds between API calls

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastFetchTime;
  if (elapsed < MIN_FETCH_INTERVAL) {
    await new Promise(r => setTimeout(r, MIN_FETCH_INTERVAL - elapsed));
  }
  lastFetchTime = Date.now();
}

export async function fetchAllAircraft(
  centerLat?: number,
  centerLon?: number
): Promise<Aircraft[]> {
  const results: Aircraft[] = [];
  const seen = new Set<string>();

  // Always fetch military aircraft globally
  try {
    await waitForRateLimit();
    const military = await fetchMilitaryAircraft();
    for (const ac of military) {
      if (!seen.has(ac.icao24)) {
        seen.add(ac.icao24);
        results.push(ac);
      }
    }
  } catch (e) {
    console.error("Failed to fetch military aircraft:", e);
  }

  // If we have a center point, also fetch local aircraft
  if (centerLat !== undefined && centerLon !== undefined) {
    try {
      await waitForRateLimit();
      const local = await fetchAircraftByPoint(centerLat, centerLon, 250);
      for (const ac of local) {
        if (!seen.has(ac.icao24)) {
          seen.add(ac.icao24);
          results.push(ac);
        }
      }
    } catch (e) {
      console.error("Failed to fetch local aircraft:", e);
    }
  }

  return results;
}
