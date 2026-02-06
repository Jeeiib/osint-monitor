"use client";

import { useEffect } from "react";
import { PanelRightClose, PanelRightOpen, Newspaper, Radio } from "lucide-react";
import { useEventsStore, useSidebarStore, useSocialStore } from "@/lib/stores";
import { EventCard } from "./EventCard";
import { SocialPostCard } from "./SocialPostCard";

const SIDEBAR_WIDTH = 380;

function LoadingSkeleton() {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-white/5 bg-slate-900/40 p-3">
          <div className="mb-2 h-28 w-full animate-pulse rounded bg-slate-800" />
          <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-slate-800" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

function SocialFeedContent() {
  const { posts, isLoading } = useSocialStore();

  if (isLoading && posts.length === 0) {
    return <LoadingSkeleton />;
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <Radio className="mb-2 h-8 w-8 opacity-30" />
        <p className="text-sm">No posts yet</p>
        <p className="mt-1 text-xs text-slate-600">Feed updates every 5 minutes</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3">
      {posts.map((post) => (
        <SocialPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

export function EventSidebar() {
  const { isOpen, activeTab, toggleSidebar, setTab } = useSidebarStore();
  const { events, isLoading: eventsLoading, fetchEvents, selectedEventIndex, selectEvent } = useEventsStore();
  const { fetchPosts: fetchSocialPosts } = useSocialStore();

  useEffect(() => {
    fetchEvents();
    fetchSocialPosts();
    const eventsInterval = setInterval(fetchEvents, 10 * 60 * 1000);
    const socialInterval = setInterval(fetchSocialPosts, 5 * 60 * 1000);
    return () => {
      clearInterval(eventsInterval);
      clearInterval(socialInterval);
    };
  }, [fetchEvents, fetchSocialPosts]);

  const tabs = [
    { id: "social" as const, label: "Social Feed", Icon: Radio, color: "emerald" },
    { id: "articles" as const, label: "Articles", Icon: Newspaper, count: events.length, color: "red" },
  ];

  return (
    <>
      {/* Toggle button — visible when sidebar is closed */}
      <button
        onClick={toggleSidebar}
        className={`absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 backdrop-blur-md transition-all duration-300 hover:bg-slate-800 ${
          isOpen ? "pointer-events-none translate-x-4 opacity-0" : "translate-x-0 opacity-100"
        }`}
      >
        <PanelRightOpen className="h-4 w-4 text-slate-400" />
      </button>

      {/* Sidebar — absolute overlay, slides from right */}
      <aside
        className="absolute right-0 top-0 z-10 flex h-full flex-col border-l border-white/5 bg-slate-950/95 backdrop-blur-xl transition-transform duration-300 ease-in-out"
        style={{
          width: SIDEBAR_WIDTH,
          transform: isOpen ? "translateX(0)" : `translateX(100%)`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-slate-300">Intelligence Feed</h2>
          <button
            onClick={toggleSidebar}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                  isActive
                    ? tab.color === "red"
                      ? "text-red-400 border-b-2 border-red-500"
                      : "text-emerald-400 border-b-2 border-emerald-500"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <tab.Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    isActive
                      ? "bg-red-500/20 text-red-400"
                      : "bg-slate-800 text-slate-500"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {activeTab === "social" && (
            <SocialFeedContent />
          )}

          {activeTab === "articles" && (
            eventsLoading ? (
              <LoadingSkeleton />
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Newspaper className="mb-2 h-8 w-8 opacity-30" />
                <p className="text-sm">No articles yet</p>
                <p className="mt-1 text-xs text-slate-600">Click a red dot on the map</p>
              </div>
            ) : (
              <div className="space-y-2 p-3">
                {events.map((event, i) => (
                  <EventCard
                    key={`${event.latitude}-${event.longitude}-${i}`}
                    event={event}
                    index={i}
                    isSelected={selectedEventIndex === i}
                    onSelect={selectEvent}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </aside>
    </>
  );
}
