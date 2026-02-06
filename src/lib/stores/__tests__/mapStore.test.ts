import { describe, it, expect, beforeEach, vi } from "vitest";
import { useMapStore } from "../mapStore";
import type { MapRef } from "react-map-gl/mapbox";

describe("mapStore", () => {
  beforeEach(() => {
    // Reset to initial state before each test
    useMapStore.setState({
      viewState: {
        longitude: 0,
        latitude: 30,
        zoom: 2,
      },
      mapRef: null,
    });
  });

  describe("initial state", () => {
    it("should have default viewState", () => {
      const state = useMapStore.getState();

      expect(state.viewState).toEqual({
        longitude: 0,
        latitude: 30,
        zoom: 2,
      });
    });

    it("should have null mapRef", () => {
      const state = useMapStore.getState();

      expect(state.mapRef).toBeNull();
    });
  });

  describe("setViewState", () => {
    it("should update viewState", () => {
      const { setViewState } = useMapStore.getState();

      const newViewState = {
        longitude: 2.3522,
        latitude: 48.8566,
        zoom: 10,
      };

      setViewState(newViewState);

      expect(useMapStore.getState().viewState).toEqual(newViewState);
    });
  });

  describe("setMapRef", () => {
    it("should update mapRef", () => {
      const { setMapRef } = useMapStore.getState();

      const mockMapRef = {
        flyTo: vi.fn(),
      } as unknown as MapRef;

      setMapRef(mockMapRef);

      expect(useMapStore.getState().mapRef).toBe(mockMapRef);
    });

    it("should allow setting mapRef to null", () => {
      const { setMapRef } = useMapStore.getState();

      // First set a mock ref
      const mockMapRef = {
        flyTo: vi.fn(),
      } as unknown as MapRef;
      setMapRef(mockMapRef);

      // Then set it to null
      setMapRef(null);

      expect(useMapStore.getState().mapRef).toBeNull();
    });
  });

  describe("flyTo", () => {
    it("should fallback to setViewState when mapRef is null", () => {
      const { flyTo } = useMapStore.getState();

      flyTo(2.3522, 48.8566, 10);

      const state = useMapStore.getState();
      expect(state.viewState).toEqual({
        longitude: 2.3522,
        latitude: 48.8566,
        zoom: 10,
      });
    });

    it("should use default zoom of 6 when not provided and mapRef is null", () => {
      const { flyTo } = useMapStore.getState();

      flyTo(2.3522, 48.8566);

      const state = useMapStore.getState();
      expect(state.viewState).toEqual({
        longitude: 2.3522,
        latitude: 48.8566,
        zoom: 6,
      });
    });

    it("should call mapRef.flyTo when mapRef is available", () => {
      const mockFlyTo = vi.fn();
      const mockMapRef = {
        flyTo: mockFlyTo,
      } as unknown as MapRef;

      const { setMapRef, flyTo } = useMapStore.getState();
      setMapRef(mockMapRef);

      flyTo(2.3522, 48.8566, 10);

      expect(mockFlyTo).toHaveBeenCalledWith({
        center: [2.3522, 48.8566],
        zoom: 10,
        duration: 1500,
        essential: true,
      });
    });

    it("should use default zoom of 6 when calling mapRef.flyTo without zoom parameter", () => {
      const mockFlyTo = vi.fn();
      const mockMapRef = {
        flyTo: mockFlyTo,
      } as unknown as MapRef;

      const { setMapRef, flyTo } = useMapStore.getState();
      setMapRef(mockMapRef);

      flyTo(2.3522, 48.8566);

      expect(mockFlyTo).toHaveBeenCalledWith({
        center: [2.3522, 48.8566],
        zoom: 6,
        duration: 1500,
        essential: true,
      });
    });

    it("should not update viewState when mapRef is available", () => {
      const mockFlyTo = vi.fn();
      const mockMapRef = {
        flyTo: mockFlyTo,
      } as unknown as MapRef;

      const { setMapRef, flyTo } = useMapStore.getState();
      setMapRef(mockMapRef);

      const initialViewState = useMapStore.getState().viewState;

      flyTo(2.3522, 48.8566, 10);

      // ViewState should remain unchanged
      expect(useMapStore.getState().viewState).toEqual(initialViewState);
    });
  });
});
