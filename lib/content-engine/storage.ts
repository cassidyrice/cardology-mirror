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

export type ContentCalendarKv = {
  get(key: string, type?: "text"): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
};

/** 30 days of re-download for the paid 52-day calendar. */
export const CALENDAR_KV_TTL_SECONDS = 30 * 24 * 60 * 60;

export const CALENDAR_CSV_HEADER = "day,theme,why,post,format";

export function calendarKvKey(sessionId: string): string {
  return `content-calendar:${sessionId}`;
}

export function rowsToCsv(rows: CalendarRow[]): string {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = [CALENDAR_CSV_HEADER];
  for (const row of rows) {
    lines.push(
      [row.day, row.theme, row.why, row.post, row.format]
        .map((v) => escape(String(v)))
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

/** Parse the CSV that `rowsToCsv` writes (quoted RFC 4180, header row). */
export function csvToRows(csv: string): CalendarRow[] {
  const records = parseCsv(csv);
  if (records.length === 0) return [];
  const header = records[0]!.map((h) => h.trim().toLowerCase());
  const idx = {
    day: header.indexOf("day"),
    theme: header.indexOf("theme"),
    why: header.indexOf("why"),
    post: header.indexOf("post"),
    format: header.indexOf("format"),
  };
  if (Object.values(idx).some((i) => i < 0)) {
    throw new Error("CSV missing required columns: day,theme,why,post,format");
  }
  const rows: CalendarRow[] = [];
  for (const record of records.slice(1)) {
    if (record.every((cell) => cell.trim() === "")) continue;
    const day = Number(record[idx.day]);
    if (!Number.isFinite(day)) continue;
    rows.push({
      day,
      theme: record[idx.theme] ?? "",
      why: record[idx.why] ?? "",
      post: record[idx.post] ?? "",
      format: record[idx.format] ?? "",
    });
  }
  return rows;
}

export async function readStoredCalendar(
  sessionId: string,
  kv: ContentCalendarKv | null,
): Promise<StoredCalendar | null> {
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
  kv: ContentCalendarKv | null,
): Promise<boolean> {
  if (!kv) return false;
  await kv.put(calendarKvKey(calendar.sessionId), JSON.stringify(calendar), {
    expirationTtl: CALENDAR_KV_TTL_SECONDS,
  });
  return true;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cur);
      cur = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cur);
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}
