"use client";

import { useEffect } from "react";
import { PanelRightClose, PanelRightOpen, Newspaper, Radio } from "lucide-react";
import { useEventsStore, useSidebarStore } from "@/lib/stores";
import { EventCard } from "./EventCard";

const SIDEBAR_WIDTH = 380;

// OSINT accounts to display in the social feed
const OSINT_ACCOUNTS = [
  { handle: "@IntelCrab", platform: "X", topic: "Global conflicts & military" },
  { handle: "@OSINTdefender", platform: "X", topic: "Ukraine/Russia, Middle East" },
  { handle: "@Liveuamap", platform: "X", topic: "Conflict mapping" },
  { handle: "@TheIntelLab", platform: "X", topic: "Geopolitical intelligence" },
  { handle: "@sentdefender", platform: "X", topic: "Military & defense" },
  { handle: "@GeoConfirmed", platform: "X", topic: "Geolocated events" },
  { handle: "@Flash_news_ua", platform: "Telegram", topic: "Breaking conflict news" },
  { handle: "@intelooperRus", platform: "Telegram", topic: "Russia/Ukraine OSINT" },
];

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

function SocialFeedPlaceholder() {
  return (
    <div className="p-3 space-y-3">
      <div className="rounded-lg border border-white/5 bg-slate-900/40 p-3">
        <p className="text-xs text-slate-400 mb-3">
          Real-time OSINT social feeds — connect your API keys to enable live updates
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="h-2 w-2 rounded-full bg-yellow-500/60 animate-pulse" />
          Awaiting integration
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600 px-1">
          Monitored accounts
        </p>
        {OSINT_ACCOUNTS.map((account) => (
          <div
            key={account.handle}
            className="flex items-center gap-3 rounded-lg border border-white/5 bg-slate-900/30 p-2.5 transition-colors hover:bg-slate-800/50"
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              account.platform === "Telegram" ? "bg-blue-500/10" : "bg-slate-700/50"
            }`}>
              <span className="text-[10px] font-bold text-slate-400">
                {account.platform === "Telegram" ? "TG" : "X"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-300">{account.handle}</p>
              <p className="text-xs text-slate-600 truncate">{account.topic}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EventSidebar() {
  const { isOpen, activeTab, toggleSidebar, setTab } = useSidebarStore();
  const { events, isLoading: eventsLoading, fetchEvents, selectedEventIndex, selectEvent } = useEventsStore();

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

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
            <SocialFeedPlaceholder />
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
