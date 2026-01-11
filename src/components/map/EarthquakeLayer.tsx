"use client";

import { useEffect, useState } from "react";
import { Marker, Popup } from "react-map-gl/mapbox";
import { useEarthquakeStore, useFilterStore } from "@/lib/stores";
import type { Earthquake } from "@/types/earthquake";

// Couleur fixe pour les séismes (orange)
const EARTHQUAKE_COLOR = "#f97316"; // orange-500

// Taille basée sur la magnitude (plus gros = plus intense)
function getMagnitudeSize(magnitude: number): number {
  // M4 = 16px, M5 = 24px, M6 = 32px, M7 = 40px, M8+ = 48px
  return Math.min(48, Math.max(16, (magnitude - 3) * 8));
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `il y a ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

export function EarthquakeLayer() {
  const { earthquakes, fetchEarthquakes, isLoading } = useEarthquakeStore();
  const { showEarthquakes, importanceThreshold } = useFilterStore();
  const [selectedQuake, setSelectedQuake] = useState<Earthquake | null>(null);

  useEffect(() => {
    fetchEarthquakes();
    const interval = setInterval(fetchEarthquakes, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchEarthquakes]);

  if (!showEarthquakes) return null;

  // Filter by importance threshold (scale 0-100 to magnitude 0-4)
  const filteredQuakes = earthquakes.filter(
    (eq) => eq.magnitude >= importanceThreshold / 25
  );

  return (
    <>
      {filteredQuakes.map((earthquake) => {
        const isRecent = Date.now() - earthquake.time < 3600000; // Less than 1 hour
        return (
          <Marker
            key={earthquake.id}
            longitude={earthquake.longitude}
            latitude={earthquake.latitude}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedQuake(earthquake);
            }}
          >
            <div
              className={`rounded-full border-2 border-white/50 cursor-pointer transition-transform hover:scale-125 ${isRecent ? "animate-pulse" : ""}`}
              style={{
                width: getMagnitudeSize(earthquake.magnitude),
                height: getMagnitudeSize(earthquake.magnitude),
                backgroundColor: EARTHQUAKE_COLOR,
                boxShadow: `0 0 ${earthquake.magnitude * 2}px ${EARTHQUAKE_COLOR}`,
              }}
            />
          </Marker>
        );
      })}

      {selectedQuake && (
        <Popup
          longitude={selectedQuake.longitude}
          latitude={selectedQuake.latitude}
          anchor="bottom"
          onClose={() => setSelectedQuake(null)}
          closeButton={true}
          closeOnClick={false}
        >
          <div className="p-3 min-w-52 bg-slate-900 text-slate-100 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: EARTHQUAKE_COLOR }}
              />
              <span className="font-bold text-lg">M{selectedQuake.magnitude.toFixed(1)}</span>
            </div>
            <p className="text-sm text-slate-300 mb-1">{selectedQuake.place}</p>
            <p className="text-xs text-slate-400 mb-2">{formatTimeAgo(selectedQuake.time)}</p>
            <p className="text-xs text-slate-400">Profondeur: {selectedQuake.depth.toFixed(1)} km</p>
            <a
              href={selectedQuake.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:underline mt-2 block"
            >
              Plus d&apos;infos (USGS) →
            </a>
          </div>
        </Popup>
      )}
    </>
  );
}
