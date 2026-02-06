import { describe, it, expect, beforeEach } from "vitest";
import { useFilterStore } from "../filterStore";

describe("filterStore", () => {
  beforeEach(() => {
    // Reset to initial state before each test
    useFilterStore.setState({
      showEvents: true,
      showEarthquakes: true,
      showAircraft: true,
      showVessels: true,
    });
  });

  describe("initial state", () => {
    it("should have all categories enabled by default", () => {
      const state = useFilterStore.getState();

      expect(state.showEvents).toBe(true);
      expect(state.showEarthquakes).toBe(true);
      expect(state.showAircraft).toBe(true);
      expect(state.showVessels).toBe(true);
    });
  });

  describe("toggleCategory", () => {
    it("should toggle showEvents from true to false", () => {
      const { toggleCategory } = useFilterStore.getState();

      toggleCategory("showEvents");

      expect(useFilterStore.getState().showEvents).toBe(false);
    });

    it("should toggle showEarthquakes from true to false", () => {
      const { toggleCategory } = useFilterStore.getState();

      toggleCategory("showEarthquakes");

      expect(useFilterStore.getState().showEarthquakes).toBe(false);
    });

    it("should toggle showAircraft from true to false", () => {
      const { toggleCategory } = useFilterStore.getState();

      toggleCategory("showAircraft");

      expect(useFilterStore.getState().showAircraft).toBe(false);
    });

    it("should toggle showVessels from true to false", () => {
      const { toggleCategory } = useFilterStore.getState();

      toggleCategory("showVessels");

      expect(useFilterStore.getState().showVessels).toBe(false);
    });

    it("should toggle category twice to return to original state", () => {
      const { toggleCategory } = useFilterStore.getState();

      // First toggle: true -> false
      toggleCategory("showEvents");
      expect(useFilterStore.getState().showEvents).toBe(false);

      // Second toggle: false -> true
      toggleCategory("showEvents");
      expect(useFilterStore.getState().showEvents).toBe(true);
    });

    it("should only affect the specified category", () => {
      const { toggleCategory } = useFilterStore.getState();

      toggleCategory("showEvents");

      const state = useFilterStore.getState();
      expect(state.showEvents).toBe(false);
      expect(state.showEarthquakes).toBe(true);
      expect(state.showAircraft).toBe(true);
      expect(state.showVessels).toBe(true);
    });

    it("should support toggling multiple categories independently", () => {
      const { toggleCategory } = useFilterStore.getState();

      toggleCategory("showEvents");
      toggleCategory("showAircraft");

      const state = useFilterStore.getState();
      expect(state.showEvents).toBe(false);
      expect(state.showEarthquakes).toBe(true);
      expect(state.showAircraft).toBe(false);
      expect(state.showVessels).toBe(true);
    });
  });
});
