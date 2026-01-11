import { create } from "zustand";
import type { Vessel, AISStreamMessage } from "@/types/vessel";

const AISSTREAM_URL = "wss://stream.aisstream.io/v0/stream";
const API_KEY = process.env.NEXT_PUBLIC_AISSTREAM_API_KEY;

interface VesselStore {
  vessels: Map<number, Vessel>;
  isConnected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
}

let ws: WebSocket | null = null;

export const useVesselStore = create<VesselStore>((set, get) => ({
  vessels: new Map(),
  isConnected: false,
  error: null,

  connect: () => {
    if (ws?.readyState === WebSocket.OPEN) return;
    if (!API_KEY) {
      set({ error: "API key missing" });
      return;
    }

    ws = new WebSocket(AISSTREAM_URL);

    ws.onopen = () => {
      // Subscribe to global data (bounding box covering the world)
      const subscriptionMessage = {
        APIKey: API_KEY,
        BoundingBoxes: [[[-90, -180], [90, 180]]], // Whole world
        FilterMessageTypes: ["PositionReport"],
      };
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

            // Keep only vessels updated in last 5 minutes (avoid memory bloat)
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
        console.error("Failed to parse AIS message:", e);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      set({ error: "WebSocket connection error", isConnected: false });
    };

    ws.onclose = () => {
      set({ isConnected: false });
      // Reconnect after 5 seconds
      setTimeout(() => {
        if (get().isConnected === false) {
          get().connect();
        }
      }, 5000);
    };
  },

  disconnect: () => {
    if (ws) {
      ws.close();
      ws = null;
    }
    set({ isConnected: false, vessels: new Map() });
  },
}));
