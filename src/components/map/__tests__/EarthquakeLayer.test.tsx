import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import type { Earthquake } from "@/types/earthquake";

const mocks = vi.hoisted(() => ({
  fetchEarthquakes: vi.fn(),
  earthquakes: [] as Earthquake[],
  showEarthquakes: true,
}));

vi.mock("react-map-gl/mapbox", () => ({
  default: (props: any) => React.createElement("div", { "data-testid": "map" }, props.children),
  Source: (props: any) => React.createElement("div", { "data-testid": "source" }, props.children),
  Layer: () => React.createElement("div", { "data-testid": "layer" }),
  Marker: (props: any) => React.createElement("div", { "data-testid": "marker" }, props.children),
  Popup: (props: any) => React.createElement("div", { "data-testid": "popup" }, props.children),
  NavigationControl: () => React.createElement("div", { "data-testid": "nav-control" }),
}));

vi.mock("mapbox-gl/dist/mapbox-gl.css", () => ({}));

vi.mock("@/lib/stores", () => ({
  useEarthquakeStore: () => ({
    earthquakes: mocks.earthquakes,
    isLoading: false,
    fetchEarthquakes: mocks.fetchEarthquakes,
  }),
  useFilterStore: () => ({
    showEvents: true,
    showEarthquakes: mocks.showEarthquakes,
    showAircraft: true,
    showVessels: true,
    toggleCategory: vi.fn(),
  }),
}));

// Must import AFTER vi.mock
import { EarthquakeLayer } from "../EarthquakeLayer";

describe("EarthquakeLayer", () => {
  beforeEach(() => {
    mocks.fetchEarthquakes.mockClear();
    mocks.earthquakes = [];
    mocks.showEarthquakes = true;
  });

  it("returns null when showEarthquakes is false", () => {
    mocks.showEarthquakes = false;
    const { container } = render(<EarthquakeLayer />);
    expect(container.firstChild).toBeNull();
  });

  it("renders Source and Layer when showEarthquakes is true", () => {
    mocks.earthquakes = [
      { id: "1", magnitude: 6.5, place: "Near Tokyo", latitude: 35.5, longitude: 139.5, depth: 10, time: Date.now(), url: "https://earthquake.usgs.gov/1", felt: null, significance: 500 },
    ];
    render(<EarthquakeLayer />);
    expect(screen.getByTestId("source")).toBeInTheDocument();
    expect(screen.getByTestId("layer")).toBeInTheDocument();
  });

  it("calls fetchEarthquakes on mount", () => {
    render(<EarthquakeLayer />);
    expect(mocks.fetchEarthquakes).toHaveBeenCalledTimes(1);
  });

  it("renders when earthquakes array is empty", () => {
    render(<EarthquakeLayer />);
    expect(screen.getByTestId("source")).toBeInTheDocument();
  });
});
