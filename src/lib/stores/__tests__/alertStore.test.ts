import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAlertStore } from "../alertStore";
import type { Earthquake } from "@/types/earthquake";
import type { GdeltArticle } from "@/types/gdelt";
import type { SocialPost } from "@/types/social";

// Mock toast to avoid side effects
vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

// Mock alertSound
vi.mock("@/lib/utils/alertSound", () => ({
  playAlertSound: vi.fn(),
}));

function makeEarthquake(overrides: Partial<Earthquake> = {}): Earthquake {
  return {
    id: `eq-${Math.random().toString(36).slice(2)}`,
    magnitude: 5.0,
    place: "Test Location",
    time: Date.now(),
    latitude: 35.0,
    longitude: 139.0,
    depth: 10,
    url: "https://earthquake.usgs.gov/test",
    felt: null,
    significance: 500,
    ...overrides,
  };
}

function makeEvent(overrides: Partial<GdeltArticle> = {}): GdeltArticle {
  return {
    title: "Test Article",
    url: `https://example.com/${Math.random().toString(36).slice(2)}`,
    image: "",
    sourceDomain: "example.com",
    latitude: 35.0,
    longitude: 139.0,
    locationName: "Test",
    count: 1,
    shareImage: "",
    ...overrides,
  };
}

function makePost(overrides: Partial<SocialPost> = {}): SocialPost {
  return {
    id: `post-${Math.random().toString(36).slice(2)}`,
    author: "TestUser",
    authorHandle: "@testuser.bsky.social",
    platform: "bluesky",
    content: "Some normal OSINT content",
    url: "https://bsky.app/test",
    timestamp: new Date(),
    topic: "conflict",
    likeCount: 10,
    repostCount: 5,
    ...overrides,
  };
}

function resetStore() {
  useAlertStore.setState({
    alerts: [],
    unreadCount: 0,
    isMuted: false,
    isPanelOpen: false,
    _seenEarthquakeIds: new Set(),
    _seenEventUrls: new Set(),
    _seenSocialIds: new Set(),
    _accountAverages: new Map(),
    _accountHistory: new Map(),
    _initialized: { earthquake: false, event: false, social: false },
  });
}

