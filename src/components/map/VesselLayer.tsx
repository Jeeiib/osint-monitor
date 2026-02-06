"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Marker, Popup } from "react-map-gl/mapbox";
import { useVesselStore, useFilterStore, useMapStore } from "@/lib/stores";
import type { Vessel } from "@/types/vessel";

const VESSEL_COLOR = "#06b6d4";

function formatSpeed(knots: number | null): string {
  if (!knots) return "0 kts";
  return `${knots.toFixed(1)} kts`;
}

export function VesselLayer() {
  const { vessels, connect, disconnect, isConnected, error } = useVesselStore();
  const { showVessels } = useFilterStore();
  const { viewState } = useMapStore();
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const hasConnected = useRef(false);

  useEffect(() => {
    if (showVessels && !hasConnected.current) {
      hasConnected.current = true;
      connect();
    } else if (!showVessels && hasConnected.current) {
      hasConnected.current = false;
      disconnect();
    }

    return () => {
      if (hasConnected.current) {
        disconnect();
        hasConnected.current = false;
      }
    };
  }, [showVessels, connect, disconnect]);

  const vesselArray = useMemo(() => Array.from(vessels.values()), [vessels]);

  if (!showVessels) return null;

  return (
    <>
      {vesselArray.map((vessel) => (
        <Marker
          key={vessel.mmsi}
          longitude={vessel.longitude}
          latitude={vessel.latitude}
          anchor="center"
          rotation={vessel.heading || vessel.courseOverGround || 0}
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelectedVessel(vessel);
          }}
        >
          <div
            className="cursor-pointer transition-transform hover:scale-125"
            style={{
              width: 14,
              height: 14,
              color: VESSEL_COLOR,
              filter: `drop-shadow(0 0 3px ${VESSEL_COLOR})`,
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z"/>
            </svg>
          </div>
        </Marker>
      ))}

      {selectedVessel && (
        <Popup
          longitude={selectedVessel.longitude}
          latitude={selectedVessel.latitude}
          anchor={selectedVessel.latitude > viewState.latitude ? "top" : "bottom"}
          onClose={() => setSelectedVessel(null)}
          closeButton={true}
          closeOnClick={true}
          className="vessel-popup"
        >
          <div className="p-3 min-w-52 bg-slate-900 text-slate-100 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: VESSEL_COLOR }}
              />
              <span className="font-bold text-lg">
                {selectedVessel.name || `MMSI: ${selectedVessel.mmsi}`}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
              <div>Speed: {formatSpeed(selectedVessel.speedOverGround)}</div>
              <div>Hdg: {selectedVessel.heading ? `${Math.round(selectedVessel.heading)}°` : "N/A"}</div>
              <div>MMSI: {selectedVessel.mmsi}</div>
              <div>COG: {selectedVessel.courseOverGround ? `${Math.round(selectedVessel.courseOverGround)}°` : "N/A"}</div>
            </div>
            {selectedVessel.destination && (
              <p className="text-xs text-slate-400 mt-2">
                Dest: {selectedVessel.destination}
              </p>
            )}
          </div>
        </Popup>
      )}

      {/* Connection status - hide when connected with 0 vessels */}
      {showVessels && (error || !isConnected || vesselArray.length > 0) && (
        <div className="absolute bottom-20 left-4 z-10 text-xs">
          <span className={`flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900/80 backdrop-blur ${
            error ? "text-red-400" : isConnected ? "text-cyan-400" : "text-slate-500"
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              error ? "bg-red-400" : isConnected ? "bg-cyan-400 animate-pulse" : "bg-slate-500"
            }`} />
            {error ? "AIS Error" : isConnected ? `${vesselArray.length} vessels` : "Connecting..."}
          </span>
        </div>
      )}
    </>
  );
}
