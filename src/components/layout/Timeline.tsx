"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export function Timeline() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900/80 backdrop-blur px-4 py-3">
      <div className="flex items-center gap-4">
        {/* Raccourcis temporels */}
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
            Aujourd'hui
          </Button>
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
            24h
          </Button>
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
            7j
          </Button>
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
            30j
          </Button>
        </div>

        {/* Slider */}
        <div className="flex-1 px-4">
          <Slider defaultValue={[100]} max={100} step={1} className="w-full" />
        </div>

        {/* Live button */}
        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-xs h-7">
          <span className="mr-1.5 h-2 w-2 rounded-full bg-white animate-pulse" />
          LIVE
        </Button>
      </div>

      {/* Stats */}
      <div className="mt-2 text-xs text-slate-500">
        📊 Période: 0 événements | 0 séismes | 0 incidents
      </div>
    </footer>
  );
}