describe("alertStore", () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should start with empty alerts", () => {
      const state = useAlertStore.getState();
      expect(state.alerts).toEqual([]);
      expect(state.unreadCount).toBe(0);
    });

    it("should start unmuted", () => {
      expect(useAlertStore.getState().isMuted).toBe(false);
    });

    it("should start with panel closed", () => {
      expect(useAlertStore.getState().isPanelOpen).toBe(false);
    });

    it("should have all sources uninitialized", () => {
      const state = useAlertStore.getState();
      expect(state._initialized).toEqual({
        earthquake: false,
        event: false,
        social: false,
      });
    });
  });

  describe("addAlert", () => {
    it("should add an alert and increment unread count", () => {
      useAlertStore.getState().addAlert({
        title: "Test",
        description: "Test alert",
        severity: "high",
        source: "earthquake",
      });

      const state = useAlertStore.getState();
      expect(state.alerts).toHaveLength(1);
      expect(state.unreadCount).toBe(1);
      expect(state.alerts[0].read).toBe(false);
    });

    it("should cap alerts at 50", () => {
      for (let i = 0; i < 60; i++) {
        useAlertStore.getState().addAlert({
          title: `Alert ${i}`,
          description: "Test",
          severity: "medium",
          source: "event",
        });
      }

      expect(useAlertStore.getState().alerts).toHaveLength(50);
    });

    it("should put newest alerts first", () => {
      useAlertStore.getState().addAlert({
        title: "First",
        description: "First",
        severity: "medium",
        source: "event",
      });
      useAlertStore.getState().addAlert({
        title: "Second",
        description: "Second",
        severity: "medium",
        source: "event",
      });

      const alerts = useAlertStore.getState().alerts;
      expect(alerts[0].title).toBe("Second");
      expect(alerts[1].title).toBe("First");
    });
  });

  describe("markAsRead / markAllAsRead", () => {
    it("should mark a single alert as read", () => {
      useAlertStore.getState().addAlert({
        title: "Test",
        description: "Test",
        severity: "high",
        source: "earthquake",
      });

      const alertId = useAlertStore.getState().alerts[0].id;
      useAlertStore.getState().markAsRead(alertId);

      const state = useAlertStore.getState();
      expect(state.alerts[0].read).toBe(true);
      expect(state.unreadCount).toBe(0);
    });

    it("should mark all alerts as read", () => {
      useAlertStore.getState().addAlert({ title: "A", description: "", severity: "high", source: "earthquake" });
      useAlertStore.getState().addAlert({ title: "B", description: "", severity: "medium", source: "event" });

      useAlertStore.getState().markAllAsRead();

      const state = useAlertStore.getState();
      expect(state.unreadCount).toBe(0);
      expect(state.alerts.every((a) => a.read)).toBe(true);
    });
  });

  describe("dismissAlert", () => {
    it("should remove the alert from the list", () => {
      useAlertStore.getState().addAlert({ title: "Test", description: "", severity: "high", source: "earthquake" });
      const alertId = useAlertStore.getState().alerts[0].id;

      useAlertStore.getState().dismissAlert(alertId);

      expect(useAlertStore.getState().alerts).toHaveLength(0);
    });

    it("should decrement unread count if dismissed alert was unread", () => {
      useAlertStore.getState().addAlert({ title: "Test", description: "", severity: "high", source: "earthquake" });
      const alertId = useAlertStore.getState().alerts[0].id;

      useAlertStore.getState().dismissAlert(alertId);

      expect(useAlertStore.getState().unreadCount).toBe(0);
    });
  });

  describe("toggleMute / togglePanel", () => {
    it("should toggle mute", () => {
      useAlertStore.getState().toggleMute();
      expect(useAlertStore.getState().isMuted).toBe(true);
      useAlertStore.getState().toggleMute();
      expect(useAlertStore.getState().isMuted).toBe(false);
    });

    it("should toggle panel", () => {
      useAlertStore.getState().togglePanel();
      expect(useAlertStore.getState().isPanelOpen).toBe(true);
      useAlertStore.getState().togglePanel();
      expect(useAlertStore.getState().isPanelOpen).toBe(false);
    });
  });

  // ── Earthquake detection ──────────────────────────────────────

  describe("checkEarthquakes", () => {
    it("should seed on first call without generating alerts", () => {
      const quakes = [makeEarthquake({ id: "eq1", magnitude: 7.5 })];

      useAlertStore.getState().checkEarthquakes(quakes);

      const state = useAlertStore.getState();
      expect(state._initialized.earthquake).toBe(true);
      expect(state.alerts).toHaveLength(0);
      expect(state._seenEarthquakeIds.has("eq1")).toBe(true);
    });

    it("should alert on new M7+ earthquake (critical)", () => {
      // Seed
      useAlertStore.getState().checkEarthquakes([makeEarthquake({ id: "eq1" })]);

      // New M7.2 quake
      const quakes = [
        makeEarthquake({ id: "eq1" }),
        makeEarthquake({ id: "eq2", magnitude: 7.2, place: "Pacific Ocean" }),
      ];
      useAlertStore.getState().checkEarthquakes(quakes);

      const alerts = useAlertStore.getState().alerts;
      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe("critical");
      expect(alerts[0].title).toContain("7.2");
    });

    it("should alert on new M6.0-6.9 earthquake (high)", () => {
      useAlertStore.getState().checkEarthquakes([makeEarthquake({ id: "eq1" })]);

      const quakes = [
        makeEarthquake({ id: "eq1" }),
        makeEarthquake({ id: "eq2", magnitude: 6.5 }),
      ];
      useAlertStore.getState().checkEarthquakes(quakes);

      const alerts = useAlertStore.getState().alerts;
      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe("high");
    });

    it("should NOT alert on M5.9 earthquake", () => {
      useAlertStore.getState().checkEarthquakes([makeEarthquake({ id: "eq1" })]);

      const quakes = [
        makeEarthquake({ id: "eq1" }),
        makeEarthquake({ id: "eq2", magnitude: 5.9 }),
      ];
      useAlertStore.getState().checkEarthquakes(quakes);

      expect(useAlertStore.getState().alerts).toHaveLength(0);
    });

    it("should not alert on the same earthquake twice", () => {
      useAlertStore.getState().checkEarthquakes([makeEarthquake({ id: "eq1" })]);

      const bigQuake = makeEarthquake({ id: "eq2", magnitude: 7.0 });
      useAlertStore.getState().checkEarthquakes([makeEarthquake({ id: "eq1" }), bigQuake]);
      useAlertStore.getState().checkEarthquakes([makeEarthquake({ id: "eq1" }), bigQuake]);

      expect(useAlertStore.getState().alerts).toHaveLength(1);
    });
  });

  // ── GDELT events detection ────────────────────────────────────

  describe("checkEvents", () => {
    it("should seed on first call without generating alerts", () => {
      const events = [makeEvent({ url: "https://example.com/1" })];
      useAlertStore.getState().checkEvents(events);

      const state = useAlertStore.getState();
      expect(state._initialized.event).toBe(true);
      expect(state.alerts).toHaveLength(0);
    });

    it("should alert when new articles appear", () => {
      useAlertStore.getState().checkEvents([makeEvent({ url: "https://example.com/1" })]);

      useAlertStore.getState().checkEvents([
        makeEvent({ url: "https://example.com/1" }),
        makeEvent({ url: "https://example.com/2", title: "New Article" }),
      ]);

      const alerts = useAlertStore.getState().alerts;
      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe("medium");
      expect(alerts[0].source).toBe("event");
    });

    it("should not alert when no new articles", () => {
      const events = [makeEvent({ url: "https://example.com/1" })];
      useAlertStore.getState().checkEvents(events);
      useAlertStore.getState().checkEvents(events);

      expect(useAlertStore.getState().alerts).toHaveLength(0);
    });
  });

  // ── Social posts detection ────────────────────────────────────

  describe("checkSocialPosts", () => {
    it("should seed on first call without generating alerts", () => {
      const posts = [makePost({ id: "p1", content: "BREAKING news" })];
      useAlertStore.getState().checkSocialPosts(posts);

      const state = useAlertStore.getState();
      expect(state._initialized.social).toBe(true);
      expect(state.alerts).toHaveLength(0);
    });

    it("should seed rolling averages from initial posts", () => {
      const posts = [
        makePost({ id: "p1", authorHandle: "@alice", likeCount: 100, repostCount: 20 }),
        makePost({ id: "p2", authorHandle: "@alice", likeCount: 80, repostCount: 20 }),
      ];
      useAlertStore.getState().checkSocialPosts(posts);

      const avg = useAlertStore.getState()._accountAverages.get("@alice");
      // (120 + 100) / 2 = 110
      expect(avg).toBe(110);
    });

    it("should alert on critical keywords in new posts", () => {
      useAlertStore.getState().checkSocialPosts([makePost({ id: "p1" })]);

      useAlertStore.getState().checkSocialPosts([
        makePost({ id: "p1" }),
        makePost({ id: "p2", content: "BREAKING: missile strike on Kyiv" }),
      ]);

      const alerts = useAlertStore.getState().alerts;
      // Should match "breaking", "missile", "strike" — but deduplicating per post, it's 1 alert per keyword check
      expect(alerts.length).toBeGreaterThanOrEqual(1);
      expect(alerts.some((a) => a.severity === "high")).toBe(true);
    });

    it("should alert on engagement spike (3x rolling avg)", () => {
      // Seed with low engagement
      const seedPosts = Array.from({ length: 5 }, (_, i) =>
        makePost({ id: `seed-${i}`, authorHandle: "@lowavg", likeCount: 10, repostCount: 5 })
      );
      useAlertStore.getState().checkSocialPosts(seedPosts);

      // avg = 15, so 3x = 45. Post with 50 engagement should trigger
      useAlertStore.getState().checkSocialPosts([
        ...seedPosts,
        makePost({ id: "viral", authorHandle: "@lowavg", likeCount: 40, repostCount: 10, content: "Normal looking post" }),
      ]);

      const alerts = useAlertStore.getState().alerts;
      expect(alerts.some((a) => a.title.startsWith("Viral:"))).toBe(true);
    });

    it("should NOT alert on engagement below 3x threshold", () => {
      const seedPosts = Array.from({ length: 5 }, (_, i) =>
        makePost({ id: `seed-${i}`, authorHandle: "@highavg", likeCount: 100, repostCount: 50 })
      );
      useAlertStore.getState().checkSocialPosts(seedPosts);

      // avg = 150, threshold = 450. Post with 200 should NOT trigger
      useAlertStore.getState().checkSocialPosts([
        ...seedPosts,
        makePost({ id: "normal", authorHandle: "@highavg", likeCount: 150, repostCount: 50, content: "Regular post" }),
      ]);

      const alerts = useAlertStore.getState().alerts;
      expect(alerts.some((a) => a.title.startsWith("Viral:"))).toBe(false);
    });

    it("should alert on multi-source correlation (3+ handles mention same term)", () => {
      useAlertStore.getState().checkSocialPosts([makePost({ id: "seed" })]);

      const newPosts = [
        makePost({ id: "p1", authorHandle: "@handle1", content: "Explosion in Kharkiv confirmed" }),
        makePost({ id: "p2", authorHandle: "@handle2", content: "Reports of Kharkiv strike" }),
        makePost({ id: "p3", authorHandle: "@handle3", content: "Kharkiv under attack" }),
      ];
      useAlertStore.getState().checkSocialPosts([makePost({ id: "seed" }), ...newPosts]);

      const alerts = useAlertStore.getState().alerts;
      expect(alerts.some((a) => a.severity === "critical" && a.title.includes("Kharkiv"))).toBe(true);
    });

    it("should NOT trigger multi-source for < 3 handles", () => {
      useAlertStore.getState().checkSocialPosts([makePost({ id: "seed" })]);

      const newPosts = [
        makePost({ id: "p1", authorHandle: "@handle1", content: "Reports from Damascus" }),
        makePost({ id: "p2", authorHandle: "@handle2", content: "Damascus situation" }),
      ];
      useAlertStore.getState().checkSocialPosts([makePost({ id: "seed" }), ...newPosts]);

      const alerts = useAlertStore.getState().alerts;
      expect(alerts.some((a) => a.severity === "critical" && a.title.includes("Damascus"))).toBe(false);
    });
  });
});
