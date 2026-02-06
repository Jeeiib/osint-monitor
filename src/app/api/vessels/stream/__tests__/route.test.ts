import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use a class mock — arrow functions can't be used as constructors with `new`
const mocks = vi.hoisted(() => {
  const onHandlers: Record<string, Function> = {};
  const instance = {
    on: vi.fn((event: string, handler: Function) => {
      onHandlers[event] = handler;
    }),
    send: vi.fn(),
    close: vi.fn(),
    readyState: 1,
  };

  let constructorCalls: string[] = [];

  // Use a regular function (not arrow) as it needs to be callable with `new`
  const WsClass = function (this: any, url: string) {
    constructorCalls.push(url);
    Object.assign(this, instance);
    // Re-bind `on` per instance to track handlers
    this.on = vi.fn((event: string, handler: Function) => {
      onHandlers[event] = handler;
    });
    this.send = instance.send;
    this.close = instance.close;
    this.readyState = instance.readyState;
  } as any;

  return { WsClass, instance, onHandlers, constructorCalls };
});

vi.mock("ws", () => ({
  default: mocks.WsClass,
}));

describe("GET /api/vessels/stream", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.instance.on.mockClear();
    mocks.instance.send.mockClear();
    mocks.instance.close.mockClear();
    mocks.constructorCalls.length = 0;
    Object.keys(mocks.onHandlers).forEach((k) => delete mocks.onHandlers[k]);
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetAllMocks();
  });

  it("should return 500 when API key is missing", async () => {
    delete process.env.AISSTREAM_API_KEY;
    vi.resetModules();
    const { GET } = await import("../route");

    const response = await GET();
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "API key missing" });
  });

  it("should return Response with text/event-stream content-type", async () => {
    process.env.AISSTREAM_API_KEY = "test-key";
    vi.resetModules();
    const { GET } = await import("../route");

    const response = await GET();
    expect(response).toBeInstanceOf(Response);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(response.headers.get("Cache-Control")).toBe("no-cache");
    expect(response.headers.get("Connection")).toBe("keep-alive");
  });

  it("should create WebSocket with correct URL", async () => {
    process.env.AISSTREAM_API_KEY = "test-key";
    vi.resetModules();
    const { GET } = await import("../route");

    await GET();
    expect(mocks.constructorCalls).toContain("wss://stream.aisstream.io/v0/stream");
  });

  it("should register WebSocket event handlers", async () => {
    process.env.AISSTREAM_API_KEY = "test-key";
    vi.resetModules();
    const { GET } = await import("../route");

    await GET();
    expect(mocks.onHandlers).toHaveProperty("open");
    expect(mocks.onHandlers).toHaveProperty("message");
    expect(mocks.onHandlers).toHaveProperty("error");
    expect(mocks.onHandlers).toHaveProperty("close");
  });

  it("should send subscription message on WebSocket open", async () => {
    process.env.AISSTREAM_API_KEY = "test-key";
    vi.resetModules();
    const { GET } = await import("../route");

    await GET();
    mocks.onHandlers["open"]();

    expect(mocks.instance.send).toHaveBeenCalledTimes(1);
    const sent = JSON.parse(mocks.instance.send.mock.calls[0][0]);
    expect(sent).toMatchObject({
      APIKey: "test-key",
      BoundingBoxes: [[[20, -30], [70, 50]]],
      FilterMessageTypes: ["PositionReport", "ShipStaticData"],
    });
  });

  it("should forward military vessel position reports", async () => {
    process.env.AISSTREAM_API_KEY = "test-key";
    vi.resetModules();
    const { GET } = await import("../route");

    const response = await GET();

    // Register military vessel
    mocks.onHandlers["message"](Buffer.from(JSON.stringify({
      MessageType: "ShipStaticData",
      MetaData: { MMSI: 123, ShipName: "USS Test" },
      Message: { ShipStaticData: { Type: 35 } },
    })));

    // Send position
    mocks.onHandlers["message"](Buffer.from(JSON.stringify({
      MessageType: "PositionReport",
      MetaData: { MMSI: 123, ShipName: "USS Test" },
      Message: { PositionReport: { Latitude: 48.85, Longitude: 2.35, TrueHeading: 270, Cog: 270, Sog: 15.5 } },
    })));

    // Read the vessel message from the real ReadableStream
    const reader = response.body!.getReader();
    const { value } = await reader.read();
    reader.cancel();

    const text = new TextDecoder().decode(value);
    expect(text).toContain('"type":"vessel"');
    const parsed = JSON.parse(text.replace("data: ", "").trim());
    expect(parsed.vessel).toMatchObject({ mmsi: 123, name: "USS Test", heading: 270, isMilitary: true });
  });

  it("should filter out non-military vessels", async () => {
    process.env.AISSTREAM_API_KEY = "test-key";
    vi.resetModules();
    const { GET } = await import("../route");

    const response = await GET();

    // Cargo vessel (Type 70) — not military
    mocks.onHandlers["message"](Buffer.from(JSON.stringify({
      MessageType: "ShipStaticData", MetaData: { MMSI: 999, ShipName: "Cargo" }, Message: { ShipStaticData: { Type: 70 } },
    })));
    mocks.onHandlers["message"](Buffer.from(JSON.stringify({
      MessageType: "PositionReport", MetaData: { MMSI: 999, ShipName: "Cargo" },
      Message: { PositionReport: { Latitude: 51, Longitude: -0.1, TrueHeading: 180, Cog: 180, Sog: 12 } },
    })));

    // Trigger WebSocket open to get the "connected" message enqueued
    mocks.onHandlers["open"]();

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    // Read the connected message (only expected enqueue)
    const { value } = await reader.read();
    const text = decoder.decode(value);
    reader.cancel();

    // Only the "connected" message should be in the stream, no vessel data
    expect(text).toContain('"type":"connected"');
    expect(text).not.toContain('"type":"vessel"');
  });

  it("should filter out stationary vessels", async () => {
    process.env.AISSTREAM_API_KEY = "test-key";
    vi.resetModules();
    const { GET } = await import("../route");

    const response = await GET();

    // Military but stationary (Sog: 0.3 < 0.5)
    mocks.onHandlers["message"](Buffer.from(JSON.stringify({
      MessageType: "ShipStaticData", MetaData: { MMSI: 111, ShipName: "Naval" }, Message: { ShipStaticData: { Type: 35 } },
    })));
    mocks.onHandlers["message"](Buffer.from(JSON.stringify({
      MessageType: "PositionReport", MetaData: { MMSI: 111, ShipName: "Naval" },
      Message: { PositionReport: { Latitude: 50, Longitude: 10, TrueHeading: 0, Cog: 0, Sog: 0.3 } },
    })));

    mocks.onHandlers["open"]();

    const reader = response.body!.getReader();
    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);
    reader.cancel();

    expect(text).toContain('"type":"connected"');
    expect(text).not.toContain('"type":"vessel"');
  });

  it("should handle heading 511 as null", async () => {
    process.env.AISSTREAM_API_KEY = "test-key";
    vi.resetModules();
    const { GET } = await import("../route");

    const response = await GET();

    mocks.onHandlers["message"](Buffer.from(JSON.stringify({
      MessageType: "ShipStaticData", MetaData: { MMSI: 444, ShipName: "Test" }, Message: { ShipStaticData: { Type: 35 } },
    })));
    mocks.onHandlers["message"](Buffer.from(JSON.stringify({
      MessageType: "PositionReport", MetaData: { MMSI: 444, ShipName: "Test" },
      Message: { PositionReport: { Latitude: 45, Longitude: 15, TrueHeading: 511, Cog: 90, Sog: 10 } },
    })));

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    // Read until we find the vessel message (skip connected/other messages)
    let vesselData: string | undefined;
    for (let i = 0; i < 3; i++) {
      const { value, done } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      if (text.includes('"type":"vessel"')) {
        vesselData = text;
        break;
      }
    }
    reader.cancel();

    expect(vesselData).toBeDefined();
    const parsed = JSON.parse(vesselData!.replace("data: ", "").trim());
    expect(parsed.vessel.heading).toBeNull();
  });
});
