"use client";

import { ExternalLink, Globe } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useMapStore } from "@/lib/stores";
import type { GdeltArticle } from "@/types/gdelt";

interface EventCardProps {
  event: GdeltArticle;
  index: number;
  isSelected: boolean;
  onSelect: (index: number) => void;
}

function getSeverityWidth(count: number): string {
  const pct = Math.min(100, Math.max(10, count * 3));
  return `${pct}%`;
}

export function EventCard({ event, index, isSelected, onSelect }: EventCardProps) {
  const t = useTranslations("events");
  const locale = useLocale();
  const { flyTo } = useMapStore();

  const handleClick = () => {
    onSelect(index);
    flyTo(event.longitude, event.latitude, 6);
  };

  const translateUrl = `https://translate.google.com/translate?sl=auto&tl=${locale}&u=${encodeURIComponent(event.url)}`;

  return (
    <div
      id={`event-card-${index}`}
      onClick={handleClick}
      className={`group cursor-pointer rounded-lg border transition-all duration-200 ${
        isSelected
          ? "border-red-500/40 bg-red-500/10"
          : "border-white/5 bg-slate-900/40 hover:border-white/10 hover:bg-slate-800/50"
      }`}
    >
      {/* Image */}
      {event.image && (
        <div className="relative h-32 w-full overflow-hidden rounded-t-lg">
          <img
            src={event.image}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
        </div>
      )}

      <div className="p-3">
        {/* Title */}
        <h3 className="mb-1.5 text-sm font-medium leading-snug text-slate-200 line-clamp-2">
          {event.title}
        </h3>

        {/* Meta row */}
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
          <Globe className="h-3 w-3 shrink-0" />
          <span className="truncate">{event.sourceDomain}</span>
          <span>·</span>
          <span className="shrink-0">{t("lessThan24h")}</span>
          {event.count > 1 && (
            <>
              <span>·</span>
              <span className="shrink-0">{t("articles", { count: event.count })}</span>
            </>
          )}
        </div>

        {/* Location */}
        <p className="mb-2 text-xs text-slate-400">{event.locationName}</p>

        {/* Severity bar */}
        <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400"
            style={{ width: getSeverityWidth(event.count) }}
          />
        </div>

        {/* Action links */}
        <div className="flex items-center gap-2">
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            {t("read")}
          </a>
          <a
            href={translateUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-slate-500 hover:text-blue-400 transition-colors"
          >
            {t("translate")}
          </a>
        </div>
      </div>
    </div>
  );
}
