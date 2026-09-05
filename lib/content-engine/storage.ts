import { getOptionalRequestContext } from "@cloudflare/next-on-pages";

import type { CalendarRow } from "./prompt";

export type StoredCalendar = {
  sessionId: string;
  business: string;
  startDate: string;
  generatedAt: string;
  weekHeaders: string[];
  rows: CalendarRow[];
  csv: string;
};

type KvNamespace = {
  get(key: string, type?: "text"): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
};

type ContentCalendarEnv = {
  CONTENT_CALENDARS?: KvNamespace;
};

const TTL_SECONDS = 30 * 24 * 60 * 60;

export function contentCalendarsKv(): KvNamespace | null {
  try {
    const context = getOptionalRequestContext();
    const env = context?.env as ContentCalendarEnv | undefined;
    return env?.CONTENT_CALENDARS ?? null;
  } catch {
    return null;
  }
}

export function calendarKvKey(sessionId: string): string {
  return `content-calendar:${sessionId}`;
}

export function rowsToCsv(rows: CalendarRow[]): string {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = ["day,theme,why,post,format"];
  for (const row of rows) {
    lines.push(
      [row.day, row.theme, row.why, row.post, row.format]
        .map((v) => escape(String(v)))
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

export async function readStoredCalendar(
  sessionId: string,
): Promise<StoredCalendar | null> {
  const kv = contentCalendarsKv();
  if (!kv || !sessionId) return null;
  const raw = await kv.get(calendarKvKey(sessionId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredCalendar;
  } catch {
    return null;
  }
}

export async function writeStoredCalendar(
  calendar: StoredCalendar,
): Promise<boolean> {
  const kv = contentCalendarsKv();
  if (!kv) return false;
  await kv.put(calendarKvKey(calendar.sessionId), JSON.stringify(calendar), {
    expirationTtl: TTL_SECONDS,
  });
  return true;
}
