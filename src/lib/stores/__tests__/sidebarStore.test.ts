import { describe, it, expect, beforeEach } from "vitest";
import { useSidebarStore } from "../sidebarStore";

describe("sidebarStore", () => {
  beforeEach(() => {
    // Reset to initial state before each test
    useSidebarStore.setState({
      isOpen: true,
      activeTab: "social",
    });
  });

  describe("initial state", () => {
    it("should be open by default", () => {
      const state = useSidebarStore.getState();

      expect(state.isOpen).toBe(true);
    });

    it("should have 'social' as the default active tab", () => {
      const state = useSidebarStore.getState();

      expect(state.activeTab).toBe("social");
    });
  });

  describe("toggleSidebar", () => {
    it("should toggle isOpen from true to false", () => {
      const { toggleSidebar } = useSidebarStore.getState();

      toggleSidebar();

      expect(useSidebarStore.getState().isOpen).toBe(false);
    });

    it("should toggle isOpen from false to true", () => {
      // First set to false
      useSidebarStore.setState({ isOpen: false });

      const { toggleSidebar } = useSidebarStore.getState();

      toggleSidebar();

      expect(useSidebarStore.getState().isOpen).toBe(true);
    });

    it("should toggle multiple times correctly", () => {
      const { toggleSidebar } = useSidebarStore.getState();

      toggleSidebar(); // true -> false
      expect(useSidebarStore.getState().isOpen).toBe(false);

      toggleSidebar(); // false -> true
      expect(useSidebarStore.getState().isOpen).toBe(true);

      toggleSidebar(); // true -> false
      expect(useSidebarStore.getState().isOpen).toBe(false);
    });
  });

  describe("setTab", () => {
    it("should change active tab to 'articles'", () => {
      const { setTab } = useSidebarStore.getState();

      setTab("articles");

      expect(useSidebarStore.getState().activeTab).toBe("articles");
    });

    it("should change active tab to 'social'", () => {
      // First set to articles
      useSidebarStore.setState({ activeTab: "articles" });

      const { setTab } = useSidebarStore.getState();

      setTab("social");

      expect(useSidebarStore.getState().activeTab).toBe("social");
    });

    it("should open the sidebar when changing tab", () => {
      // First close the sidebar
      useSidebarStore.setState({ isOpen: false });

      const { setTab } = useSidebarStore.getState();

      setTab("articles");

      const state = useSidebarStore.getState();
      expect(state.isOpen).toBe(true);
      expect(state.activeTab).toBe("articles");
    });

    it("should keep sidebar open if already open", () => {
      const { setTab } = useSidebarStore.getState();

      setTab("articles");

      const state = useSidebarStore.getState();
      expect(state.isOpen).toBe(true);
      expect(state.activeTab).toBe("articles");
    });
  });

  describe("open", () => {
    it("should set isOpen to true", () => {
      // First close the sidebar
      useSidebarStore.setState({ isOpen: false });

      const { open } = useSidebarStore.getState();

      open();

      expect(useSidebarStore.getState().isOpen).toBe(true);
    });

    it("should keep isOpen true if already open", () => {
      const { open } = useSidebarStore.getState();

      open();

      expect(useSidebarStore.getState().isOpen).toBe(true);
    });
  });

  describe("close", () => {
    it("should set isOpen to false", () => {
      const { close } = useSidebarStore.getState();

      close();

      expect(useSidebarStore.getState().isOpen).toBe(false);
    });

    it("should keep isOpen false if already closed", () => {
      // First close the sidebar
      useSidebarStore.setState({ isOpen: false });

      const { close } = useSidebarStore.getState();

      close();

      expect(useSidebarStore.getState().isOpen).toBe(false);
    });
  });
});
