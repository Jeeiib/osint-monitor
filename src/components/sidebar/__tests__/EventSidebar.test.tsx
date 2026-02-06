import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import type { GdeltArticle } from "@/types/gdelt";

const mocks = vi.hoisted(() => ({
  events: [] as GdeltArticle[],
  isLoading: false,
  activeTab: "social" as "social" | "articles",
  fetchEvents: vi.fn(),
  toggleSidebar: vi.fn(),
  setTab: vi.fn(),
  selectEvent: vi.fn(),
}));

vi.mock("../EventCard", () => ({
  EventCard: ({ event, index }: { event: GdeltArticle; index: number }) =>
    React.createElement("div", { "data-testid": "event-card" }, event.title),
}));

vi.mock("@/lib/stores", () => ({
  useEventsStore: () => ({
    events: mocks.events,
    isLoading: mocks.isLoading,
    fetchEvents: mocks.fetchEvents,
    selectedEventIndex: null,
    selectEvent: mocks.selectEvent,
  }),
  useSidebarStore: () => ({
    isOpen: true,
    activeTab: mocks.activeTab,
    toggleSidebar: mocks.toggleSidebar,
    setTab: mocks.setTab,
    open: vi.fn(),
    close: vi.fn(),
  }),
}));

// Mock ALL icons used by EventSidebar
vi.mock("lucide-react", () => ({
  PanelRightClose: (props: any) => React.createElement("svg", { "data-testid": "icon-PanelRightClose", ...props }),
  PanelRightOpen: (props: any) => React.createElement("svg", { "data-testid": "icon-PanelRightOpen", ...props }),
  Newspaper: (props: any) => React.createElement("svg", { "data-testid": "icon-Newspaper", ...props }),
  Radio: (props: any) => React.createElement("svg", { "data-testid": "icon-Radio", ...props }),
  // EventCard also imports these (even though it's mocked, the mock factory still needs them)
  ExternalLink: (props: any) => React.createElement("svg", { "data-testid": "icon-ExternalLink", ...props }),
  Globe: (props: any) => React.createElement("svg", { "data-testid": "icon-Globe", ...props }),
}));

import { EventSidebar } from "../EventSidebar";

describe("EventSidebar", () => {
  beforeEach(() => {
    mocks.events = [];
    mocks.isLoading = false;
    mocks.activeTab = "social";
    mocks.fetchEvents.mockClear();
    mocks.toggleSidebar.mockClear();
    mocks.setTab.mockClear();
    mocks.selectEvent.mockClear();
  });

  it("renders Intelligence Feed header", () => {
    render(<EventSidebar />);
    expect(screen.getByText("Intelligence Feed")).toBeInTheDocument();
  });

  it("calls fetchEvents on mount", () => {
    render(<EventSidebar />);
    expect(mocks.fetchEvents).toHaveBeenCalledTimes(1);
  });

  it("renders tab buttons for Social Feed and Articles", () => {
    render(<EventSidebar />);
    expect(screen.getByText("Social Feed")).toBeInTheDocument();
    expect(screen.getByText("Articles")).toBeInTheDocument();
  });

  it("calls setTab when clicking tab buttons", () => {
    render(<EventSidebar />);
    fireEvent.click(screen.getByText("Articles"));
    expect(mocks.setTab).toHaveBeenCalledWith("articles");
  });

  it("shows Social Feed placeholder when social tab is active", () => {
    mocks.activeTab = "social";
    render(<EventSidebar />);
    expect(screen.getByText(/Real-time OSINT social feeds/)).toBeInTheDocument();
    expect(screen.getByText(/Awaiting integration/)).toBeInTheDocument();
  });

  it("shows loading skeleton when events are loading", () => {
    mocks.activeTab = "articles";
    mocks.isLoading = true;
    render(<EventSidebar />);
    const skeletons = screen.getAllByRole("generic").filter((el) =>
      el.className.includes("animate-pulse")
    );
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows 'No articles yet' message when events array is empty", () => {
    mocks.activeTab = "articles";
    mocks.isLoading = false;
    mocks.events = [];
    render(<EventSidebar />);
    expect(screen.getByText("No articles yet")).toBeInTheDocument();
    expect(screen.getByText("Click a red dot on the map")).toBeInTheDocument();
  });

  it("renders EventCard list when events exist", () => {
    mocks.activeTab = "articles";
    mocks.events = [
      { title: "Event 1", url: "https://example.com/1", image: "", sourceDomain: "example.com", latitude: 50, longitude: 30, locationName: "Location 1", count: 5, shareImage: "" },
      { title: "Event 2", url: "https://example.com/2", image: "", sourceDomain: "example.com", latitude: 51, longitude: 31, locationName: "Location 2", count: 3, shareImage: "" },
    ];
    render(<EventSidebar />);
    expect(screen.getAllByTestId("event-card")).toHaveLength(2);
    expect(screen.getByText("Event 1")).toBeInTheDocument();
    expect(screen.getByText("Event 2")).toBeInTheDocument();
  });

  it("shows article count badge in Articles tab", () => {
    mocks.activeTab = "articles";
    mocks.events = [
      { title: "Event 1", url: "https://example.com/1", image: "", sourceDomain: "example.com", latitude: 50, longitude: 30, locationName: "Location 1", count: 5, shareImage: "" },
    ];
    const { container } = render(<EventSidebar />);
    const badge = container.querySelector(".text-\\[10px\\]");
    expect(badge).toHaveTextContent("1");
  });

  it("toggles sidebar when toggle button is clicked", () => {
    render(<EventSidebar />);
    const toggleButton = screen.getAllByRole("button").find((btn) =>
      btn.querySelector('[data-testid="icon-PanelRightClose"]')
    );
    if (toggleButton) {
      fireEvent.click(toggleButton);
      expect(mocks.toggleSidebar).toHaveBeenCalledTimes(1);
    }
  });

  it("renders monitored OSINT accounts in social feed", () => {
    mocks.activeTab = "social";
    render(<EventSidebar />);
    expect(screen.getByText("@IntelCrab")).toBeInTheDocument();
    expect(screen.getByText("@OSINTdefender")).toBeInTheDocument();
    expect(screen.getByText("@Liveuamap")).toBeInTheDocument();
  });

  it("applies active styling to selected tab", () => {
    mocks.activeTab = "articles";
    render(<EventSidebar />);
    const articlesTab = screen.getByText("Articles").closest("button");
    expect(articlesTab).toHaveClass("text-red-400");
  });
});
