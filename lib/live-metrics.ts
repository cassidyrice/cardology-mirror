/**
 * Live funnel metrics for /ops/live.
 *
 * Source of record is the Cloudflare Analytics Engine dataset `cardblueprints_funnel`
 * (written by lib/analytics-server.ts) read through the account SQL API, plus Stripe
 * Checkout Sessions for money that never touches the site (the Reading Day Payment Link).
 *
 * Blob layout (see recordFunnelEvent): blob1 event, blob2 session, blob4 path,
 * blob5 landing path, blob6 referrer host, blob7 channel, blob11 offer slug,
 * blob12 placement, blob13 outcome, blob15 source; double1 value cents.
 * Every SUM uses _sample_interval so sampled rows are weighted back to true counts.
 */

import type Stripe from "stripe";

export const CF_ACCOUNT_ID = "ed56f6f3b938abe4f3f024a53a789d4f";
export const LIVE_TIMEZONE = "America/Chicago";
const DATASET = "cardblueprints_funnel";

export const FUNNEL_STEPS = [
  "organic_landing",
  "calculator_completed",
  "sample_viewed",
  "offer_cta_clicked",
  "checkout_started",
  "purchase_completed",
] as const;

export const WATCHED_EVENTS = [
  ...FUNNEL_STEPS,
  "calculator_started",
  "reading_cta_clicked",
  "reveal_shown",
  "engine_link_clicked",
  "engine_sample_requested",
  "engine_sample_shown",
  "engine_cta_clicked",
  "checkout_error",
  "card_shared",
] as const;

export type HourBucket = {
  /** ISO hour start, UTC. */
  hour: string;
  counts: Record<string, number>;
};

export type LiveEvent = {
  at: string;
  event: string;
  path: string;
  placement: string;
  channel: string;
  valueCents: number;
};

export type LivePayload = {
  generatedAt: string;
  timezone: string;
  pulse: { events10m: number; sessions10m: number; perMinute: number[] };
  windows: {
    today: Record<string, number>;
    yesterday: Record<string, number>;
    last7d: Record<string, number>;
    prev7d: Record<string, number>;
  };
  hourly24: HourBucket[];
  placements: { calculator: Record<string, number>; cta: Record<string, number> };
  channels: Record<string, number>;
  pages: { path: string; landings: number; completions: number }[];
  recent: LiveEvent[];
  stripe: {
    ok: boolean;
    deepDive: { today: SessionTally; last7d: SessionTally };
    reading: { today: SessionTally; last7d: SessionTally; paidTotal: number };
    error?: string;
  };
};

export type SessionTally = { complete: number; open: number; expired: number; revenueCents: number };

type Row = Record<string, string | number>;

