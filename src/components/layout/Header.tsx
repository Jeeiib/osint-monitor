"use client";

import { Settings } from "lucide-react";
import { useEventsStore, useEarthquakeStore, useAircraftStore } from "@/lib/stores";

export function Header() {
  const { events, isLoading: eventsLoading } = useEventsStore();
  const { earthquakes, isLoading: quakesLoading } = useEarthquakeStore();
  const { aircraft } = useAircraftStore();

  const significantQuakes = earthquakes.filter((eq) => eq.magnitude >= 5.5);

  return (
    <header className="relative z-20 flex h-10 items-center justify-between border-b border-white/5 bg-slate-900/60 px-4 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-red-600">
          <span className="text-[10px] font-bold">OS</span>
        </div>
        <span className="text-sm font-semibold text-slate-300">OSINT Monitor</span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          {eventsLoading ? "..." : `${events.length} events`}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          {quakesLoading ? "..." : `${significantQuakes.length} quakes`}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          {`${aircraft.length} aircraft`}
        </span>
        <button className="flex h-6 w-6 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300">
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}
