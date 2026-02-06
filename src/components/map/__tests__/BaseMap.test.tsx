import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("../EarthquakeLayer", () => ({
  EarthquakeLayer: () => React.createElement("div", { "data-testid": "earthquake-layer" }),
}));
vi.mock("../AircraftLayer", () => ({
  AircraftLayer: () => React.createElement("div", { "data-testid": "aircraft-layer" }),
}));
vi.mock("../VesselLayer", () => ({
  VesselLayer: () => React.createElement("div", { "data-testid": "vessel-layer" }),
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
  useMapStore: () => ({
    viewState: { longitude: 0, latitude: 30, zoom: 2 },
    flyTo: vi.fn(), setViewState: vi.fn(), setMapRef: vi.fn(), mapRef: null,
  }),
  useFilterStore: () => ({
    showEvents: true, showEarthquakes: true, showAircraft: true, showVessels: true, toggleCategory: vi.fn(),
  }),
  useEventsStore: () => ({
    events: [], isLoading: false, fetchEvents: vi.fn(), selectedEventIndex: null, selectEvent: vi.fn(),
  }),
  useSidebarStore: () => ({
    isOpen: true, activeTab: "social", toggleSidebar: vi.fn(), setTab: vi.fn(), open: vi.fn(), close: vi.fn(),
  }),
}));

import { BaseMap } from "../BaseMap";

describe("BaseMap", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it("shows error message when MAPBOX_TOKEN is missing", () => {
    delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    render(<BaseMap />);
    expect(screen.getByText("Mapbox token manquant")).toBeInTheDocument();
  });

  it("does not render map when token is missing", () => {
    delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    render(<BaseMap />);
    expect(screen.queryByTestId("map")).not.toBeInTheDocument();
  });

  it("renders error with correct styling", () => {
    delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const { container } = render(<BaseMap />);
    expect(screen.getByText("Mapbox token manquant")).toHaveClass("text-red-500");
  });
});
