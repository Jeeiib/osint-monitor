import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import type { GdeltArticle } from "@/types/gdelt";
import type { Earthquake } from "@/types/earthquake";
import type { Aircraft } from "@/types/aircraft";

const mocks = vi.hoisted(() => ({
  events: [] as GdeltArticle[],
  eventsLoading: false,
  earthquakes: [] as Earthquake[],
  quakesLoading: false,
  aircraft: [] as Aircraft[],
}));

vi.mock("@/lib/stores", () => ({
  useEventsStore: () => ({
    events: mocks.events,
    isLoading: mocks.eventsLoading,
    fetchEvents: vi.fn(),
    selectedEventIndex: null,
    selectEvent: vi.fn(),
  }),
  useEarthquakeStore: () => ({
    earthquakes: mocks.earthquakes,
    isLoading: mocks.quakesLoading,
    fetchEarthquakes: vi.fn(),
  }),
  useAircraftStore: () => ({
    aircraft: mocks.aircraft,
    isLoading: false,
    fetchAircraft: vi.fn(),
  }),
}));

vi.mock("lucide-react", () => ({
  Crosshair: (props: any) => React.createElement("svg", { "data-testid": "icon-Crosshair", ...props }),
  Plane: (props: any) => React.createElement("svg", { "data-testid": "icon-Plane", ...props }),
  Ship: (props: any) => React.createElement("svg", { "data-testid": "icon-Ship", ...props }),
  Activity: (props: any) => React.createElement("svg", { "data-testid": "icon-Activity", ...props }),
  Settings: (props: any) => React.createElement("svg", { "data-testid": "icon-Settings", ...props }),
  Radio: (props: any) => React.createElement("svg", { "data-testid": "icon-Radio", ...props }),
  Globe: (props: any) => React.createElement("svg", { "data-testid": "icon-Globe", ...props }),
}));

import { Header } from "../Header";

describe("Header", () => {
  beforeEach(() => {
    mocks.events = [];
    mocks.eventsLoading = false;
    mocks.earthquakes = [];
    mocks.quakesLoading = false;
    mocks.aircraft = [];
  });

  it('renders "OSINT Monitor" title', () => {
    render(<Header />);
    expect(screen.getByText("OSINT Monitor")).toBeInTheDocument();
  });

  it("renders logo with OS text", () => {
    render(<Header />);
    expect(screen.getByText("OS")).toBeInTheDocument();
  });

  it("shows event count", () => {
    mocks.events = [
      { title: "Event 1", url: "https://example.com/1", image: "", sourceDomain: "example.com", latitude: 50, longitude: 30, locationName: "Location 1", count: 5, shareImage: "" },
      { title: "Event 2", url: "https://example.com/2", image: "", sourceDomain: "example.com", latitude: 51, longitude: 31, locationName: "Location 2", count: 3, shareImage: "" },
    ];
    render(<Header />);
    expect(screen.getByText("2 events")).toBeInTheDocument();
  });

  it("shows '...' when events are loading", () => {
    mocks.eventsLoading = true;
    render(<Header />);
    const statsTexts = screen.getAllByText("...");
    expect(statsTexts.length).toBeGreaterThan(0);
  });

  it("shows quake count for earthquakes with magnitude >= 5.5", () => {
    mocks.earthquakes = [
      { id: "1", magnitude: 6.5, place: "Near Tokyo", latitude: 35.5, longitude: 139.5, depth: 10, time: Date.now() },
      { id: "2", magnitude: 5.5, place: "California", latitude: 37.5, longitude: -122.5, depth: 8, time: Date.now() },
      { id: "3", magnitude: 4.2, place: "Minor quake", latitude: 40, longitude: -120, depth: 5, time: Date.now() },
    ];
    render(<Header />);
    expect(screen.getByText("2 quakes")).toBeInTheDocument();
  });

  it("shows '...' when quakes are loading", () => {
    mocks.quakesLoading = true;
    render(<Header />);
    const statsTexts = screen.getAllByText("...");
    expect(statsTexts.length).toBeGreaterThan(0);
  });

  it("shows aircraft count", () => {
    mocks.aircraft = [
      { icao24: "abc123", callsign: "NATO01", registration: null, aircraftType: null, originCountry: "United States", longitude: -77, latitude: 38, altitude: 10000, velocity: 250, heading: 180, verticalRate: 0, onGround: false, isMilitary: true, squawk: null, lastSeen: 5 },
      { icao24: "def456", callsign: "RAF02", registration: null, aircraftType: null, originCountry: "United Kingdom", longitude: -1, latitude: 51, altitude: 8000, velocity: 200, heading: 90, verticalRate: 0, onGround: false, isMilitary: true, squawk: null, lastSeen: 3 },
    ];
    render(<Header />);
    expect(screen.getByText("2 aircraft")).toBeInTheDocument();
  });

  it("shows 0 counts when stores are empty", () => {
    render(<Header />);
    expect(screen.getByText("0 events")).toBeInTheDocument();
    expect(screen.getByText("0 quakes")).toBeInTheDocument();
    expect(screen.getByText("0 aircraft")).toBeInTheDocument();
  });

  it("renders settings button", () => {
    render(<Header />);
    expect(screen.getByTestId("icon-Settings")).toBeInTheDocument();
  });

  it("renders status dots with correct colors", () => {
    const { container } = render(<Header />);
    expect(container.querySelector(".bg-red-500")).toBeInTheDocument();
    expect(container.querySelector(".bg-orange-500")).toBeInTheDocument();
    expect(container.querySelector(".bg-blue-500")).toBeInTheDocument();
  });

  it("renders with correct header styling", () => {
    const { container } = render(<Header />);
    const header = container.querySelector("header");
    expect(header?.className).toContain("border-b");
    expect(header?.className).toContain("bg-slate-900/60");
    expect(header?.className).toContain("backdrop-blur-xl");
  });
});
