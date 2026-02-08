"use client";

import { useState } from "react";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SocialPost, SocialPlatform, SocialTopic } from "@/types/social";

const PLATFORM_CONFIG: Record<SocialPlatform, { label: string; bg: string; text: string }> = {
  x: { label: "X", bg: "bg-slate-700/50", text: "text-slate-300" },
  bluesky: { label: "BSKY", bg: "bg-sky-500/10", text: "text-sky-400" },
  telegram: { label: "TG", bg: "bg-blue-500/10", text: "text-blue-400" },
  rss: { label: "RSS", bg: "bg-orange-500/10", text: "text-orange-400" },
};

const TOPIC_KEYS: Record<SocialTopic, string> = {
  conflict: "conflict",
  earthquake: "earthquake",
  disaster: "disaster",
  military: "military",
  general: "general",
};

const TOPIC_STYLES: Record<SocialTopic, { bg: string; text: string }> = {
  conflict: { bg: "bg-red-500/15", text: "text-red-400" },
  earthquake: { bg: "bg-amber-500/15", text: "text-amber-400" },
  disaster: { bg: "bg-orange-500/15", text: "text-orange-400" },
  military: { bg: "bg-purple-500/15", text: "text-purple-400" },
  general: { bg: "bg-slate-500/15", text: "text-slate-400" },
};

function useRelativeTime() {
  const t = useTranslations("social");

  return (date: Date): string => {
    const now = Date.now();
    const diff = now - new Date(date).getTime();
    const minutes = Math.floor(diff / 60_000);

    if (minutes < 1) return t("justNow");
    if (minutes < 60) return t("minutesAgo", { minutes });

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("hoursAgo", { hours });

    const days = Math.floor(hours / 24);
    if (days < 7) return t("daysAgo", { days });

    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
}

const CONTENT_TRUNCATE_LENGTH = 140;

interface SocialPostCardProps {
  post: SocialPost;
}

export function SocialPostCard({ post }: SocialPostCardProps) {
  const t = useTranslations("social");
  const formatRelativeTime = useRelativeTime();
  const [expanded, setExpanded] = useState(false);
  const platform = PLATFORM_CONFIG[post.platform];
  const topicKey = TOPIC_KEYS[post.topic];
  const topicStyle = TOPIC_STYLES[post.topic];
  const isLong = post.content.length > CONTENT_TRUNCATE_LENGTH;
  const displayContent = expanded || !isLong
    ? post.content
    : `${post.content.slice(0, CONTENT_TRUNCATE_LENGTH)}...`;

  return (
    <div className="rounded-lg border border-white/5 bg-slate-900/40 p-3 transition-colors hover:bg-slate-800/50">
      {/* Header: platform badge + author + time */}
      <div className="mb-2 flex items-center gap-2">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${platform.bg}`}>
          <span className={`text-[10px] font-bold ${platform.text}`}>{platform.label}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-300 truncate">{post.authorHandle}</p>
        </div>
        <span className="shrink-0 text-[10px] text-slate-600">
          {formatRelativeTime(post.timestamp)}
        </span>
      </div>

      {/* Image */}
      {post.imageUrl && (
        <div className="mb-2 h-28 w-full overflow-hidden rounded-md">
          <img
            src={post.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => {
              const container = (e.target as HTMLImageElement).parentElement;
              if (container) container.style.display = "none";
            }}
          />
        </div>
      )}

      {/* Content */}
      <p className="mb-2 text-sm leading-relaxed text-slate-300">
        {displayContent}
      </p>

      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mb-2 flex items-center gap-0.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? t("showLess") : t("showMore")}
        </button>
      )}

      {/* Footer: topic badge + link */}
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${topicStyle.bg} ${topicStyle.text}`}>
          {t(topicKey)}
        </span>
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          {t("source")}
        </a>
      </div>
    </div>
  );
}
