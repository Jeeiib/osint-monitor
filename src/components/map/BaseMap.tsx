"use client";

import { useState } from "react";
import Map, { NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface BaseMapProps {
  className?: string;
}

export function BaseMap({ className }: BaseMapProps) {
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 30,
    zoom: 2,
  });

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-900">
        <p className="text-red-500">Mapbox token manquant</p>
      </div>
    );
  }

  return (
    <Map
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      className={className}
      style={{ width: "100%", height: "100%" }}
    >
      <NavigationControl position="bottom-right" />
    </Map>
  );
}
