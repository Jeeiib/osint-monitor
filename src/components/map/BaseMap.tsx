"use client";

import { useCallback, useRef, useEffect, useState, useMemo } from "react";
import Map, { Source, Layer, NavigationControl, Popup, type MapRef, type MapMouseEvent } from "react-map-gl/mapbox";
import type { LayerProps } from "react-map-gl/mapbox";
import type { FeatureCollection, Point } from "geojson";
import { useTranslations } from "next-intl";
import { useMapStore, useFilterStore, useEventsStore, useSidebarStore } from "@/lib/stores";
import { EarthquakeLayer } from "./EarthquakeLayer";
import { AircraftLayer } from "./AircraftLayer";
import { VesselLayer } from "./VesselLayer";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Events cluster layers
const eventsClusterLayer: LayerProps = {
  id: "events-clusters",
  type: "circle",
  source: "events",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": "#ef4444",
    "circle-radius": [
      "step",
      ["get", "point_count"],
      12, 5,
      16, 10,
      22,
    ],
    "circle-opacity": 0.8,
    "circle-stroke-width": 2,
    "circle-stroke-color": "rgba(239, 68, 68, 0.3)",
  },
};

const eventsClusterCountLayer: LayerProps = {
  id: "events-cluster-count",
  type: "symbol",
  source: "events",
  filter: ["has", "point_count"],
  layout: {
    "text-field": ["get", "point_count_abbreviated"],
    "text-size": 11,
    "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
  },
  paint: {
    "text-color": "#ffffff",
  },
};

const eventsUnclusteredLayer: LayerProps = {
  id: "events-unclustered",
  type: "circle",
  source: "events",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-radius": 5,
    "circle-color": "#ef4444",
    "circle-opacity": 0.85,
    "circle-stroke-width": 1,
    "circle-stroke-color": "rgba(239, 68, 68, 0.4)",
  },
};

interface BaseMapProps {
  className?: string;
}

interface HoverInfo {
  longitude: number;
  latitude: number;
  title: string;
  subtitle: string;
}

export function BaseMap({ className }: BaseMapProps) {
  const t = useTranslations("map");
  const { viewState, setViewState, setMapRef } = useMapStore();
  const { showEvents } = useFilterStore();
  const { events, selectEvent } = useEventsStore();
  const { setTab } = useSidebarStore();
  const mapRef = useRef<MapRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  const onMove = useCallback(
    (evt: { viewState: { longitude: number; latitude: number; zoom: number } }) => {
      setViewState(evt.viewState);
    },
    [setViewState]
  );

  const onLoad = useCallback(() => {
    setIsMapLoaded(true);
    if (mapRef.current) {
      setMapRef(mapRef.current);
    }
  }, [setMapRef]);

  // Resize map when loaded
  useEffect(() => {
    if (!containerRef.current || !isMapLoaded) return;

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        mapRef.current?.resize();
      });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isMapLoaded]);

  // Events GeoJSON data
  const eventsGeojson = useMemo((): FeatureCollection<Point> => ({
    type: "FeatureCollection",
    features: events.map((ev, i) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [ev.longitude, ev.latitude],
      },
      properties: {
        index: i,
        title: ev.title,
        location: ev.locationName,
        sourceDomain: ev.sourceDomain,
      },
    })),
  }), [events]);

  // Click handler for events + earthquakes native layers
  const onClick = useCallback((e: MapMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature) return;

    const layerId = feature.layer?.id;

    if (layerId === "events-clusters") {
      const map = mapRef.current?.getMap();
      if (!map) return;
      const source = map.getSource("events") as mapboxgl.GeoJSONSource | undefined;
      if (!source) return;
      const clusterId = feature.properties?.cluster_id;
      const coords = (feature.geometry as GeoJSON.Point).coordinates;
      source.getClusterExpansionZoom(clusterId, (error, zoom) => {
        if (error || !zoom) return;
        map.flyTo({ center: [coords[0], coords[1]], zoom, duration: 500 });
      });
    } else if (layerId === "events-unclustered") {
      const index = feature.properties?.index;
      if (index !== undefined) {
        selectEvent(index);
        setTab("articles");
        const card = document.getElementById(`event-card-${index}`);
        card?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectEvent, setTab]);

  // Hover handler for native layers only (events + earthquakes)
  const onMouseMove = useCallback((e: MapMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature) {
      setHoverInfo(null);
      return;
    }

    const coords = (feature.geometry as GeoJSON.Point).coordinates;
    const layerId = feature.layer?.id;

    if (layerId === "events-unclustered") {
      setHoverInfo({
        longitude: coords[0],
        latitude: coords[1],
        title: feature.properties?.title || "",
        subtitle: feature.properties?.location || "",
      });
    } else if (layerId === "earthquakes-native") {
      setHoverInfo({
        longitude: coords[0],
        latitude: coords[1],
        title: `M${feature.properties?.magnitude}`,
        subtitle: feature.properties?.place || "",
      });
    } else {
      setHoverInfo(null);
    }
  }, []);

  const onMouseLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

  // Only events + earthquakes are native interactive layers
  const interactiveLayerIds = useMemo(() => {
    const ids: string[] = [];
    if (showEvents) ids.push("events-clusters", "events-unclustered");
    ids.push("earthquakes-native");
    return ids;
  }, [showEvents]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-900">
        <p className="text-red-500">{t("missingToken")}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={onMove}
        onLoad={onLoad}
        onClick={onClick}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        projection={{ name: "mercator" }}
        style={{ width: "100%", height: "100%" }}
        interactiveLayerIds={interactiveLayerIds}
        cursor={hoverInfo ? "pointer" : "grab"}
      >
        <NavigationControl position="bottom-right" />

        {/* Events layer with clustering (native) */}
        {showEvents && (
          <Source
            id="events"
            type="geojson"
            data={eventsGeojson}
            cluster={true}
            clusterMaxZoom={14}
            clusterRadius={50}
          >
            <Layer {...eventsClusterLayer} />
            <Layer {...eventsClusterCountLayer} />
            <Layer {...eventsUnclusteredLayer} />
          </Source>
        )}

        {/* Earthquake native layer (for hover tooltips) */}
        <EarthquakeLayer />

        {/* Aircraft & Vessels use React Markers (SVG icons + popups) */}
        <AircraftLayer />
        <VesselLayer />

        {/* Hover tooltip for native layers */}
        {hoverInfo && (
          <Popup
            longitude={hoverInfo.longitude}
            latitude={hoverInfo.latitude}
            anchor="bottom"
            closeButton={false}
            closeOnClick={false}
            offset={8}
          >
            <p className="font-medium text-slate-200 text-xs leading-tight line-clamp-2">{hoverInfo.title}</p>
            {hoverInfo.subtitle && (
              <p className="text-slate-400 text-[10px] mt-0.5">{hoverInfo.subtitle}</p>
            )}
          </Popup>
        )}
      </Map>
    </div>
  );
}
