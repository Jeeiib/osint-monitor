import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Mock Header to isolate MainLayout
vi.mock("../Header", () => ({
  Header: () => React.createElement("header", { "data-testid": "header" }, "Header"),
}));

// Mock EventSidebar
vi.mock("@/components/sidebar/EventSidebar", () => ({
  EventSidebar: () => React.createElement("aside", { "data-testid": "sidebar" }, "Sidebar"),
}));

import { MainLayout } from "../MainLayout";

describe("MainLayout", () => {
  it("renders Header component", () => {
    render(<MainLayout><div>content</div></MainLayout>);
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  it("renders EventSidebar component", () => {
    render(<MainLayout><div>content</div></MainLayout>);
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("renders children inside main element", () => {
    render(<MainLayout><div data-testid="child">Hello</div></MainLayout>);
    const main = document.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(main?.contains(screen.getByTestId("child"))).toBe(true);
  });

  it("has full-screen layout with flex column", () => {
    const { container } = render(<MainLayout><div>content</div></MainLayout>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("h-screen");
    expect(root.className).toContain("w-screen");
    expect(root.className).toContain("flex-col");
  });

  it("applies overflow-hidden to prevent scrolling", () => {
    const { container } = render(<MainLayout><div>content</div></MainLayout>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("overflow-hidden");
  });

  it("renders content area with flex-1 to fill remaining space", () => {
    const { container } = render(<MainLayout><div>content</div></MainLayout>);
    const contentWrapper = container.querySelector(".flex-1");
    expect(contentWrapper).toBeInTheDocument();
    expect(contentWrapper?.className).toContain("relative");
  });
});
