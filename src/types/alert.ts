export type AlertSeverity = "medium" | "high" | "critical";

export type AlertSource = "earthquake" | "event" | "social";

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  source: AlertSource;
  timestamp: Date;
  read: boolean;
  /** Optional link to the source (USGS page, article URL, social post) */
  url?: string;
  /** Coordinates for map flyTo on click */
  coordinates?: { latitude: number; longitude: number };
}
