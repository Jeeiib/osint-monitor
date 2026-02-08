"use client";

import { Settings, Bell, BellOff, Bug } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEventsStore, useEarthquakeStore, useAircraftStore, useAlertStore } from "@/lib/stores";
import { AlertPanel } from "@/components/alerts/AlertPanel";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function Header() {
  const t = useTranslations("header");
  const { events, isLoading: eventsLoading } = useEventsStore();
  const { earthquakes, isLoading: quakesLoading } = useEarthquakeStore();
  const { aircraft } = useAircraftStore();

  const unreadCount = useAlertStore((s) => s.unreadCount);
  const isMuted = useAlertStore((s) => s.isMuted);
  const toggleMute = useAlertStore((s) => s.toggleMute);
  const togglePanel = useAlertStore((s) => s.togglePanel);
  const triggerTestAlert = useAlertStore((s) => s.triggerTestAlert);

  const isDev = process.env.NODE_ENV === "development";

  const significantQuakes = earthquakes.filter((eq) => eq.magnitude >= 5.5);

  return (
    <header className="relative z-20 flex h-10 items-center justify-between border-b border-white/5 bg-slate-900/60 px-4 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-red-600">
          <span className="text-[10px] font-bold">OS</span>
        </div>
        <span className="text-sm font-semibold text-slate-300">{t("title")}</span>
      </div>

      {/* Stats + Actions */}
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          {eventsLoading ? "..." : t("events", { count: events.length })}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          {quakesLoading ? "..." : t("quakes", { count: significantQuakes.length })}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          {t("aircraft", { count: aircraft.length })}
        </span>

        {/* Dev: test alerts */}
        {isDev && (
          <div className="flex items-center gap-0.5 rounded border border-dashed border-yellow-500/30 px-1">
            <Bug className="h-3 w-3 text-yellow-500/60" />
            {(["earthquake", "event", "social"] as const).map((type) => (
              <button
                key={type}
                onClick={() => triggerTestAlert(type)}
                className="rounded px-1 py-0.5 text-[9px] font-medium text-yellow-500/80 transition-colors hover:bg-yellow-500/10"
              >
                {type === "earthquake" ? "Quake" : type === "event" ? "News" : "Social"}
              </button>
            ))}
          </div>
        )}

        {/* Mute toggle */}
        <button
          onClick={toggleMute}
          className="flex h-6 w-6 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
          title={isMuted ? t("unmuteAlerts") : t("muteAlerts")}
        >
          {isMuted ? <BellOff className="h-3.5 w-3.5" /> : null}
        </button>

        {/* Bell + Alert Panel */}
        <div className="relative">
          <button
            data-alert-trigger
            onClick={togglePanel}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
          >
            <Bell className="h-3.5 w-3.5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-600 px-0.5 text-[9px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          <AlertPanel />
        </div>

        <LocaleSwitcher />

        <button className="flex h-6 w-6 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300">
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}
