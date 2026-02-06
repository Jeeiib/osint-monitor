import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import type { Aircraft } from "@/types/aircraft";
import type { Vessel } from "@/types/vessel";

const mocks = vi.hoisted(() => ({
  flyTo: vi.fn(),
}));

vi.mock("@/lib/stores", () => ({
  useMapStore: () => ({
    viewState: { longitude: 0, latitude: 30, zoom: 2 },
    flyTo: mocks.flyTo,
    setViewState: vi.fn(),
    setMapRef: vi.fn(),
    mapRef: null,
  }),
}));

vi.mock("lucide-react", () => ({
  Plane: (props: any) => React.createElement("svg", { "data-testid": "icon-Plane", ...props }),
  Ship: (props: any) => React.createElement("svg", { "data-testid": "icon-Ship", ...props }),
}));

import { MilitaryCard } from "../MilitaryCard";

describe("MilitaryCard", () => {
  const mockAircraft: Aircraft = {
    icao24: "abc123", callsign: "NATO01", registration: "N123AB", aircraftType: "F-16",
    originCountry: "United States", longitude: -77.0369, latitude: 38.9072, altitude: 10000,
    velocity: 250, heading: 180, verticalRate: 0, onGround: false, isMilitary: true, squawk: "7700", lastSeen: 5,
  };

  const mockVessel: Vessel = {
    mmsi: 123456789, name: "USS Enterprise", shipType: 30, latitude: 35.5, longitude: 139.5,
    heading: 90, courseOverGround: 95, speedOverGround: 15.5, destination: "TOKYO", lastUpdate: Date.now(),
  };

  beforeEach(() => {
    mocks.flyTo.mockClear();
  });

  describe("Aircraft Card", () => {
    it("renders aircraft with callsign, type, and country", () => {
      render(<MilitaryCard type="aircraft" data={mockAircraft} />);
      expect(screen.getByText("NATO01")).toBeInTheDocument();
      expect(screen.getByText("United States")).toBeInTheDocument();
      expect(screen.getByText("F-16")).toBeInTheDocument();
    });

    it("renders MIL badge when aircraft is military", () => {
      render(<MilitaryCard type="aircraft" data={mockAircraft} />);
      expect(screen.getByText("MIL")).toBeInTheDocument();
    });

    it("does not render MIL badge for civilian aircraft", () => {
      const civilianAircraft = { ...mockAircraft, isMilitary: false };
      render(<MilitaryCard type="aircraft" data={civilianAircraft} />);
      expect(screen.queryByText("MIL")).not.toBeInTheDocument();
    });

    it("displays altitude in FL format", () => {
      render(<MilitaryCard type="aircraft" data={mockAircraft} />);
      expect(screen.getByText(/FL\d+/)).toBeInTheDocument();
    });

    it("displays speed in knots", () => {
      render(<MilitaryCard type="aircraft" data={mockAircraft} />);
      expect(screen.getByText(/\d+ kts/)).toBeInTheDocument();
    });

    it("displays heading in degrees", () => {
      render(<MilitaryCard type="aircraft" data={mockAircraft} />);
      expect(screen.getByText("180°")).toBeInTheDocument();
    });

    it("calls flyTo with aircraft coordinates when clicked", () => {
      render(<MilitaryCard type="aircraft" data={mockAircraft} />);
      const card = screen.getByText("NATO01").closest("div");
      fireEvent.click(card!);
      expect(mocks.flyTo).toHaveBeenCalledWith(-77.0369, 38.9072, 7);
    });

    it("returns null when aircraft has no coordinates", () => {
      const noCoords = { ...mockAircraft, latitude: null, longitude: null };
      const { container } = render(<MilitaryCard type="aircraft" data={noCoords} />);
      expect(container.firstChild).toBeNull();
    });

    it("uses ICAO24 when callsign is not available", () => {
      const noCallsign = { ...mockAircraft, callsign: null };
      render(<MilitaryCard type="aircraft" data={noCallsign} />);
      expect(screen.getByText("ABC123")).toBeInTheDocument();
    });

    it("renders Plane icon", () => {
      render(<MilitaryCard type="aircraft" data={mockAircraft} />);
      expect(screen.getByTestId("icon-Plane")).toBeInTheDocument();
    });
  });

  describe("Vessel Card", () => {
    it("renders vessel with name", () => {
      render(<MilitaryCard type="vessel" data={mockVessel} />);
      expect(screen.getByText("USS Enterprise")).toBeInTheDocument();
    });

    it("displays MMSI as fallback when name is null", () => {
      const noName = { ...mockVessel, name: null };
      render(<MilitaryCard type="vessel" data={noName} />);
      // Both header and detail show MMSI — use getAllByText
      const mmsiElements = screen.getAllByText(/MMSI 123456789/);
      expect(mmsiElements.length).toBeGreaterThanOrEqual(1);
    });

    it("displays speed in knots", () => {
      render(<MilitaryCard type="vessel" data={mockVessel} />);
      expect(screen.getByText("15.5 kts")).toBeInTheDocument();
    });

    it("displays heading in degrees", () => {
      render(<MilitaryCard type="vessel" data={mockVessel} />);
      expect(screen.getByText("90°")).toBeInTheDocument();
    });

    it("calls flyTo with vessel coordinates when clicked", () => {
      render(<MilitaryCard type="vessel" data={mockVessel} />);
      const card = screen.getByText("USS Enterprise").closest("div");
      fireEvent.click(card!);
      expect(mocks.flyTo).toHaveBeenCalledWith(139.5, 35.5, 8);
    });

    it("renders Ship icon", () => {
      render(<MilitaryCard type="vessel" data={mockVessel} />);
      expect(screen.getByTestId("icon-Ship")).toBeInTheDocument();
    });

    it("shows N/A for null speed", () => {
      const noSpeed = { ...mockVessel, speedOverGround: null };
      render(<MilitaryCard type="vessel" data={noSpeed} />);
      expect(screen.getByText("N/A")).toBeInTheDocument();
    });

    it("does not render heading span when heading is null", () => {
      // The component conditionally renders heading: {v.heading !== null && <span>{heading}°</span>}
      const noHeading = { ...mockVessel, heading: null };
      render(<MilitaryCard type="vessel" data={noHeading} />);
      // Heading span should not exist (no °)
      expect(screen.queryByText(/°/)).not.toBeInTheDocument();
    });
  });
});
