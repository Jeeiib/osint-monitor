"use client";

import { useEffect, useRef } from "react";
import { CheckCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAlertStore } from "@/lib/stores/alertStore";
import { AlertCard } from "./AlertCard";

export function AlertPanel() {
  const t = useTranslations("alerts");
  const isPanelOpen = useAlertStore((s) => s.isPanelOpen);
  const alerts = useAlertStore((s) => s.alerts);
  const markAllAsRead = useAlertStore((s) => s.markAllAsRead);
  const closePanel = useAlertStore((s) => s.closePanel);
  const unreadCount = useAlertStore((s) => s.unreadCount);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isPanelOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest("[data-alert-trigger]")) return;
        closePanel();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPanelOpen, closePanel]);

  if (!isPanelOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-1 z-50 w-80 max-h-[28rem] overflow-hidden rounded-lg border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
        <span className="text-xs font-semibold text-slate-300">
          {unreadCount > 0 ? t("titleWithCount", { count: unreadCount }) : t("title")}
        </span>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <CheckCheck className="h-3 w-3" />
            {t("markAllRead")}
          </button>
        )}
      </div>

      {/* Alert list */}
      <div className="overflow-y-auto max-h-[24rem] p-2 space-y-1.5">
        {alerts.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-500">{t("noAlerts")}</p>
        ) : (
          alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
        )}
      </div>
    </div>
  );
}
