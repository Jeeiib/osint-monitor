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

    console.log("AISStream SSE: Connecting...");

    try {
      eventSource = new EventSource(SSE_URL);
    } catch (e) {
      console.error("AISStream SSE: Failed to create EventSource:", e);
      set({ error: "Échec de connexion" });
      return;
    }

    eventSource.onopen = () => {
      console.log("AISStream SSE: Connected");
      reconnectAttempts = 0;
      set({ isConnected: true, error: null });
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "connected") {
          console.log("AISStream SSE: WebSocket backend connected");
          return;
        }

        if (data.type === "error") {
          console.error("AISStream SSE: Backend error:", data.message);
          set({ error: data.message });
          return;
        }

        if (data.type === "closed") {
          console.log("AISStream SSE: Backend WebSocket closed:", data.code);
          return;
        }

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
      } catch (e) {
        console.error("AISStream SSE: Failed to parse message:", e);
      }
    };

    eventSource.onerror = () => {
      console.error("AISStream SSE: Connection error");
      set({ error: "Erreur de connexion", isConnected: false });

      // Close and cleanup
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }

      // Reconnect logic
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`AISStream SSE: Reconnecting in ${RECONNECT_DELAY/1000}s (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

        reconnectTimeout = setTimeout(() => {
          get().connect();
        }, RECONNECT_DELAY);
      } else {
        console.log("AISStream SSE: Max reconnection attempts reached");
        set({ error: "Connexion impossible" });
      }
    };
  },

  disconnect: () => {
    console.log("AISStream SSE: Disconnecting...");

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
