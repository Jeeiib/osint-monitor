import { create } from "zustand";
import type { Vessel, AISStreamMessage } from "@/types/vessel";

const AISSTREAM_URL = "wss://stream.aisstream.io/v0/stream";
const API_KEY = process.env.NEXT_PUBLIC_AISSTREAM_API_KEY;
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 10000; // 10 seconds

interface VesselStore {
  vessels: Map<number, Vessel>;
  isConnected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
}

let ws: WebSocket | null = null;
let reconnectAttempts = 0;
let reconnectTimeout: NodeJS.Timeout | null = null;

export const useVesselStore = create<VesselStore>((set, get) => ({
  vessels: new Map(),
  isConnected: false,
  error: null,

  connect: () => {
    // Prevent multiple connections
    if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    if (!API_KEY) {
      console.error("AISStream: API key missing");
      set({ error: "Clé API manquante" });
      return;
    }

    // Clear any pending reconnect
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    console.log("AISStream: Connecting...");

    try {
      ws = new WebSocket(AISSTREAM_URL);
    } catch (e) {
      console.error("AISStream: Failed to create WebSocket:", e);
      set({ error: "Échec de connexion" });
      return;
    }

    ws.onopen = () => {
      console.log("AISStream: Connected, sending subscription...");
      reconnectAttempts = 0; // Reset on successful connection

      // Subscribe to Mediterranean + Atlantic (busy shipping areas)
      const subscriptionMessage = {
        APIKey: API_KEY,
        BoundingBoxes: [
          [[30, -20], [60, 40]], // Europe/Mediterranean/Atlantic
        ],
        FilterMessageTypes: ["PositionReport"],
      };

      console.log("AISStream: Subscription:", JSON.stringify(subscriptionMessage));
      ws?.send(JSON.stringify(subscriptionMessage));
      set({ isConnected: true, error: null });
    };

    ws.onmessage = (event) => {
      try {
        const data: AISStreamMessage = JSON.parse(event.data);

        if (data.MessageType === "PositionReport" && data.Message.PositionReport) {
          const pos = data.Message.PositionReport;
          const meta = data.MetaData;

          const vessel: Vessel = {
            mmsi: meta.MMSI,
            name: meta.ShipName || null,
            shipType: 0,
            latitude: pos.Latitude,
            longitude: pos.Longitude,
            heading: pos.TrueHeading !== 511 ? pos.TrueHeading : null,
            courseOverGround: pos.Cog,
            speedOverGround: pos.Sog,
            destination: null,
            lastUpdate: Date.now(),
          };

          set((state) => {
            const newVessels = new Map(state.vessels);
            newVessels.set(vessel.mmsi, vessel);

            // Keep only vessels updated in last 5 minutes
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            for (const [mmsi, v] of newVessels) {
              if (v.lastUpdate < fiveMinutesAgo) {
                newVessels.delete(mmsi);
              }
            }

            return { vessels: newVessels };
          });
        }
      } catch (e) {
        console.error("AISStream: Failed to parse message:", e);
      }
    };

    ws.onerror = () => {
      console.error("AISStream: WebSocket error");
      set({ error: "Erreur de connexion", isConnected: false });
    };

    ws.onclose = (event) => {
      console.log("AISStream: Connection closed", event.code, event.reason);
      ws = null;
      set({ isConnected: false });

      // Only reconnect if we haven't exceeded max attempts
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`AISStream: Reconnecting in ${RECONNECT_DELAY/1000}s (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

        reconnectTimeout = setTimeout(() => {
          get().connect();
        }, RECONNECT_DELAY);
      } else {
        console.log("AISStream: Max reconnection attempts reached");
        set({ error: "Connexion impossible" });
      }
    };
  },

  disconnect: () => {
    console.log("AISStream: Disconnecting...");

    // Clear reconnect timeout
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    // Reset reconnect attempts
    reconnectAttempts = MAX_RECONNECT_ATTEMPTS; // Prevent auto-reconnect

    if (ws) {
      ws.close();
      ws = null;
    }

    set({ isConnected: false, vessels: new Map() });
  },
}));
