import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("merges conflicting Tailwind classes (last wins)", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("handles undefined and null inputs", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("handles empty call", () => {
    expect(cn()).toBe("");
  });

  it("handles arrays of classes", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
  });
});
