import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { SocialPost } from "@/types/social";

interface SocialStore {
  posts: SocialPost[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  fetchPosts: (lang?: string) => Promise<void>;
}

export const useSocialStore = create<SocialStore>()(
  subscribeWithSelector((set) => ({
    posts: [],
    isLoading: false,
    error: null,
    lastUpdate: null,

    fetchPosts: async (lang = "fr") => {
      set({ isLoading: true, error: null });
      try {
        const response = await fetch(`/api/social?lang=${lang}`);
        if (!response.ok) throw new Error("Failed to fetch social feed");
        const data = await response.json();
        // Re-hydrate timestamps from JSON strings
        const posts = data.map((post: SocialPost) => ({
          ...post,
          timestamp: new Date(post.timestamp),
        }));
        set({ posts, isLoading: false, lastUpdate: new Date() });
      } catch {
        set({ isLoading: false });
      }
    },
  }))
);
