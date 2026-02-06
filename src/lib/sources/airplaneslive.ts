import type { Aircraft, AirplanesLiveResponse, AirplanesLiveAircraft } from "@/types/aircraft";

const API_BASE_URL = "https://api.airplanes.live/v2";

// Conversion constants
const FEET_TO_METERS = 0.3048;
const KNOTS_TO_MS = 0.514444;
const FPM_TO_MS = 0.00508;

// ICAO hex prefix to country mapping
const ICAO_COUNTRIES: Record<string, string> = {
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
  "A": "USA", "A0": "USA", "A1": "USA", "A2": "USA",
  "A3": "USA", "A4": "USA", "A5": "USA", "A6": "USA",
  "A7": "USA", "A8": "USA", "A9": "USA", "AA": "USA",
  "AB": "USA", "AC": "USA", "AD": "USA", "AE": "USA",
  "C0": "Canada", "C1": "Canada", "C2": "Canada", "C3": "Canada",
  "78": "Chine", "79": "Chine", "7A": "Chine", "7B": "Chine", "7C": "Australie",
  "84": "Japon", "85": "Japon", "86": "Japon", "87": "Japon",
  "71": "Inde", "72": "Inde", "73": "Inde",
  "70": "Israel",
  "74": "Iran",
  "89": "Coree du Sud", "8A": "Coree du Sud",
  "01": "Afrique du Sud",
  "06": "Egypte",
  "E0": "Bresil", "E1": "Bresil", "E2": "Bresil", "E3": "Bresil",
  "E4": "Argentine",
};

function getCountryFromHex(hex: string): string | null {
  const upper = hex.toUpperCase();
  return ICAO_COUNTRIES[upper.substring(0, 2)]
    || ICAO_COUNTRIES[upper.substring(0, 1)]
    || null;
}

function parseAircraft(ac: AirplanesLiveAircraft): Aircraft | null {
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
