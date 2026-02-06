import { create } from "zustand";

interface FilterStore {
  showEvents: boolean;
  showEarthquakes: boolean;
  showAircraft: boolean;
  showVessels: boolean;

  toggleCategory: (category: "showEvents" | "showEarthquakes" | "showAircraft" | "showVessels") => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  showEvents: true,
  showEarthquakes: true,
  showAircraft: true,
  showVessels: true,

  toggleCategory: (category) =>
    set((state) => ({ [category]: !state[category] })),
}));
