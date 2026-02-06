import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import type { Vessel } from "@/types/vessel";

const mocks = vi.hoisted(() => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  vessels: new Map<number, Vessel>(),
  showVessels: true,
  isConnected: false,
  error: null as string | null,
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
  useVesselStore: () => ({
    vessels: mocks.vessels,
    isConnected: mocks.isConnected,
    connect: mocks.connect,
    disconnect: mocks.disconnect,
    error: mocks.error,
  }),
  useFilterStore: () => ({
    showEvents: true,
    showEarthquakes: true,
    showAircraft: true,
    showVessels: mocks.showVessels,
    toggleCategory: vi.fn(),
  }),
  useMapStore: () => ({
    viewState: { longitude: 0, latitude: 30, zoom: 2 },
    flyTo: vi.fn(),
    setViewState: vi.fn(),
    setMapRef: vi.fn(),
    mapRef: null,
  }),
}));

import { VesselLayer } from "../VesselLayer";

describe("VesselLayer", () => {
  beforeEach(() => {
    mocks.connect.mockClear();
    mocks.disconnect.mockClear();
    mocks.vessels = new Map();
    mocks.showVessels = true;
    mocks.isConnected = false;
    mocks.error = null;
  });

  it("returns null when showVessels is false", () => {
    mocks.showVessels = false;
    const { container } = render(<VesselLayer />);
    expect(container.firstChild).toBeNull();
  });

  it("calls connect when showVessels is true", () => {
    render(<VesselLayer />);
    expect(mocks.connect).toHaveBeenCalled();
  });

  it("renders markers when vessels exist", () => {
    const vessel: Vessel = { mmsi: 123, name: "USS Test", shipType: 35, latitude: 48.8, longitude: 2.3, heading: 90, courseOverGround: 90, speedOverGround: 15, destination: null, lastUpdate: Date.now() };
    mocks.vessels = new Map([[123, vessel]]);
    render(<VesselLayer />);
    expect(screen.getByTestId("marker")).toBeInTheDocument();
  });

  it("renders empty when vessels map is empty", () => {
    render(<VesselLayer />);
    expect(screen.queryByTestId("marker")).not.toBeInTheDocument();
  });
});
