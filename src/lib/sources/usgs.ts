import type { Earthquake, USGSResponse } from "@/types/earthquake";

const USGS_BASE_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary";

type Period = "hour" | "day" | "week" | "month";
type MinMagnitude = "significant" | "4.5" | "2.5" | "1.0" | "all";

export async function fetchEarthquakes(
  period: Period = "day",
  minMagnitude: MinMagnitude = "2.5"
): Promise<Earthquake[]> {
  const url = `${USGS_BASE_URL}/${minMagnitude}_${period}.geojson`;

  const response = await fetch(url, {
    next: { revalidate: 60 }, // Cache 1 minute
  });

  if (!response.ok) {
    throw new Error(`USGS API error: ${response.status}`);
  }

  const data: USGSResponse = await response.json();

  return data.features.map((feature) => ({
    id: feature.id,
    magnitude: feature.properties.mag,
    place: feature.properties.place,
    time: feature.properties.time,
    latitude: feature.geometry.coordinates[1],
    longitude: feature.geometry.coordinates[0],
    depth: feature.geometry.coordinates[2],
    url: feature.properties.url,
    felt: feature.properties.felt,
    significance: feature.properties.sig,
  }));
}
