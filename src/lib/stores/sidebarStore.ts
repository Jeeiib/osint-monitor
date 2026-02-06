import { create } from "zustand";

type SidebarTab = "articles" | "social";

interface SidebarStore {
  isOpen: boolean;
  activeTab: SidebarTab;
  toggleSidebar: () => void;
  setTab: (tab: SidebarTab) => void;
  open: () => void;
  close: () => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isOpen: true,
  activeTab: "social",

  toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
  setTab: (tab) => set({ activeTab: tab, isOpen: true }),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
