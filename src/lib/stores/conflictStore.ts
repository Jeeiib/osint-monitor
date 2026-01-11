import { create } from "zustand";
import type { Conflict } from "@/types/conflict";

interface ConflictStore {
  conflicts: Conflict[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  fetchConflicts: () => Promise<void>;
}

export const useConflictStore = create<ConflictStore>((set) => ({
  conflicts: [],
  isLoading: false,
  error: null,
  lastUpdate: null,

  fetchConflicts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/conflicts");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      set({ conflicts: data, isLoading: false, lastUpdate: new Date() });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));
