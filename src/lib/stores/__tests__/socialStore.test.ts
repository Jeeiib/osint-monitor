import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSocialStore } from "../socialStore";

describe("socialStore", () => {
  beforeEach(() => {
    useSocialStore.setState({
      posts: [],
      isLoading: false,
      error: null,
      lastUpdate: null,
    });
    vi.resetAllMocks();
  });

  describe("initial state", () => {
    it("should have empty posts array", () => {
      expect(useSocialStore.getState().posts).toEqual([]);
    });

    it("should not be loading", () => {
      expect(useSocialStore.getState().isLoading).toBe(false);
    });

    it("should have no error", () => {
      expect(useSocialStore.getState().error).toBeNull();
    });

    it("should have no lastUpdate", () => {
      expect(useSocialStore.getState().lastUpdate).toBeNull();
    });
  });

  describe("fetchPosts", () => {
    it("should set isLoading to true when starting fetch", async () => {
      global.fetch = vi.fn(() => new Promise(() => {}));

      const fetchPromise = useSocialStore.getState().fetchPosts();

      expect(useSocialStore.getState().isLoading).toBe(true);
      expect(useSocialStore.getState().error).toBeNull();

      await Promise.race([fetchPromise, new Promise((r) => setTimeout(r, 10))]);
    });

    it("should fetch and store posts with hydrated timestamps", async () => {
      const mockPosts = [
        {
          id: "post-1",
          author: "IntelCrab",
          authorHandle: "@IntelCrab",
          platform: "x",
          content: "Breaking news",
          url: "https://twitter.com/1",
          timestamp: "2026-02-06T12:00:00.000Z",
          topic: "conflict",
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockPosts,
      });

      await useSocialStore.getState().fetchPosts();

      const state = useSocialStore.getState();
      expect(state.posts).toHaveLength(1);
      expect(state.posts[0].timestamp).toBeInstanceOf(Date);
      expect(state.posts[0].timestamp.toISOString()).toBe("2026-02-06T12:00:00.000Z");
      expect(state.isLoading).toBe(false);
      expect(state.lastUpdate).toBeInstanceOf(Date);
    });

    it("should call the correct API endpoint", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await useSocialStore.getState().fetchPosts();

      expect(global.fetch).toHaveBeenCalledWith("/api/social");
    });

    it("should handle HTTP errors silently", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await useSocialStore.getState().fetchPosts();

      const state = useSocialStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.posts).toEqual([]);
      expect(state.lastUpdate).toBeNull();
    });

    it("should handle network errors silently", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      await useSocialStore.getState().fetchPosts();

      const state = useSocialStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.posts).toEqual([]);
    });

    it("should clear error before fetching", async () => {
      useSocialStore.setState({ error: "Previous error" });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await useSocialStore.getState().fetchPosts();

      expect(useSocialStore.getState().error).toBeNull();
    });
  });
});
