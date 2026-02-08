import { create } from "zustand";
import type { Alert, AlertSeverity, AlertSource } from "@/types/alert";
import type { Earthquake } from "@/types/earthquake";
import type { GdeltArticle } from "@/types/gdelt";
import type { SocialPost } from "@/types/social";
import { toast } from "@/hooks/use-toast";
import { playAlertSound } from "@/lib/utils/alertSound";

const MAX_ALERTS = 50;
const ROLLING_WINDOW = 20;

/** Keywords that trigger a high-severity social alert */
const CRITICAL_KEYWORDS = [
  "breaking",
  "confirmed",
  "strike",
  "explosion",
  "attack",
  "missile",
];

/** Regex for extracting proper nouns / place names from text */
const PROPER_NOUN_RE = /\b[A-Z][a-z]{2,}\b/g;

/** Country names to boost correlation matching */
const COUNTRY_NAMES = new Set([
  "Ukraine", "Russia", "Israel", "Gaza", "Palestine", "Iran", "Syria",
  "Lebanon", "Yemen", "Taiwan", "China", "Korea", "Myanmar", "Sudan",
  "Libya", "Somalia", "Mali", "Niger", "Ethiopia", "Eritrea",
]);

interface AlertStore {
  alerts: Alert[];
  unreadCount: number;
  isMuted: boolean;
  isPanelOpen: boolean;
  _seenEarthquakeIds: Set<string>;
  _seenEventUrls: Set<string>;
  _seenSocialIds: Set<string>;
  _accountAverages: Map<string, number>;
  _accountHistory: Map<string, number[]>;
  _initialized: Record<AlertSource, boolean>;

  addAlert: (alert: Omit<Alert, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissAlert: (id: string) => void;
  toggleMute: () => void;
  togglePanel: () => void;
  closePanel: () => void;
  requestDesktopPermission: () => void;
  checkEarthquakes: (quakes: Earthquake[]) => void;
  checkEvents: (events: GdeltArticle[]) => void;
  checkSocialPosts: (posts: SocialPost[]) => void;
  triggerTestAlert: (type: "earthquake" | "event" | "social") => void;
}

let alertCounter = 0;

function generateAlertId(): string {
  alertCounter += 1;
  return `alert-${Date.now()}-${alertCounter}`;
}

function sendDesktopNotification(title: string, body: string): void {
  if (
    typeof window === "undefined" ||
    typeof Notification === "undefined" ||
    Notification.permission !== "granted" ||
    document.hasFocus()
  ) {
    return;
  }

  try {
    new Notification(title, { body, icon: "/favicon.ico" });
  } catch {
    // Desktop notifications not supported
  }
}

function severityToVariant(severity: AlertSeverity): "default" | "destructive" {
  return severity === "critical" ? "destructive" : "default";
}

export const useAlertStore = create<AlertStore>((set, get) => ({
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

  addAlert: (partial) => {
    const alert: Alert = {
      ...partial,
      id: generateAlertId(),
      timestamp: new Date(),
      read: false,
    };

    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, MAX_ALERTS),
      unreadCount: state.unreadCount + 1,
    }));

    // Side effects
    const severityLabel =
      alert.severity === "critical" ? "CRITICAL" :
      alert.severity === "high" ? "HIGH" : "MEDIUM";

    toast({
      title: `[${severityLabel}] ${alert.title}`,
      description: alert.description,
      variant: severityToVariant(alert.severity),
    });

    if (!get().isMuted) {
      playAlertSound(alert.severity);
    }

