"use client";

import { useFilterStore } from "@/lib/stores";
import { cn } from "@/lib/utils";
import { Crosshair, Plane, Ship, Activity } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Category {
  key: "showEvents" | "showAircraft" | "showVessels" | "showEarthquakes";
  label: string;
  color: string;
  activeClasses: string;
  Icon: LucideIcon;
}

const categories: Category[] = [
  {
    key: "showEvents",
    label: "Geopolitics",
    color: "red",
    activeClasses: "border-red-500/40 bg-red-500/10 text-red-400",
    Icon: Crosshair,
  },
  {
    key: "showAircraft",
    label: "Military Air",
    color: "blue",
    activeClasses: "border-blue-500/40 bg-blue-500/10 text-blue-400",
    Icon: Plane,
  },
  {
    key: "showVessels",
    label: "Naval",
    color: "cyan",
    activeClasses: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
    Icon: Ship,
  },
  {
    key: "showEarthquakes",
    label: "Seismic",
    color: "orange",
    activeClasses: "border-orange-500/40 bg-orange-500/10 text-orange-400",
    Icon: Activity,
  },
];

export function FilterBar() {
  const store = useFilterStore();

  return (
    <div className="absolute left-4 top-4 z-10 flex gap-2">
      {categories.map((cat) => {
        const isActive = store[cat.key];
        const Icon = cat.Icon;
        return (
          <button
            key={cat.key}
            onClick={() => store.toggleCategory(cat.key)}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs font-medium backdrop-blur-md transition-all",
              isActive
                ? cat.activeClasses
                : "border-white/5 bg-slate-900/70 text-slate-500 hover:border-white/10 hover:text-slate-400"
            )}
          >
            <Icon className="h-3 w-3" />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
