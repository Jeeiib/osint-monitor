import { create } from "zustand";
import type { Vessel, AISStreamMessage } from "@/types/vessel";

const AISSTREAM_URL = "wss://stream.aisstream.io/v0/stream";
const API_KEY = process.env.NEXT_PUBLIC_AISSTREAM_API_KEY;

interface VesselStore {
  vessels: Map<number, Vessel>;
  isConnected: boolean;
  error: string | null;
  connect: (centerLat?: number, centerLon?: number) => void;
  disconnect: () => void;
}

let ws: WebSocket | null = null;

export const useVesselStore = create<VesselStore>((set, get) => ({
  vessels: new Map(),
  isConnected: false,
  error: null,

  connect: (centerLat = 48.8566, centerLon = 2.3522) => {
    if (ws?.readyState === WebSocket.OPEN) return;
    if (!API_KEY) {
      console.error("AISStream: API key missing");
      set({ error: "API key missing" });
      return;
    }

    console.log("AISStream: Connecting...");
    ws = new WebSocket(AISSTREAM_URL);

    ws.onopen = () => {
      console.log("AISStream: Connected, sending subscription...");

      // Subscribe to a 500nm radius around center (roughly 10 degrees)
      const latOffset = 5;
      const lonOffset = 5;

      const subscriptionMessage = {
        APIKey: API_KEY,
        BoundingBoxes: [
          [
            [centerLat - latOffset, centerLon - lonOffset],
            [centerLat + latOffset, centerLon + lonOffset]
          ]
        ],
        FilterMessageTypes: ["PositionReport"],
      };

      console.log("AISStream: Subscription message:", JSON.stringify(subscriptionMessage));
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

    ws.onerror = (error) => {
      console.error("AISStream: WebSocket error:", error);
      set({ error: "WebSocket connection error", isConnected: false });
    };

    ws.onclose = (event) => {
      console.log("AISStream: Connection closed", event.code, event.reason);
      set({ isConnected: false });

      // Reconnect after 5 seconds if not manually disconnected
      setTimeout(() => {
        if (get().isConnected === false && ws === null) {
          console.log("AISStream: Reconnecting...");
          get().connect(centerLat, centerLon);
        }
      }, 5000);
    };
  },

  disconnect: () => {
    console.log("AISStream: Disconnecting...");
    if (ws) {
      ws.close();
      ws = null;
    }
    set({ isConnected: false, vessels: new Map() });
  },
}));
