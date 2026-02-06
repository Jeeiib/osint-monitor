import { vi } from "vitest";

// Mock react-map-gl/mapbox components
vi.mock("react-map-gl/mapbox", () => ({
  default: ({ children, ...props }: Record<string, unknown>) => {
    const React = require("react");
    return React.createElement("div", { "data-testid": "map", ...props }, children);
  },
  Map: ({ children, ...props }: Record<string, unknown>) => {
    const React = require("react");
    return React.createElement("div", { "data-testid": "map", ...props }, children);
  },
  Source: ({ children, ...props }: Record<string, unknown>) => {
    const React = require("react");
    return React.createElement("div", { "data-testid": "source", ...props }, children);
  },
  Layer: (props: Record<string, unknown>) => {
    const React = require("react");
    return React.createElement("div", { "data-testid": "layer", ...props });
  },
  Marker: ({ children, ...props }: Record<string, unknown>) => {
    const React = require("react");
    return React.createElement("div", { "data-testid": "marker", ...props }, children);
  },
  Popup: ({ children, ...props }: Record<string, unknown>) => {
    const React = require("react");
    return React.createElement("div", { "data-testid": "popup", ...props }, children);
  },
  NavigationControl: () => {
    const React = require("react");
    return React.createElement("div", { "data-testid": "nav-control" });
  },
}));

// Mock mapbox-gl CSS import
vi.mock("mapbox-gl/dist/mapbox-gl.css", () => ({}));
