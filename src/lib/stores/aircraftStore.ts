import { create } from "zustand";
import type { Aircraft } from "@/types/aircraft";

interface AircraftStore {
  aircraft: Aircraft[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  fetchAircraft: () => Promise<void>;
}

export const useAircraftStore = create<AircraftStore>((set) => ({
  aircraft: [],
  isLoading: false,
  error: null,
  lastUpdate: null,

  fetchAircraft: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/aircraft");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      set({ aircraft: data, isLoading: false, lastUpdate: new Date() });
    } catch {
      // Silent fail — will retry on next interval
      set({ isLoading: false });
    }
  },
}));
