import { create } from "zustand";
import type { Aircraft } from "@/types/aircraft";

interface AircraftStore {
  aircraft: Aircraft[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  fetchAircraft: (centerLat?: number, centerLon?: number) => Promise<void>;
}

export const useAircraftStore = create<AircraftStore>((set) => ({
  aircraft: [],
  isLoading: false,
  error: null,
  lastUpdate: null,

  fetchAircraft: async (centerLat?: number, centerLon?: number) => {
    set({ isLoading: true, error: null });
    try {
      let url = "/api/aircraft";
      if (centerLat !== undefined && centerLon !== undefined) {
        url += `?lat=${centerLat}&lon=${centerLon}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      set({ aircraft: data, isLoading: false, lastUpdate: new Date() });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));
