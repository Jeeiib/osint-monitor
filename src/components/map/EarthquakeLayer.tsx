"use client";

import { useEffect, useMemo } from "react";
import { Source, Layer } from "react-map-gl/mapbox";
import type { LayerProps } from "react-map-gl/mapbox";
import type { FeatureCollection, Point } from "geojson";
import { useEarthquakeStore, useFilterStore } from "@/lib/stores";

const earthquakeLayerStyle: LayerProps = {
  id: "earthquakes-native",
  type: "circle",
  paint: {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["get", "magnitude"],
      5.5, 4,
      6.5, 7,
      7.5, 11,
      8.5, 16,
    ],
    "circle-color": "#f97316",
    "circle-opacity": 0.8,
    "circle-stroke-width": 1,
    "circle-stroke-color": "rgba(249, 115, 22, 0.4)",
  },
};

export function EarthquakeLayer() {
  const { earthquakes, fetchEarthquakes } = useEarthquakeStore();
  const { showEarthquakes } = useFilterStore();

  useEffect(() => {
    fetchEarthquakes();
    const interval = setInterval(fetchEarthquakes, 60000);
    return () => clearInterval(interval);
  }, [fetchEarthquakes]);

  const geojson = useMemo((): FeatureCollection<Point> => ({
    type: "FeatureCollection",
    features: earthquakes
      .filter((eq) => eq.magnitude >= 5.5)
      .map((eq) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [eq.longitude, eq.latitude],
        },
        properties: {
          id: eq.id,
          magnitude: eq.magnitude,
          place: eq.place,
          time: eq.time,
          depth: eq.depth,
        },
      })),
  }), [earthquakes]);

  if (!showEarthquakes) return null;

  return (
    <Source id="earthquakes" type="geojson" data={geojson}>
      <Layer {...earthquakeLayerStyle} />
    </Source>
  );
}
