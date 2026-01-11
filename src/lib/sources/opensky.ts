import type { Aircraft, OpenSkyResponse } from "@/types/aircraft";

const OPENSKY_BASE_URL = "https://opensky-network.org/api";

export async function fetchAircraft(bounds?: {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}): Promise<Aircraft[]> {
  let url = `${OPENSKY_BASE_URL}/states/all`;

  // Add bounding box if provided (reduces data)
  if (bounds) {
    url += `?lamin=${bounds.minLat}&lomin=${bounds.minLon}&lamax=${bounds.maxLat}&lomax=${bounds.maxLon}`;
  }

  const response = await fetch(url, {
    next: { revalidate: 10 }, // Cache 10 seconds
  });

  if (!response.ok) {
    throw new Error(`OpenSky API error: ${response.status}`);
  }

  const data: OpenSkyResponse = await response.json();

  if (!data.states) return [];

  return data.states
    .map((state): Aircraft => ({
      icao24: state[0] as string,
      callsign: (state[1] as string)?.trim() || null,
      originCountry: state[2] as string,
      longitude: state[5] as number | null,
      latitude: state[6] as number | null,
      altitude: state[7] as number | null,
      velocity: state[9] as number | null,
      heading: state[10] as number | null,
      verticalRate: state[11] as number | null,
      onGround: state[8] as boolean,
      lastContact: state[4] as number,
    }))
    .filter((a) => a.latitude !== null && a.longitude !== null && !a.onGround);
}
