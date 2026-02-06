import { create } from "zustand";
import type { Earthquake } from "@/types/earthquake";

interface EarthquakeStore {
  earthquakes: Earthquake[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  fetchEarthquakes: () => Promise<void>;
}

export const useEarthquakeStore = create<EarthquakeStore>((set) => ({
  earthquakes: [],
  isLoading: false,
  error: null,
  lastUpdate: null,

  fetchEarthquakes: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/earthquakes");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      set({ earthquakes: data, isLoading: false, lastUpdate: new Date() });
    } catch {
      set({ isLoading: false });
    }
  },
}));
