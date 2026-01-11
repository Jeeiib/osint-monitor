"use client";

import { useEffect, useState, useCallback } from "react";
import { Marker, Popup } from "react-map-gl/mapbox";
import { useAircraftStore, useFilterStore, useMapStore } from "@/lib/stores";
import type { Aircraft } from "@/types/aircraft";

const AIRCRAFT_COLOR = "#3b82f6"; // blue-500

function getAircraftSize(altitude: number | null): number {
  if (!altitude) return 12;
  if (altitude > 10000) return 16;
  if (altitude > 5000) return 14;
  return 12;
}

function formatAltitude(meters: number | null): string {
  if (!meters) return "N/A";
  return `${Math.round(meters).toLocaleString()} m`;
}

function formatSpeed(ms: number | null): string {
  if (!ms) return "N/A";
  return `${Math.round(ms)} m/s`;
}

export function AircraftLayer() {
  const { aircraft, fetchAircraft } = useAircraftStore();
  const { showAircraft } = useFilterStore();
  const { viewState } = useMapStore();
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [aircraftPhoto, setAircraftPhoto] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  const fetchWithCenter = useCallback(() => {
    fetchAircraft(viewState.latitude, viewState.longitude);
  }, [fetchAircraft, viewState.latitude, viewState.longitude]);

  useEffect(() => {
    fetchWithCenter();
    // Refresh every 10s (allows 2 API calls per refresh cycle with rate limit)
    const interval = setInterval(fetchWithCenter, 10000);
    return () => clearInterval(interval);
  }, [fetchWithCenter]);

  // Fetch photo when aircraft is selected
  useEffect(() => {
    if (!selectedAircraft) {
      setAircraftPhoto(null);
      return;
    }

    const fetchPhoto = async () => {
      setPhotoLoading(true);
      try {
        const response = await fetch(
          `https://api.planespotters.net/pub/photos/hex/${selectedAircraft.icao24}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.photos && data.photos.length > 0) {
            setAircraftPhoto(data.photos[0].thumbnail_large?.src || data.photos[0].thumbnail?.src);
          } else {
            setAircraftPhoto(null);
          }
        }
      } catch {
        setAircraftPhoto(null);
      } finally {
        setPhotoLoading(false);
      }
    };

    fetchPhoto();
  }, [selectedAircraft]);

  if (!showAircraft) return null;

  return (
    <>
      {aircraft.map((plane) => (
        <Marker
          key={plane.icao24}
          longitude={plane.longitude!}
          latitude={plane.latitude!}
          anchor="center"
          rotation={plane.heading || 0}
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelectedAircraft(plane);
          }}
        >
          <div
            className="cursor-pointer transition-transform hover:scale-125"
            style={{
              width: getAircraftSize(plane.altitude),
              height: getAircraftSize(plane.altitude),
              color: AIRCRAFT_COLOR,
              filter: `drop-shadow(0 0 3px ${AIRCRAFT_COLOR})`,
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
          </div>
        </Marker>
      ))}

      {selectedAircraft && (
        <Popup
          longitude={selectedAircraft.longitude!}
          latitude={selectedAircraft.latitude!}
          anchor="bottom"
          onClose={() => setSelectedAircraft(null)}
          closeButton={true}
          closeOnClick={false}
          maxWidth="320px"
        >
          <div className="min-w-64 rounded-lg bg-slate-900 p-3 text-slate-100">
            {/* Photo */}
            {photoLoading ? (
              <div className="mb-3 h-32 w-full animate-pulse rounded bg-slate-700" />
            ) : aircraftPhoto ? (
              <img
                src={aircraftPhoto}
                alt={selectedAircraft.aircraftType || "Aircraft"}
                className="mb-3 h-32 w-full rounded object-cover"
              />
            ) : null}

            {/* Header */}
            <div className="mb-2 flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: AIRCRAFT_COLOR }}
              />
              <span className="text-lg font-bold">
                {selectedAircraft.callsign || selectedAircraft.icao24}
              </span>
              {selectedAircraft.isMilitary && (
                <span className="rounded bg-blue-600 px-1.5 py-0.5 text-xs font-medium">
                  MIL
                </span>
              )}
            </div>

            {/* Country & Type */}
            <div className="mb-2 text-sm text-slate-300">
              {selectedAircraft.originCountry && (
                <p>{selectedAircraft.originCountry}</p>
              )}
              {selectedAircraft.aircraftType && (
                <p>
                  {selectedAircraft.aircraftType}
                  {selectedAircraft.registration && ` (${selectedAircraft.registration})`}
                </p>
              )}
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
              <div>Altitude: {formatAltitude(selectedAircraft.altitude)}</div>
              <div>Vitesse: {formatSpeed(selectedAircraft.velocity)}</div>
              <div>
                Cap:{" "}
                {selectedAircraft.heading
                  ? `${Math.round(selectedAircraft.heading)}°`
                  : "N/A"}
              </div>
              <div>ICAO: {selectedAircraft.icao24.toUpperCase()}</div>
              {selectedAircraft.squawk && (
                <div>Squawk: {selectedAircraft.squawk}</div>
              )}
            </div>
          </div>
        </Popup>
      )}
    </>
  );
}