async function sql(token: string, query: string): Promise<Row[]> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/analytics_engine/sql`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "text/plain" },
      body: query,
    },
  );
  const json = (await res.json()) as { success?: boolean; data?: Row[]; errors?: { message: string }[] };
  if (json.success === false || !res.ok) {
    throw new Error(json.errors?.[0]?.message ?? `Analytics Engine HTTP ${res.status}`);
  }
  return json.data ?? [];
}

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** "YYYY-MM-DD" of a UTC timestamp in the dashboard timezone. */
export function localDay(isoUtc: string | Date, tz = LIVE_TIMEZONE): string {
  const d = typeof isoUtc === "string" ? new Date(isoUtc.replace(" ", "T") + (isoUtc.endsWith("Z") ? "" : "Z")) : isoUtc;
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

function addDays(day: string, delta: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function emptyCounts(): Record<string, number> {
  return Object.fromEntries(WATCHED_EVENTS.map((e) => [e, 0]));
}

function eventList(): string {
  return WATCHED_EVENTS.map((e) => `'${e}'`).join(",");
}

export async function fetchAnalytics(token: string, now = new Date()): Promise<Omit<LivePayload, "stripe" | "generatedAt" | "timezone">> {
  const [hourRows, minuteRows, pulseRows, placementRows, channelRows, pageRows, recentRows] = await Promise.all([
    sql(
      token,
      `SELECT toStartOfInterval(timestamp, INTERVAL '1' HOUR) AS h, blob1 AS e, SUM(_sample_interval) AS n
       FROM ${DATASET}
       WHERE timestamp > NOW() - INTERVAL '16' DAY AND blob1 IN (${eventList()})
       GROUP BY h, e ORDER BY h LIMIT 10000`,
    ),
    sql(
      token,
      `SELECT toStartOfInterval(timestamp, INTERVAL '1' MINUTE) AS m, SUM(_sample_interval) AS n
       FROM ${DATASET} WHERE timestamp > NOW() - INTERVAL '60' MINUTE GROUP BY m ORDER BY m LIMIT 100`,
    ),
    sql(
      token,
      `SELECT SUM(_sample_interval) AS events, COUNT(DISTINCT blob2) AS sessions
       FROM ${DATASET} WHERE timestamp > NOW() - INTERVAL '10' MINUTE`,
    ),
    sql(
      token,
      `SELECT blob1 AS e, blob12 AS placement, SUM(_sample_interval) AS n
       FROM ${DATASET}
       WHERE timestamp > NOW() - INTERVAL '36' HOUR AND blob1 IN ('calculator_completed','offer_cta_clicked')
       GROUP BY e, placement ORDER BY n DESC LIMIT 60`,
    ),
    sql(
      token,
      `SELECT blob7 AS channel, SUM(_sample_interval) AS n
       FROM ${DATASET} WHERE timestamp > NOW() - INTERVAL '36' HOUR AND blob1 = 'organic_landing'
       GROUP BY channel ORDER BY n DESC LIMIT 10`,
    ),
    sql(
      token,
      `SELECT blob4 AS path, SUM(IF(blob1='organic_landing',_sample_interval,0)) AS landings,
              SUM(IF(blob1='calculator_completed',_sample_interval,0)) AS completions
       FROM ${DATASET}
       WHERE timestamp > NOW() - INTERVAL '36' HOUR AND blob1 IN ('organic_landing','calculator_completed')
       GROUP BY path ORDER BY landings DESC LIMIT 12`,
    ),
    sql(
      token,
      `SELECT timestamp, blob1 AS e, blob4 AS path, blob12 AS placement, blob7 AS channel, double1 AS cents
       FROM ${DATASET} WHERE timestamp > NOW() - INTERVAL '6' HOUR AND blob1 IN (${eventList()})
       ORDER BY timestamp DESC LIMIT 40`,
    ),
  ]);

  // Hour buckets → windows in the dashboard timezone.
  const today = localDay(now);
  const yesterday = addDays(today, -1);
  const last7Start = addDays(today, -6);
  const prev7Start = addDays(today, -13);
  const windows = { today: emptyCounts(), yesterday: emptyCounts(), last7d: emptyCounts(), prev7d: emptyCounts() };
  const hourly = new Map<string, Record<string, number>>();
  for (const r of hourRows) {
    const hourUtc = String(r.h);
    const day = localDay(hourUtc);
    const e = String(r.e);
    const n = num(r.n);
    if (day === today) windows.today[e] = (windows.today[e] ?? 0) + n;
    if (day === yesterday) windows.yesterday[e] = (windows.yesterday[e] ?? 0) + n;
    if (day >= last7Start && day <= today) windows.last7d[e] = (windows.last7d[e] ?? 0) + n;
    if (day >= prev7Start && day < last7Start) windows.prev7d[e] = (windows.prev7d[e] ?? 0) + n;
    const iso = new Date(hourUtc.replace(" ", "T") + "Z").toISOString();
    if (now.getTime() - new Date(iso).getTime() <= 24 * 3600 * 1000) {
      const bucket = hourly.get(iso) ?? emptyCounts();
      bucket[e] = (bucket[e] ?? 0) + n;
      hourly.set(iso, bucket);
    }
  }
  // Fill the 24 hour grid so the chart has a bar for quiet hours too.
  const hourly24: HourBucket[] = [];
  const start = new Date(now);
  start.setUTCMinutes(0, 0, 0);
  for (let i = 23; i >= 0; i--) {
    const h = new Date(start.getTime() - i * 3600 * 1000).toISOString();
    hourly24.push({ hour: h, counts: hourly.get(h) ?? emptyCounts() });
  }

  const perMinuteMap = new Map<string, number>();
  for (const r of minuteRows) perMinuteMap.set(new Date(String(r.m).replace(" ", "T") + "Z").toISOString(), num(r.n));
  const perMinute: number[] = [];
  const mStart = new Date(now);
  mStart.setUTCSeconds(0, 0);
  for (let i = 59; i >= 0; i--) {
    perMinute.push(perMinuteMap.get(new Date(mStart.getTime() - i * 60000).toISOString()) ?? 0);
  }

  const placements = { calculator: {} as Record<string, number>, cta: {} as Record<string, number> };
  for (const r of placementRows) {
    const target = r.e === "calculator_completed" ? placements.calculator : placements.cta;
    const key = String(r.placement || "(none)");
    target[key] = (target[key] ?? 0) + num(r.n);
  }
  const channels: Record<string, number> = {};
  for (const r of channelRows) channels[String(r.channel || "unknown")] = num(r.n);

  return {
    pulse: { events10m: num(pulseRows[0]?.events), sessions10m: num(pulseRows[0]?.sessions), perMinute },
    windows,
    hourly24,
    placements,
    channels,
    pages: pageRows.map((r) => ({ path: String(r.path), landings: num(r.landings), completions: num(r.completions) })),
    recent: recentRows.map((r) => ({
      at: new Date(String(r.timestamp).replace(" ", "T") + "Z").toISOString(),
      event: String(r.e),
      path: String(r.path),
      placement: String(r.placement ?? ""),
      channel: String(r.channel ?? ""),
      valueCents: num(r.cents),
    })),
  };
}

const READING_AMOUNT_CENTS = 2000;
const DEEP_DIVE_AMOUNT_CENTS = 4700; // $47 One Question Reading (earlier offers on this slug billed 1900, 4700 and 900)

function tally(sessions: Stripe.Checkout.Session[], cents: number): SessionTally {
  const t: SessionTally = { complete: 0, open: 0, expired: 0, revenueCents: 0 };
  for (const s of sessions) {
    if (s.amount_total !== cents) continue;
    if (s.status === "complete" && s.payment_status === "paid") {
      t.complete += 1;
      t.revenueCents += s.amount_total ?? 0;
    } else if (s.status === "open") t.open += 1;
    else if (s.status === "expired") t.expired += 1;
  }
  return t;
}

export async function fetchStripe(stripe: Stripe, now = new Date()): Promise<LivePayload["stripe"]> {
  try {
    const todayStart = new Date(`${localDay(now)}T00:00:00`);
    // Midnight in the dashboard timezone: shift the local wall clock to UTC.
    const tzOffsetMin = (() => {
      const parts = new Intl.DateTimeFormat("en-US", { timeZone: LIVE_TIMEZONE, timeZoneName: "shortOffset" }).formatToParts(now);
      const off = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-5";
      const m = /GMT([+-]\d+)(?::(\d+))?/.exec(off);
      return m ? Number(m[1]) * 60 + (m[2] ? Math.sign(Number(m[1])) * Number(m[2]) : 0) : -300;
    })();
    const midnightUtc = Math.floor((todayStart.getTime() - tzOffsetMin * 60000) / 1000);
    const sevenDaysAgo = Math.floor(now.getTime() / 1000) - 7 * 86400;
    const sessions: Stripe.Checkout.Session[] = [];
    let starting_after: string | undefined;
    for (let page = 0; page < 5; page++) {
      const list = await stripe.checkout.sessions.list({ limit: 100, created: { gte: sevenDaysAgo }, starting_after });
      sessions.push(...list.data);
      if (!list.has_more) break;
      starting_after = list.data[list.data.length - 1]?.id;
    }
    const todaySessions = sessions.filter((s) => s.created >= midnightUtc);
    const isReading = (s: Stripe.Checkout.Session) => Boolean(s.payment_link) && s.amount_total === READING_AMOUNT_CENTS;
    const readingAll = sessions.filter(isReading);
    return {
      ok: true,
      deepDive: {
        today: tally(todaySessions.filter((s) => !s.payment_link), DEEP_DIVE_AMOUNT_CENTS),
        last7d: tally(sessions.filter((s) => !s.payment_link), DEEP_DIVE_AMOUNT_CENTS),
      },
      reading: {
        today: tally(todaySessions.filter(isReading), READING_AMOUNT_CENTS),
        last7d: tally(readingAll, READING_AMOUNT_CENTS),
        paidTotal: readingAll.filter((s) => s.status === "complete" && s.payment_status === "paid").length,
      },
    };
  } catch (error) {
    const empty: SessionTally = { complete: 0, open: 0, expired: 0, revenueCents: 0 };
    return {
      ok: false,
      error: error instanceof Error ? error.message : "stripe unavailable",
      deepDive: { today: empty, last7d: empty },
      reading: { today: empty, last7d: empty, paidTotal: 0 },
    };
  }
}
