import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import type { GdeltArticle } from "@/types/gdelt";

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
  ExternalLink: (props: any) => React.createElement("svg", { "data-testid": "icon-ExternalLink", ...props }),
  Globe: (props: any) => React.createElement("svg", { "data-testid": "icon-Globe", ...props }),
}));

import { EventCard } from "../EventCard";

describe("EventCard", () => {
  const mockEvent: GdeltArticle = {
    title: "Breaking: Major conflict in region",
    url: "https://example.com/article",
    image: "https://example.com/image.jpg",
    sourceDomain: "example.com",
    latitude: 50.5,
    longitude: 30.5,
    locationName: "Kyiv, Ukraine",
    count: 15,
    shareImage: "",
  };

  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mocks.flyTo.mockClear();
    mockOnSelect.mockClear();
  });

  it("renders event title, domain, and location", () => {
    render(<EventCard event={mockEvent} index={0} isSelected={false} onSelect={mockOnSelect} />);
    expect(screen.getByText("Breaking: Major conflict in region")).toBeInTheDocument();
    expect(screen.getByText("example.com")).toBeInTheDocument();
    expect(screen.getByText("Kyiv, Ukraine")).toBeInTheDocument();
  });

  it("calls onSelect and flyTo when clicked", () => {
    render(<EventCard event={mockEvent} index={2} isSelected={false} onSelect={mockOnSelect} />);
    const card = screen.getByText("Breaking: Major conflict in region").closest("div");
    fireEvent.click(card!);
    expect(mockOnSelect).toHaveBeenCalledWith(2);
    expect(mocks.flyTo).toHaveBeenCalledWith(30.5, 50.5, 6);
  });

  it("hides image on error", () => {
    const { container } = render(<EventCard event={mockEvent} index={0} isSelected={false} onSelect={mockOnSelect} />);
    // Image has alt="" so role is "presentation", use querySelector instead
    const img = container.querySelector("img")!;
    expect(img).toBeTruthy();
    fireEvent.error(img);
    expect(img.style.display).toBe("none");
  });

  it("renders translate link with correct URL", () => {
    render(<EventCard event={mockEvent} index={0} isSelected={false} onSelect={mockOnSelect} />);
    const translateLink = screen.getByText("Traduire FR");
    expect(translateLink).toHaveAttribute(
      "href",
      `https://translate.google.com/translate?sl=auto&tl=fr&u=${encodeURIComponent(mockEvent.url)}`
    );
    expect(translateLink).toHaveAttribute("target", "_blank");
    expect(translateLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows article count when count > 1", () => {
    render(<EventCard event={mockEvent} index={0} isSelected={false} onSelect={mockOnSelect} />);
    expect(screen.getByText("15 articles")).toBeInTheDocument();
  });

  it("does not show article count when count = 1", () => {
    const singleEvent = { ...mockEvent, count: 1 };
    render(<EventCard event={singleEvent} index={0} isSelected={false} onSelect={mockOnSelect} />);
    expect(screen.queryByText(/articles$/)).not.toBeInTheDocument();
  });

  it("applies selected styling when isSelected is true", () => {
    const { container } = render(<EventCard event={mockEvent} index={0} isSelected={true} onSelect={mockOnSelect} />);
    // The outer div (with id="event-card-0") has the selected classes
    const card = container.querySelector("#event-card-0")!;
    expect(card.className).toContain("border-red-500/40");
    expect(card.className).toContain("bg-red-500/10");
  });

  it("renders without image when image is not provided", () => {
    const eventWithoutImage = { ...mockEvent, image: "" };
    const { container } = render(<EventCard event={eventWithoutImage} index={0} isSelected={false} onSelect={mockOnSelect} />);
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders severity bar with width based on count", () => {
    const { container } = render(<EventCard event={mockEvent} index={0} isSelected={false} onSelect={mockOnSelect} />);
    const severityBar = container.querySelector(".bg-gradient-to-r");
    expect(severityBar).toBeInTheDocument();
    expect(severityBar).toHaveStyle({ width: "45%" });
  });

  it("stops propagation when clicking external links", () => {
    render(<EventCard event={mockEvent} index={0} isSelected={false} onSelect={mockOnSelect} />);
    const readLink = screen.getByText("Read");
    fireEvent.click(readLink);
    // The link has onClick={(e) => e.stopPropagation()}, so onSelect should NOT be called
    expect(mockOnSelect).not.toHaveBeenCalled();
  });
});
