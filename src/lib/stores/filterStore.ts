import { create } from "zustand";

type TimeRange = "live" | "24h" | "7d" | "30d";
type Preset = "conflicts" | "disasters" | "traffic" | "all" | "minimal";

interface FilterStore {
  // Catégories actives
  showEarthquakes: boolean;
  showConflicts: boolean;
  showAircraft: boolean;
  showVessels: boolean;
  showWeather: boolean;

  // Importance (0-100, 0 = tout, 100 = majeur uniquement)
  importanceThreshold: number;

  // Période
  timeRange: TimeRange;

  // Actions
  toggleCategory: (category: "showEarthquakes" | "showConflicts" | "showAircraft" | "showVessels" | "showWeather") => void;
  setImportanceThreshold: (value: number) => void;
  setTimeRange: (range: TimeRange) => void;
  applyPreset: (preset: Preset) => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  showEarthquakes: true,
  showConflicts: true,
  showAircraft: true,
  showVessels: true,
  showWeather: true,
  importanceThreshold: 0,
  timeRange: "live",

  toggleCategory: (category) =>
    set((state) => ({ [category]: !state[category] })),

  setImportanceThreshold: (value) => set({ importanceThreshold: value }),

  setTimeRange: (range) => set({ timeRange: range }),

  applyPreset: (preset) => {
    switch (preset) {
      case "conflicts":
        set({
          showConflicts: true,
          showAircraft: true,
          showEarthquakes: false,
          showVessels: false,
          showWeather: false,
          importanceThreshold: 0,
        });
        break;
      case "disasters":
        set({
          showEarthquakes: true,
          showWeather: true,
          showConflicts: false,
          showAircraft: false,
          showVessels: false,
          importanceThreshold: 0,
        });
        break;
      case "traffic":
        set({
          showAircraft: true,
          showVessels: true,
          showConflicts: false,
          showEarthquakes: false,
          showWeather: false,
          importanceThreshold: 0,
        });
        break;
      case "all":
        set({
          showEarthquakes: true,
          showConflicts: true,
          showAircraft: true,
          showVessels: true,
          showWeather: true,
          importanceThreshold: 50,
        });
        break;
      case "minimal":
        set({
          showEarthquakes: true,
          showConflicts: true,
          showAircraft: true,
          showVessels: true,
          showWeather: true,
          importanceThreshold: 80,
        });
        break;
    }
  },
}));
