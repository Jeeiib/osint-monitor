import { BigQuery } from "@google-cloud/bigquery";
import type { Conflict } from "@/types/conflict";

const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
});

export async function fetchConflicts(): Promise<Conflict[]> {
  // Get date 24 hours ago in GDELT format (YYYYMMDD)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dateFilter = yesterday.toISOString().slice(0, 10).replace(/-/g, "");

  const query = `
    SELECT
      CAST(GlobalEventID AS STRING) as id,
      SQLDATE as date,
      Actor1Name as actor1,
      Actor2Name as actor2,
      EventCode as eventCode,
      GoldsteinScale as goldstein,
      NumMentions as mentions,
      NumSources as sources,
      ActionGeo_Lat as latitude,
      ActionGeo_Long as longitude,
      ActionGeo_FullName as location,
      SOURCEURL as sourceUrl
    FROM \`gdelt-bq.gdeltv2.events\`
    WHERE SQLDATE >= ${dateFilter}
      AND GoldsteinScale < -5
      AND ActionGeo_Lat IS NOT NULL
      AND NumMentions >= 10
    ORDER BY NumMentions DESC
    LIMIT 200
  `;

  try {
    const [rows] = await bigquery.query({ query });

    return rows.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      date: Number(row.date),
      actor1: row.actor1 as string | null,
      actor2: row.actor2 as string | null,
      eventCode: String(row.eventCode),
      goldstein: Number(row.goldstein),
      mentions: Number(row.mentions),
      sources: Number(row.sources),
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      location: String(row.location || "Unknown"),
      sourceUrl: String(row.sourceUrl || ""),
    }));
  } catch (error) {
    console.error("GDELT BigQuery error:", error);
    throw error;
  }
}
