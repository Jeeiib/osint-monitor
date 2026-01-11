"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import Map, { NavigationControl, type MapRef } from "react-map-gl/mapbox";
import { useMapStore } from "@/lib/stores";
import { EarthquakeLayer } from "./EarthquakeLayer";
import { AircraftLayer } from "./AircraftLayer";
import { VesselLayer } from "./VesselLayer";
import { ConflictLayer } from "./ConflictLayer";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface BaseMapProps {
  className?: string;
}

export function BaseMap({ className }: BaseMapProps) {
  const { viewState, setViewState } = useMapStore();
  const mapRef = useRef<MapRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const onMove = useCallback(
    (evt: { viewState: { longitude: number; latitude: number; zoom: number } }) => {
      setViewState(evt.viewState);
    },
    [setViewState]
  );

  // Resize map when container size changes
  useEffect(() => {
    if (!containerRef.current || !isMapLoaded) return;

    const observer = new ResizeObserver(() => {
      // Trigger map resize after a short delay to let CSS finish
      requestAnimationFrame(() => {
        mapRef.current?.resize();
      });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isMapLoaded]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-900">
        <p className="text-red-500">Mapbox token manquant</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={onMove}
        onLoad={() => setIsMapLoaded(true)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        projection={{ name: "mercator" }}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="bottom-right" />
        <EarthquakeLayer />
        <AircraftLayer />
        <VesselLayer />
        <ConflictLayer />
      </Map>
    </div>
  );
}
