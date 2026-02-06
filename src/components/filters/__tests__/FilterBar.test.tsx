import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

const mocks = vi.hoisted(() => ({
  toggleCategory: vi.fn(),
  showEvents: true,
  showAircraft: true,
  showVessels: true,
  showEarthquakes: true,
}));

vi.mock("@/lib/stores", () => ({
  useFilterStore: () => ({
    showEvents: mocks.showEvents,
    showAircraft: mocks.showAircraft,
    showVessels: mocks.showVessels,
    showEarthquakes: mocks.showEarthquakes,
    toggleCategory: mocks.toggleCategory,
  }),
}));

vi.mock("lucide-react", () => ({
  Crosshair: (props: any) => React.createElement("svg", { "data-testid": "icon-Crosshair", ...props }),
  Plane: (props: any) => React.createElement("svg", { "data-testid": "icon-Plane", ...props }),
  Ship: (props: any) => React.createElement("svg", { "data-testid": "icon-Ship", ...props }),
  Activity: (props: any) => React.createElement("svg", { "data-testid": "icon-Activity", ...props }),
}));

vi.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

import { FilterBar } from "../FilterBar";

describe("FilterBar", () => {
  beforeEach(() => {
    mocks.toggleCategory.mockClear();
    mocks.showEvents = true;
    mocks.showAircraft = true;
    mocks.showVessels = true;
    mocks.showEarthquakes = true;
  });

  it("renders 4 filter buttons", () => {
    render(<FilterBar />);

    expect(screen.getByText("Geopolitics")).toBeInTheDocument();
    expect(screen.getByText("Military Air")).toBeInTheDocument();
    expect(screen.getByText("Naval")).toBeInTheDocument();
    expect(screen.getByText("Seismic")).toBeInTheDocument();
  });

  it("calls toggleCategory with showEvents when Geopolitics is clicked", () => {
    render(<FilterBar />);
    fireEvent.click(screen.getByText("Geopolitics"));
    expect(mocks.toggleCategory).toHaveBeenCalledWith("showEvents");
  });

  it("calls toggleCategory with showAircraft when Military Air is clicked", () => {
    render(<FilterBar />);
    fireEvent.click(screen.getByText("Military Air"));
    expect(mocks.toggleCategory).toHaveBeenCalledWith("showAircraft");
  });

  it("calls toggleCategory with showVessels when Naval is clicked", () => {
    render(<FilterBar />);
    fireEvent.click(screen.getByText("Naval"));
    expect(mocks.toggleCategory).toHaveBeenCalledWith("showVessels");
  });

  it("calls toggleCategory with showEarthquakes when Seismic is clicked", () => {
    render(<FilterBar />);
    fireEvent.click(screen.getByText("Seismic"));
    expect(mocks.toggleCategory).toHaveBeenCalledWith("showEarthquakes");
  });

  it("renders appropriate icons for each filter", () => {
    render(<FilterBar />);
    expect(screen.getByTestId("icon-Crosshair")).toBeInTheDocument();
    expect(screen.getByTestId("icon-Plane")).toBeInTheDocument();
    expect(screen.getByTestId("icon-Ship")).toBeInTheDocument();
    expect(screen.getByTestId("icon-Activity")).toBeInTheDocument();
  });

  it("applies active styling to active filters", () => {
    mocks.showEvents = true;
    render(<FilterBar />);
    const btn = screen.getByText("Geopolitics").closest("button");
    expect(btn?.className).toContain("border-red-500/40");
    expect(btn?.className).toContain("bg-red-500/10");
    expect(btn?.className).toContain("text-red-400");
  });

  it("applies inactive styling to inactive filters", () => {
    mocks.showEvents = false;
    render(<FilterBar />);
    const btn = screen.getByText("Geopolitics").closest("button");
    expect(btn?.className).toContain("border-white/5");
    expect(btn?.className).toContain("bg-slate-900/70");
    expect(btn?.className).toContain("text-slate-500");
  });

  it("renders all buttons in a flex container", () => {
    const { container } = render(<FilterBar />);
    const filterBar = container.firstChild as HTMLElement;
    expect(filterBar.className).toContain("flex");
    expect(filterBar.className).toContain("gap-2");
  });

  it("positions the filter bar absolutely in top-left corner", () => {
    const { container } = render(<FilterBar />);
    const filterBar = container.firstChild as HTMLElement;
    expect(filterBar.className).toContain("absolute");
    expect(filterBar.className).toContain("left-4");
    expect(filterBar.className).toContain("top-4");
  });
});
