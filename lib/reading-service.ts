import type { WrittenReading } from "./reading-writer";

export type StoredReading = Partial<WrittenReading> & {
  status: "writing" | "ready" | "failed";
  question?: string;
  createdAt: string;
  delivery?: "pending" | "sent" | "review";
};
export type ReadingDB = {
  prepare(sql: string): { bind(...values: unknown[]): {
    first<T>(): Promise<T | null>;
  }};
};
export type ReadingRow = {
  session_id: string; status: StoredReading["status"]; reading: string | null;
  created_at: number; expires_at: number; delivery: "pending" | "sent" | "review";
  delivery_started: number | null; delivery_payload: string | null;
};
export const READING_TTL_MS = 400 * 86400_000;
export async function readingDb(): Promise<ReadingDB> {
  const { getOptionalRequestContext } = await import("@cloudflare/next-on-pages");
  const env = getOptionalRequestContext()?.env as { READING_ORDERS?: ReadingDB } | undefined;
  if (!env?.READING_ORDERS) throw new Error("reading database not configured");
  // No Sessions API: D1 executes these reads and atomic writes on the primary.
  return env.READING_ORDERS;
}
export function readingKey(sessionId: string): string { return `reading:${sessionId}`; }
export async function getLegacyReading(sessionId: string): Promise<StoredReading | null> {
  const { getOptionalRequestContext } = await import("@cloudflare/next-on-pages");
  const env = getOptionalRequestContext()?.env as { READINGS?: { get(key: string): Promise<string | null> } } | undefined;
  if (!env?.READINGS) throw new Error("legacy readings binding not configured");
  const raw = await env.READINGS.get(readingKey(sessionId));
  return raw ? JSON.parse(raw) : null; // Storage errors must never look like a miss.
}
export async function getReadingRow(sessionId: string, db?: ReadingDB): Promise<ReadingRow | null> {
  return (db ?? await readingDb()).prepare("SELECT * FROM reading_orders WHERE session_id = ?").bind(sessionId).first<ReadingRow>();
}
export function storedReading(row: ReadingRow): StoredReading {
  if (row.expires_at <= Date.now()) return { status: "failed", createdAt: new Date(row.created_at).toISOString(), delivery: "review" };
  return { ...(row.reading ? JSON.parse(row.reading) : {}), status: row.status,
    createdAt: new Date(row.created_at).toISOString(), delivery: row.delivery };
}
export async function getStoredReading(sessionId: string): Promise<StoredReading | null> {
  const row = await getReadingRow(sessionId);
  return row ? storedReading(row) : getLegacyReading(sessionId);
}
