import { create } from "zustand";
import type { Vessel } from "@/types/vessel";

const SSE_URL = "/api/vessels/stream";
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 10000; // 10 seconds

interface VesselStore {
  vessels: Map<number, Vessel>;
  isConnected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
}

let eventSource: EventSource | null = null;
let reconnectAttempts = 0;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

export const useVesselStore = create<VesselStore>((set, get) => ({
  vessels: new Map(),
  isConnected: false,
  error: null,

  connect: () => {
    // Prevent multiple connections
    if (eventSource?.readyState === EventSource.OPEN || eventSource?.readyState === EventSource.CONNECTING) {
      return;
    }

    // Clear any pending reconnect
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    try {
      eventSource = new EventSource(SSE_URL);
    } catch (e) {
      console.error("AISStream SSE: Failed to create EventSource:", e);
      set({ error: "Échec de connexion" });
      return;
    }

    eventSource.onopen = () => {
      reconnectAttempts = 0;
      set({ isConnected: true, error: null });
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "connected") return;

        if (data.type === "error") {
          set({ error: data.message });
          return;
        }

        if (data.type === "closed") return;

        if (data.type === "vessel" && data.vessel) {
          const v = data.vessel;

          const vessel: Vessel = {
            mmsi: v.mmsi,
            name: v.name || null,
            shipType: 0,
            latitude: v.latitude,
            longitude: v.longitude,
            heading: v.heading,
            courseOverGround: v.cog,
            speedOverGround: v.sog,
            destination: null,
            lastUpdate: Date.now(),
          };

          set((state) => {
            const newVessels = new Map(state.vessels);
            newVessels.set(vessel.mmsi, vessel);

            // Keep only vessels updated in last 2 minutes
            const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
            for (const [mmsi, vv] of newVessels) {
              if (vv.lastUpdate < twoMinutesAgo) {
                newVessels.delete(mmsi);
              }
            }

            return { vessels: newVessels };
          });
        }
      } catch {
        // Ignore malformed messages
      }
    };

    eventSource.onerror = () => {
      set({ isConnected: false });

      // Close and cleanup
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }

      // Silently reconnect up to MAX_RECONNECT_ATTEMPTS
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        reconnectTimeout = setTimeout(() => {
          get().connect();
        }, RECONNECT_DELAY);
      } else {
        set({ error: "AIS indisponible" });
      }
    };
  },

  disconnect: () => {

    // Clear reconnect timeout
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    // Reset reconnect attempts
    reconnectAttempts = MAX_RECONNECT_ATTEMPTS; // Prevent auto-reconnect

    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }

    set({ isConnected: false, vessels: new Map() });
  },
}));
