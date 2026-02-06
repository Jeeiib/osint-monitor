import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useVesselStore } from "../vesselStore";

// Mock EventSource as a proper class (arrow fns can't be constructors)
class MockEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  readyState = MockEventSource.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  url: string;

  constructor(url: string) {
    this.url = url;
    MockEventSource._instances.push(this);
  }

  close() {
    this.readyState = MockEventSource.CLOSED;
  }

  simulateOpen() {
    this.readyState = MockEventSource.OPEN;
    if (this.onopen) this.onopen();
  }

  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent("message", { data: JSON.stringify(data) }));
    }
  }

  simulateError() {
    this.readyState = MockEventSource.CLOSED;
    if (this.onerror) this.onerror();
  }

  static _instances: MockEventSource[] = [];
  static reset() {
    MockEventSource._instances = [];
  }
  static get latest(): MockEventSource | null {
    return MockEventSource._instances[MockEventSource._instances.length - 1] ?? null;
  }
}

describe("vesselStore", () => {
  beforeEach(() => {
    // Clean up module-level vars by disconnecting
    useVesselStore.getState().disconnect();
    useVesselStore.setState({ vessels: new Map(), isConnected: false, error: null });

    MockEventSource.reset();
    (global as any).EventSource = MockEventSource;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.clearAllTimers();
  });

  afterEach(() => {
    useVesselStore.getState().disconnect();
    vi.restoreAllMocks();
    vi.clearAllTimers();
  });

  describe("initial state", () => {
    it("should have empty vessels Map", () => {
      const state = useVesselStore.getState();
      expect(state.vessels).toBeInstanceOf(Map);
      expect(state.vessels.size).toBe(0);
    });

    it("should not be connected", () => {
      expect(useVesselStore.getState().isConnected).toBe(false);
    });

    it("should have no error", () => {
      expect(useVesselStore.getState().error).toBeNull();
    });
  });

  describe("connect", () => {
    it("should create EventSource with correct URL", () => {
      useVesselStore.getState().connect();
      expect(MockEventSource._instances).toHaveLength(1);
      expect(MockEventSource.latest!.url).toBe("/api/vessels/stream");
    });

    it("should set isConnected to true when connection opens", () => {
      useVesselStore.getState().connect();
      MockEventSource.latest!.simulateOpen();
      expect(useVesselStore.getState().isConnected).toBe(true);
      expect(useVesselStore.getState().error).toBeNull();
    });

    it("should not create multiple connections if already connecting", () => {
      useVesselStore.getState().connect();
      useVesselStore.getState().connect();
      expect(MockEventSource._instances).toHaveLength(1);
    });

    it("should not create multiple connections if already open", () => {
      useVesselStore.getState().connect();
      MockEventSource.latest!.simulateOpen();
      useVesselStore.getState().connect();
      expect(MockEventSource._instances).toHaveLength(1);
    });

    it("should handle EventSource creation error", () => {
      const ThrowingEventSource = class {
        static CONNECTING = 0;
        static OPEN = 1;
        static CLOSED = 2;
        constructor() {
          throw new Error("Failed");
        }
      };
      (global as any).EventSource = ThrowingEventSource;

      useVesselStore.getState().connect();
      expect(useVesselStore.getState().error).toBe("Échec de connexion");
      expect(useVesselStore.getState().isConnected).toBe(false);
    });

    it("should handle vessel messages and add to Map", () => {
      useVesselStore.getState().connect();
      MockEventSource.latest!.simulateOpen();

      MockEventSource.latest!.simulateMessage({
        type: "vessel",
        vessel: { mmsi: 123456789, name: "TEST SHIP", latitude: 48.8566, longitude: 2.3522, heading: 180, cog: 175, sog: 15.5 },
      });

      const state = useVesselStore.getState();
      expect(state.vessels.size).toBe(1);
      expect(state.vessels.has(123456789)).toBe(true);
      const vessel = state.vessels.get(123456789)!;
      expect(vessel.mmsi).toBe(123456789);
      expect(vessel.name).toBe("TEST SHIP");
      expect(vessel.latitude).toBe(48.8566);
    });

    it("should ignore connected messages", () => {
      useVesselStore.getState().connect();
      MockEventSource.latest!.simulateOpen();
      MockEventSource.latest!.simulateMessage({ type: "connected" });
      expect(useVesselStore.getState().vessels.size).toBe(0);
    });

    it("should handle error messages", () => {
      useVesselStore.getState().connect();
      MockEventSource.latest!.simulateOpen();
      MockEventSource.latest!.simulateMessage({ type: "error", message: "Test error" });
      expect(useVesselStore.getState().error).toBe("Test error");
    });

    it("should handle malformed messages gracefully", () => {
      useVesselStore.getState().connect();
      MockEventSource.latest!.simulateOpen();
      if (MockEventSource.latest!.onmessage) {
        MockEventSource.latest!.onmessage(new MessageEvent("message", { data: "invalid json" }));
      }
      expect(useVesselStore.getState().vessels.size).toBe(0);
    });

    it("should clean up vessels older than 2 minutes", () => {
      vi.useFakeTimers();
      vi.setSystemTime(Date.now());

      useVesselStore.getState().connect();
      MockEventSource.latest!.simulateOpen();

      MockEventSource.latest!.simulateMessage({
        type: "vessel",
        vessel: { mmsi: 111, latitude: 48, longitude: 2, heading: 0, cog: 0, sog: 0 },
      });

      vi.advanceTimersByTime(2.5 * 60 * 1000);

      MockEventSource.latest!.simulateMessage({
        type: "vessel",
        vessel: { mmsi: 222, latitude: 50, longitude: 3, heading: 0, cog: 0, sog: 0 },
      });

      const state = useVesselStore.getState();
      expect(state.vessels.size).toBe(1);
      expect(state.vessels.has(222)).toBe(true);
      expect(state.vessels.has(111)).toBe(false);

      vi.useRealTimers();
    });
  });

  describe("disconnect", () => {
    it("should close EventSource and clear vessels", () => {
      useVesselStore.getState().connect();
      const es = MockEventSource.latest!;
      es.simulateOpen();

      MockEventSource.latest!.simulateMessage({
        type: "vessel",
        vessel: { mmsi: 123, latitude: 48, longitude: 2, heading: 0, cog: 0, sog: 0 },
      });
      expect(useVesselStore.getState().vessels.size).toBe(1);

      useVesselStore.getState().disconnect();

      expect(useVesselStore.getState().isConnected).toBe(false);
      expect(useVesselStore.getState().vessels.size).toBe(0);
      expect(es.readyState).toBe(MockEventSource.CLOSED);
    });

    it("should handle disconnect when not connected", () => {
      expect(() => useVesselStore.getState().disconnect()).not.toThrow();
      expect(useVesselStore.getState().isConnected).toBe(false);
    });
  });

  describe("reconnection logic", () => {
    it("should set isConnected to false on error", () => {
      useVesselStore.getState().connect();
      MockEventSource.latest!.simulateOpen();
      expect(useVesselStore.getState().isConnected).toBe(true);

      MockEventSource.latest!.simulateError();
      expect(useVesselStore.getState().isConnected).toBe(false);
    });

    it("should close EventSource on error", () => {
      useVesselStore.getState().connect();
      const es = MockEventSource.latest!;
      es.simulateError();
      expect(es.readyState).toBe(MockEventSource.CLOSED);
    });
  });
});
