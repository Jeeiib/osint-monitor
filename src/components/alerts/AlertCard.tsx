"use client";

import { X, ExternalLink, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Alert } from "@/types/alert";
import { useAlertStore } from "@/lib/stores/alertStore";
import { useMapStore } from "@/lib/stores/mapStore";

const SEVERITY_STYLES: Record<string, { bg: string; border: string; badge: string }> = {
  critical: {
    bg: "bg-red-950/40",
    border: "border-red-500/30",
    badge: "bg-red-600 text-white",
  },
  high: {
    bg: "bg-orange-950/30",
    border: "border-orange-500/20",
    badge: "bg-orange-600 text-white",
  },
  medium: {
    bg: "bg-slate-800/50",
    border: "border-slate-600/20",
    badge: "bg-slate-600 text-slate-200",
  },
};

const SEVERITY_KEYS: Record<string, string> = {
  critical: "critical",
  high: "high",
  medium: "medium",
};

const SOURCE_KEYS: Record<string, string> = {
  earthquake: "sourceEarthquake",
  event: "sourceEvent",
  social: "sourceSocial",
};

interface AlertCardProps {
  alert: Alert;
}

export function AlertCard({ alert }: AlertCardProps) {
  const t = useTranslations("alerts");
  const dismissAlert = useAlertStore((s) => s.dismissAlert);
  const markAsRead = useAlertStore((s) => s.markAsRead);
  const closePanel = useAlertStore((s) => s.closePanel);
  const mapRef = useMapStore((s) => s.mapRef);

  const styles = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.medium;
  const age = formatAge(alert.timestamp, t("now"));

  function handleClick() {
    if (!alert.read) markAsRead(alert.id);
    if (alert.coordinates && mapRef) {
      mapRef.flyTo({
        center: [alert.coordinates.longitude, alert.coordinates.latitude],
        zoom: 6,
        duration: 1500,
      });
      closePanel();
    }
  }

  return (
    <div
      className={`group relative flex flex-col gap-1 rounded border p-2.5 transition-colors ${styles.bg} ${styles.border} ${
        !alert.read ? "ring-1 ring-white/10" : "opacity-75"
      } ${alert.coordinates ? "cursor-pointer hover:brightness-110" : ""}`}
      onClick={handleClick}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${styles.badge}`}>
            {t(SEVERITY_KEYS[alert.severity] ?? "medium")}
          </span>
          <span className="text-[10px] text-slate-500">{t(SOURCE_KEYS[alert.source] ?? "sourceEvent")}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-500">{age}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              dismissAlert(alert.id);
            }}
            className="rounded p-0.5 text-slate-500 opacity-0 transition-opacity hover:bg-slate-700 hover:text-slate-300 group-hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Title */}
      <p className="text-xs font-medium text-slate-200 leading-tight">{alert.title}</p>

      {/* Description */}
      <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{alert.description}</p>

      {/* Footer actions */}
      <div className="flex items-center gap-2 mt-0.5">
        {alert.coordinates && (
          <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
            <MapPin className="h-2.5 w-2.5" />
            {t("map")}
          </span>
        )}
        {alert.url && (
          <a
            href={alert.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-0.5 text-[10px] text-blue-400 hover:text-blue-300"
          >
            <ExternalLink className="h-2.5 w-2.5" />
            {t("source")}
          </a>
        )}
      </div>
    </div>
  );
}

function formatAge(date: Date, nowLabel: string): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return nowLabel;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
