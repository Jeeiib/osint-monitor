export interface Conflict {
  id: string;
  date: number;
  actor1: string | null;
  actor2: string | null;
  eventCode: string;
  goldstein: number;
  mentions: number;
  sources: number;
  latitude: number;
  longitude: number;
  location: string;
  sourceUrl: string;
}
