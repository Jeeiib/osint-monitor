"use client";

import { useFilterStore } from "@/lib/stores";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const categories = [
  { key: "showEarthquakes", label: "Séismes", color: "orange", icon: "🟠" },
  { key: "showConflicts", label: "Conflits", color: "red", icon: "🔴" },
  { key: "showAircraft", label: "Avions", color: "blue", icon: "✈️" },
  { key: "showVessels", label: "Bateaux", color: "cyan", icon: "🚢" },
  { key: "showWeather", label: "Météo", color: "green", icon: "🌀" },
] as const;

const colorClasses: Record<string, string> = {
  orange: "ring-orange-500 data-[active=true]:bg-orange-500/20",
  red: "ring-red-500 data-[active=true]:bg-red-500/20",
  blue: "ring-blue-500 data-[active=true]:bg-blue-500/20",
  cyan: "ring-cyan-500 data-[active=true]:bg-cyan-500/20",
  green: "ring-green-500 data-[active=true]:bg-green-500/20",
};

export function FilterBar() {
  const store = useFilterStore();

  return (
    <div className="absolute left-4 top-4 z-10 flex gap-2">
      {categories.map((cat) => {
        const isActive = store[cat.key] as boolean;
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
            <span className="mr-1.5">{cat.icon}</span>
            <span className={cn("text-xs", !isActive && "text-slate-500")}>{cat.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
