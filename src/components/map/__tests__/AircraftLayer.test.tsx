import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import type { Aircraft } from "@/types/aircraft";

const mocks = vi.hoisted(() => ({
  fetchAircraft: vi.fn(),
  aircraft: [] as Aircraft[],
  showAircraft: true,
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
  useAircraftStore: () => ({
    aircraft: mocks.aircraft,
    isLoading: false,
    fetchAircraft: mocks.fetchAircraft,
  }),
  useFilterStore: () => ({
    showEvents: true,
    showEarthquakes: true,
    showAircraft: mocks.showAircraft,
    showVessels: true,
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

import { AircraftLayer } from "../AircraftLayer";

const makeAircraft = (overrides: Partial<Aircraft> = {}): Aircraft => ({
  icao24: "abc123", callsign: "NATO01", registration: null, aircraftType: null,
  originCountry: "USA", longitude: -77, latitude: 38.9, altitude: 10000, velocity: 250,
  heading: 180, verticalRate: 0, onGround: false, isMilitary: true, squawk: null, lastSeen: 5,
  ...overrides,
});

describe("AircraftLayer", () => {
  beforeEach(() => {
    mocks.fetchAircraft.mockClear();
    mocks.aircraft = [];
    mocks.showAircraft = true;
  });

  it("returns null when showAircraft is false", () => {
    mocks.showAircraft = false;
    const { container } = render(<AircraftLayer />);
    expect(container.firstChild).toBeNull();
  });

  it("renders markers when aircraft exist", () => {
    mocks.aircraft = [makeAircraft(), makeAircraft({ icao24: "def456", longitude: -1, latitude: 51.5 })];
    render(<AircraftLayer />);
    expect(screen.getAllByTestId("marker")).toHaveLength(2);
  });

  it("calls fetchAircraft on mount", () => {
    render(<AircraftLayer />);
    expect(mocks.fetchAircraft).toHaveBeenCalledTimes(1);
  });

  it("filters out aircraft without coordinates", () => {
    mocks.aircraft = [makeAircraft({ latitude: null, longitude: null })];
    render(<AircraftLayer />);
    expect(screen.queryByTestId("marker")).not.toBeInTheDocument();
  });

  it("renders empty when aircraft array is empty", () => {
    render(<AircraftLayer />);
    expect(screen.queryByTestId("marker")).not.toBeInTheDocument();
  });
});
