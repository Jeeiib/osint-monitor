export type SocialPlatform = "x" | "bluesky" | "telegram" | "rss";

export type SocialTopic = "conflict" | "earthquake" | "disaster" | "military" | "general";

export interface SocialPost {
  id: string;
  author: string;
  authorHandle: string;
  platform: SocialPlatform;
  content: string;
  url: string;
  timestamp: Date;
  imageUrl?: string;
  topic: SocialTopic;
}