    sendDesktopNotification(`[${severityLabel}] ${alert.title}`, alert.description);
  },

  markAsRead: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
      unreadCount: Math.max(0, state.unreadCount - (state.alerts.find((a) => a.id === id && !a.read) ? 1 : 0)),
    })),

  markAllAsRead: () =>
    set((state) => ({
      alerts: state.alerts.map((a) => ({ ...a, read: true })),
      unreadCount: 0,
    })),

  dismissAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
      unreadCount: state.unreadCount - (state.alerts.find((a) => a.id === id && !a.read) ? 1 : 0),
    })),

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  closePanel: () => set({ isPanelOpen: false }),

  requestDesktopPermission: () => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  },

  // ── Earthquake detection ──────────────────────────────────────

  checkEarthquakes: (quakes) => {
    const state = get();
    const seen = state._seenEarthquakeIds;

    if (!state._initialized.earthquake) {
      // Seed: record all current IDs without alerting
      const allIds = new Set(quakes.map((q) => q.id));
      set((s) => ({
        _seenEarthquakeIds: allIds,
        _initialized: { ...s._initialized, earthquake: true },
      }));
      return;
    }

    const newQuakes = quakes.filter((q) => !seen.has(q.id));
    if (newQuakes.length === 0) return;

    // Update seen set
    const updatedSeen = new Set(seen);
    for (const q of newQuakes) {
      updatedSeen.add(q.id);
    }
    set({ _seenEarthquakeIds: updatedSeen });

    // Alert on significant quakes
    for (const q of newQuakes) {
      let severity: AlertSeverity | null = null;
      if (q.magnitude >= 7.0) severity = "critical";
      else if (q.magnitude >= 6.0) severity = "high";

      if (severity) {
        state.addAlert({
          title: `M${q.magnitude.toFixed(1)} Earthquake`,
          description: q.place,
          severity,
          source: "earthquake",
          url: q.url,
          coordinates: { latitude: q.latitude, longitude: q.longitude },
        });
      }
    }
  },

  // ── GDELT events detection ────────────────────────────────────

  checkEvents: (events) => {
    const state = get();
    const seen = state._seenEventUrls;

    if (!state._initialized.event) {
      const allUrls = new Set(events.map((e) => e.url));
      set((s) => ({
        _seenEventUrls: allUrls,
        _initialized: { ...s._initialized, event: true },
      }));
      return;
    }

    const newEvents = events.filter((e) => !seen.has(e.url));
    if (newEvents.length === 0) return;

    const updatedSeen = new Set(seen);
    for (const e of newEvents) {
      updatedSeen.add(e.url);
    }
    set({ _seenEventUrls: updatedSeen });

    // One alert per batch of new articles
    if (newEvents.length > 0) {
      state.addAlert({
        title: `${newEvents.length} new article${newEvents.length > 1 ? "s" : ""}`,
        description: newEvents[0].title,
        severity: "medium",
        source: "event",
        url: newEvents[0].url,
        coordinates: newEvents[0].latitude
          ? { latitude: newEvents[0].latitude, longitude: newEvents[0].longitude }
          : undefined,
      });
    }
  },

  // ── Social posts detection ────────────────────────────────────

  checkSocialPosts: (posts) => {
    const state = get();
    const seen = state._seenSocialIds;

    if (!state._initialized.social) {
      const allIds = new Set(posts.map((p) => p.id));
      // Seed rolling averages from initial posts
      const historyMap = new Map(state._accountHistory);
      const avgMap = new Map(state._accountAverages);
      for (const p of posts) {
        const engagement = (p.likeCount ?? 0) + (p.repostCount ?? 0);
        const history = historyMap.get(p.authorHandle) ?? [];
        history.push(engagement);
        historyMap.set(p.authorHandle, history.slice(-ROLLING_WINDOW));
        avgMap.set(
          p.authorHandle,
          history.reduce((a, b) => a + b, 0) / history.length
        );
      }
      set((s) => ({
        _seenSocialIds: allIds,
        _accountAverages: avgMap,
        _accountHistory: historyMap,
        _initialized: { ...s._initialized, social: true },
      }));
      return;
    }

    const newPosts = posts.filter((p) => !seen.has(p.id));
    if (newPosts.length === 0) return;

    // Update seen set
    const updatedSeen = new Set(seen);
    for (const p of newPosts) {
      updatedSeen.add(p.id);
    }

    // Update rolling averages
    const historyMap = new Map(state._accountHistory);
    const avgMap = new Map(state._accountAverages);
    for (const p of newPosts) {
      const engagement = (p.likeCount ?? 0) + (p.repostCount ?? 0);
      const history = historyMap.get(p.authorHandle) ?? [];
      history.push(engagement);
      historyMap.set(p.authorHandle, history.slice(-ROLLING_WINDOW));
      avgMap.set(
        p.authorHandle,
        history.reduce((a, b) => a + b, 0) / history.length
      );
    }

    set({
      _seenSocialIds: updatedSeen,
      _accountAverages: avgMap,
      _accountHistory: historyMap,
    });

    // ── Check 1: Critical keywords ──
    for (const p of newPosts) {
      const lower = p.content.toLowerCase();
      const matched = CRITICAL_KEYWORDS.some((kw) => lower.includes(kw));
      if (matched) {
        state.addAlert({
          title: `OSINT: ${p.author}`,
          description: p.content.slice(0, 200),
          severity: "high",
          source: "social",
          url: p.url,
        });
      }
    }

    // ── Check 2: Engagement spike (3x rolling avg) ──
    for (const p of newPosts) {
      const engagement = (p.likeCount ?? 0) + (p.repostCount ?? 0);
      const avg = state._accountAverages.get(p.authorHandle) ?? 0;
      if (avg > 0 && engagement >= 3 * avg) {
        state.addAlert({
          title: `Viral: ${p.author}`,
          description: p.content.slice(0, 200),
          severity: "high",
          source: "social",
          url: p.url,
        });
      }
    }

    // ── Check 3: Multi-source correlation ──
    // Extract proper nouns from new posts, group by term
    // Extract proper nouns from new posts, group by term
    const termToHandles = new Map<string, Set<string>>();
    for (const p of newPosts) {
      const matches = p.content.match(PROPER_NOUN_RE) ?? [];
      const terms = new Set(matches);
      // Boost country names
      for (const country of COUNTRY_NAMES) {
        if (p.content.includes(country)) terms.add(country);
      }
      for (const term of terms) {
        const handles = termToHandles.get(term) ?? new Set();
        handles.add(p.authorHandle);
        termToHandles.set(term, handles);
      }
    }

    for (const [term, handles] of termToHandles) {
      if (handles.size >= 3) {
        state.addAlert({
          title: `Multi-source: "${term}"`,
          description: `Mentioned by ${handles.size} accounts: ${[...handles].join(", ")}`,
          severity: "critical",
          source: "social",
        });
      }
    }
  },

  // ── Dev-only: trigger a test alert ─────────────────────────────
  triggerTestAlert: (type) => {
    const { addAlert } = get();

    const testAlerts: Record<string, Omit<Alert, "id" | "timestamp" | "read">> = {
      earthquake: {
        title: "M7.2 Earthquake",
        description: "120km SW of Tonga Islands",
        severity: "critical",
        source: "earthquake",
        url: "https://earthquake.usgs.gov",
        coordinates: { latitude: -21.2, longitude: -175.2 },
      },
      event: {
        title: "3 new articles",
        description: "Ukraine confirms counter-offensive in Kherson region",
        severity: "medium",
        source: "event",
        url: "https://news.google.com",
        coordinates: { latitude: 46.6, longitude: 32.6 },
      },
      social: {
        title: "OSINT: @IntelCrab",
        description: "BREAKING: Multiple explosions reported in southern Beirut, large plumes of smoke visible",
        severity: "high",
        source: "social",
        url: "https://bsky.app",
      },
    };

    const alert = testAlerts[type];
    if (alert) addAlert(alert);
  },
}));
