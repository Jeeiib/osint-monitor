"use client";

import { Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEarthquakeStore } from "@/lib/stores";

export function Header() {
  const { earthquakes, isLoading } = useEarthquakeStore();

  const totalQuakes = earthquakes.length;
  const majorQuakes = earthquakes.filter((eq) => eq.magnitude >= 4).length;

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 backdrop-blur">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center">
          <span className="text-xs font-bold">OS</span>
        </div>
        <span className="font-semibold text-slate-200">OSINT Monitor</span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-4">
        <Button
          variant="outline"
          className="w-full justify-start text-slate-400 bg-slate-800/50 border-slate-700 hover:bg-slate-800"
        >
          <Search className="mr-2 h-4 w-4" />
          <span>Rechercher...</span>
          <kbd className="ml-auto text-xs bg-slate-700 px-2 py-0.5 rounded">⌘K</kbd>
        </Button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-red-500 flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          0 incidents
        </span>
        <span className="text-orange-500 flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          {isLoading ? (
            <span className="text-slate-500">...</span>
          ) : (
            <>
              {totalQuakes} séismes
              {majorQuakes > 0 && (
                <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded ml-1">
                  {majorQuakes} M4+
                </span>
              )}
            </>
          )}
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
