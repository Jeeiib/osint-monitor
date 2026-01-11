import { NextResponse } from "next/server";
import WebSocket from "ws";

const AISSTREAM_URL = "wss://stream.aisstream.io/v0/stream";
const API_KEY = process.env.AISSTREAM_API_KEY;

// Military ship type in AIS: 35 = military only
const MILITARY_SHIP_TYPES = new Set([35]);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json({ error: "API key missing" }, { status: 500 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      console.log("SSE: Starting vessel stream...");

      let isClosed = false;
      const ws = new WebSocket(AISSTREAM_URL);

      // Track known military vessels by MMSI (from static data)
      const militaryVessels = new Set<number>();

      const safeEnqueue = (data: string) => {
        if (!isClosed) {
          try {
            controller.enqueue(encoder.encode(data));
          } catch {
            isClosed = true;
          }
        }
      };

      ws.on("open", () => {
        console.log("SSE: WebSocket connected to AISStream");

        const subscriptionMessage = {
          APIKey: API_KEY,
          BoundingBoxes: [
            [[20, -30], [70, 50]], // Extended Europe/Atlantic/Mediterranean
          ],
          // Subscribe to both position and static data to identify military vessels
          FilterMessageTypes: ["PositionReport", "ShipStaticData"],
        };

        ws.send(JSON.stringify(subscriptionMessage));
        safeEnqueue(`data: ${JSON.stringify({ type: "connected" })}\n\n`);
      });

      ws.on("message", (data: Buffer) => {
        if (isClosed) return;

        try {
          const message = JSON.parse(data.toString());

          // Track military vessels from static data
          if (message.MessageType === "ShipStaticData" && message.Message?.ShipStaticData) {
            const staticData = message.Message.ShipStaticData;
            const meta = message.MetaData;
            const shipType = staticData.Type;

            if (MILITARY_SHIP_TYPES.has(shipType)) {
              militaryVessels.add(meta.MMSI);
              console.log(`SSE: Military vessel identified: ${meta.ShipName} (${meta.MMSI})`);
            }
          }

          // Forward position reports only for military vessels
          if (message.MessageType === "PositionReport" && message.Message?.PositionReport) {
            const pos = message.Message.PositionReport;
            const meta = message.MetaData;

            // Only show identified military vessels
            if (!militaryVessels.has(meta.MMSI)) return;

            // Only show moving vessels
            if (pos.Sog < 0.5) return;

            const vessel = {
              mmsi: meta.MMSI,
              name: meta.ShipName || null,
              latitude: pos.Latitude,
              longitude: pos.Longitude,
              heading: pos.TrueHeading !== 511 ? pos.TrueHeading : null,
              cog: pos.Cog,
              sog: pos.Sog,
              isMilitary: true,
            };

            safeEnqueue(`data: ${JSON.stringify({ type: "vessel", vessel })}\n\n`);
          }
        } catch (e) {
          if (!isClosed) {
            console.error("SSE: Failed to parse message:", e);
          }
        }
      });

      ws.on("error", (error) => {
        console.error("SSE: WebSocket error:", error.message);
        safeEnqueue(`data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`);
      });

      ws.on("close", (code, reason) => {
        console.log("SSE: WebSocket closed:", code, reason.toString());
        if (!isClosed) {
          safeEnqueue(`data: ${JSON.stringify({ type: "closed", code })}\n\n`);
          isClosed = true;
          try {
            controller.close();
          } catch {
            // Already closed
          }
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
