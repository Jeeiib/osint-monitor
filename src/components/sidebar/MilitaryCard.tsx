"use client";

import { Plane, Ship } from "lucide-react";
import { useMapStore } from "@/lib/stores";
import type { Aircraft } from "@/types/aircraft";
import type { Vessel } from "@/types/vessel";

interface AircraftCardProps {
  type: "aircraft";
  data: Aircraft;
}

interface VesselCardProps {
  type: "vessel";
  data: Vessel;
}

type MilitaryCardProps = AircraftCardProps | VesselCardProps;

function formatAltitude(meters: number | null): string {
  if (!meters) return "N/A";
  const feet = Math.round(meters / 0.3048);
  return `FL${Math.round(feet / 100)}`;
}

function formatSpeed(ms: number | null, unit: "ms" | "kts" = "ms"): string {
  if (!ms) return "N/A";
  if (unit === "kts") return `${ms.toFixed(1)} kts`;
  const kts = ms / 0.514444;
  return `${Math.round(kts)} kts`;
}

export function MilitaryCard(props: MilitaryCardProps) {
  const { flyTo } = useMapStore();

  if (props.type === "aircraft") {
    const ac = props.data;
    if (!ac.latitude || !ac.longitude) return null;

    return (
      <div
        onClick={() => flyTo(ac.longitude!, ac.latitude!, 7)}
        className="group flex cursor-pointer items-start gap-3 rounded-lg border border-white/5 bg-slate-900/40 p-3 transition-all hover:border-blue-500/30 hover:bg-blue-500/5"
      >
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-500/10">
          <Plane className="h-4 w-4 text-blue-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-200">
              {ac.callsign || ac.icao24.toUpperCase()}
            </span>
            {ac.isMilitary && (
              <span className="rounded bg-blue-600/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                MIL
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
            {ac.originCountry && <span>{ac.originCountry}</span>}
            {ac.aircraftType && (
              <>
                {ac.originCountry && <span>·</span>}
                <span>{ac.aircraftType}</span>
              </>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
            <span>{formatAltitude(ac.altitude)}</span>
            <span>{formatSpeed(ac.velocity)}</span>
            {ac.heading !== null && <span>{Math.round(ac.heading)}°</span>}
          </div>
        </div>
      </div>
    );
  }

  // Vessel
  const v = props.data;
  return (
    <div
      onClick={() => flyTo(v.longitude, v.latitude, 8)}
      className="group flex cursor-pointer items-start gap-3 rounded-lg border border-white/5 bg-slate-900/40 p-3 transition-all hover:border-cyan-500/30 hover:bg-cyan-500/5"
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cyan-500/10">
        <Ship className="h-4 w-4 text-cyan-400" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-slate-200">
          {v.name || `MMSI ${v.mmsi}`}
        </span>
        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
          <span>{formatSpeed(v.speedOverGround, "kts")}</span>
          {v.heading !== null && <span>{Math.round(v.heading)}°</span>}
          <span>MMSI {v.mmsi}</span>
        </div>
      </div>
    </div>
  );
}
