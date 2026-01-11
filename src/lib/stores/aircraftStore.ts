import { create } from "zustand";
import type { Aircraft } from "@/types/aircraft";

interface AircraftStore {
  aircraft: Aircraft[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  fetchAircraft: (centerLat?: number, centerLon?: number) => Promise<void>;
}

// Track current fetch to cancel on new request
let currentAbortController: AbortController | null = null;
let fetchId = 0;

export const useAircraftStore = create<AircraftStore>((set, get) => ({
  aircraft: [],
  isLoading: false,
  error: null,
  lastUpdate: null,

  fetchAircraft: async (centerLat?: number, centerLon?: number) => {
    // Cancel any in-progress fetch
    if (currentAbortController) {
      currentAbortController.abort();
    }

    // Create new abort controller for this fetch
    const abortController = new AbortController();
    currentAbortController = abortController;
    const thisFetchId = ++fetchId;

    set({ isLoading: true, error: null });

    try {
      let url = "/api/aircraft";
      if (centerLat !== undefined && centerLon !== undefined) {
        url += `?lat=${centerLat}&lon=${centerLon}`;
      }

      const response = await fetch(url, { signal: abortController.signal });

      // Check if this fetch is still the current one
      if (thisFetchId !== fetchId) return;

      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();

      // Double check we're still current before updating state
      if (thisFetchId !== fetchId) return;

      set({ aircraft: data, isLoading: false, lastUpdate: new Date() });
    } catch (error) {
      // Ignore abort errors
      if ((error as Error).name === "AbortError") return;

      if (thisFetchId === fetchId) {
        set({ error: (error as Error).message, isLoading: false });
      }
    }
  },
}));
