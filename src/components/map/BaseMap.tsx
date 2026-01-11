"use client";

import { useCallback } from "react";
import Map, { NavigationControl } from "react-map-gl/mapbox";
import { useMapStore } from "@/lib/stores";
import { EarthquakeLayer } from "./EarthquakeLayer";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface BaseMapProps {
  className?: string;
}

export function BaseMap({ className }: BaseMapProps) {
  const { viewState, setViewState } = useMapStore();

  const onMove = useCallback(
    (evt: { viewState: { longitude: number; latitude: number; zoom: number } }) => {
      setViewState(evt.viewState);
    },
    [setViewState]
  );

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-900">
        <p className="text-red-500">Mapbox token manquant</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Map
        {...viewState}
        onMove={onMove}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="bottom-right" />
        <EarthquakeLayer />
      </Map>
    </div>
  );
}
