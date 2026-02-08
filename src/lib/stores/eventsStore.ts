import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { GdeltArticle } from "@/types/gdelt";

interface EventsStore {
  events: GdeltArticle[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  selectedEventIndex: number | null;
  fetchEvents: (lang?: string) => Promise<void>;
  selectEvent: (index: number | null) => void;
}

export const useEventsStore = create<EventsStore>()(
  subscribeWithSelector((set) => ({
    events: [],
    isLoading: false,
    error: null,
    lastUpdate: null,
    selectedEventIndex: null,

    fetchEvents: async (lang = "fr") => {
      set({ isLoading: true, error: null });
      try {
        const response = await fetch(`/api/events?lang=${lang}`);
        if (!response.ok) throw new Error("Failed to fetch events");
        const data = await response.json();
        set({ events: data, isLoading: false, lastUpdate: new Date() });
      } catch {
        set({ isLoading: false });
      }
    },

    selectEvent: (index) => set({ selectedEventIndex: index }),
  }))
);
