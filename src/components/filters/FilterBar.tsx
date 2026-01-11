"use client";

import { useFilterStore } from "@/lib/stores";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Activity, Crosshair, Plane, Ship, Cloud } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Category {
  key: "showEarthquakes" | "showConflicts" | "showAircraft" | "showVessels" | "showWeather";
  label: string;
  color: string;
  Icon: LucideIcon;
}

const categories: Category[] = [
  { key: "showEarthquakes", label: "Séismes", color: "orange", Icon: Activity },
  { key: "showConflicts", label: "Conflits", color: "red", Icon: Crosshair },
  { key: "showAircraft", label: "Avions", color: "blue", Icon: Plane },
  { key: "showVessels", label: "Bateaux", color: "cyan", Icon: Ship },
  { key: "showWeather", label: "Météo", color: "purple", Icon: Cloud },
];

const colorClasses: Record<string, string> = {
  orange: "ring-orange-500 data-[active=true]:bg-orange-500/20",
  red: "ring-red-500 data-[active=true]:bg-red-500/20",
  blue: "ring-blue-500 data-[active=true]:bg-blue-500/20",
  cyan: "ring-cyan-500 data-[active=true]:bg-cyan-500/20",
  purple: "ring-purple-500 data-[active=true]:bg-purple-500/20",
};

const iconColorClasses: Record<string, string> = {
  orange: "text-orange-500",
  red: "text-red-500",
  blue: "text-blue-500",
  cyan: "text-cyan-500",
  purple: "text-purple-500",
};

export function FilterBar() {
  const store = useFilterStore();

  return (
    <div className="absolute left-4 top-4 z-10 flex gap-2">
      {categories.map((cat) => {
        const isActive = store[cat.key];
        const Icon = cat.Icon;
        return (
          <Button
            key={cat.key}
            variant="outline"
            size="sm"
            data-active={isActive}
            onClick={() => store.toggleCategory(cat.key)}
            className={cn(
              "bg-slate-900/80 backdrop-blur border-slate-700 hover:bg-slate-800 transition-all h-8",
              isActive && `ring-2 ring-offset-2 ring-offset-slate-950 ${colorClasses[cat.color]}`
            )}
          >
            <Icon className={cn("h-4 w-4 mr-1.5", isActive ? iconColorClasses[cat.color] : "text-slate-500")} />
            <span className={cn("text-xs", !isActive && "text-slate-500")}>{cat.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
