import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  SAMPLE_LIMIT,
  SAMPLE_RATE_SCOPE,
  SAMPLE_WINDOW_MS,
  MAX_BUSINESS,
  normalizeBusiness,
  sampleCacheKey,
  sha256Hex,
} from "../lib/content-engine/sample-cache";
import {
  assertFixedHeaderInPrompt,
  buildSystemPrompt,
  FIXED_TABLE_HEADER,
  parseCalendarMarkdown,
  type CalendarRow,
} from "../lib/content-engine/prompt";
import {
  CALENDAR_CSV_HEADER,
  CALENDAR_KV_TTL_SECONDS,
  calendarKvKey,
  csvToRows,
  readStoredCalendar,
  rowsToCsv,
  writeStoredCalendar,
  type ContentCalendarKv,
  type StoredCalendar,
} from "../lib/content-engine/storage";
import { buildSampleStructure } from "../lib/content-engine/structure";
import { clientIp, rateLimit, rateLimitKey } from "../lib/rate-limit";

describe("content-engine structure", () => {
  test("golden 7-day structure for 2026-09-05 starts on 6 of Diamonds", () => {
    const days = buildSampleStructure("2026-09-05");
    expect(days).toHaveLength(7);
    expect(days[0]!.date).toBe("2026-09-05");
    expect(days[0]!.cardLabel).toBe("6 of Diamonds");
    expect(days[0]!.cardCode).toBe("6♦");
    expect(days[0]!.planet).toBe("Mercury");
    expect(days[0]!.verbs).toEqual(["talk", "plan", "explain"]);
    expect(days[6]!.date).toBe("2026-09-11");
    expect(days[6]!.cardLabel).toBe("King of Clubs");
    expect(days.every((d) => d.week === 1)).toBe(true);
  });
});

describe("content-engine prompt", () => {
  test("system prompt uses the fixed table header", () => {
    const prompt = buildSystemPrompt();
    expect(assertFixedHeaderInPrompt(prompt)).toBe(true);
    expect(prompt).toContain(FIXED_TABLE_HEADER);
    expect(FIXED_TABLE_HEADER).toBe("| DAY | THEME | WHY | POST | FORMAT |");
  });
});

describe("content-engine table parser", () => {
  const fixtures = join(import.meta.dir, "../lib/content-engine/fixtures");

  test("parses bakery-v2 reference output", () => {
    const text = readFileSync(join(fixtures, "bakery-v2.md"), "utf8");
    const parsed = parseCalendarMarkdown(text);
    expect(parsed.rows.length).toBeGreaterThanOrEqual(28);
    expect(parsed.rows[0]).toMatchObject({
      day: 1,
      theme: "Sharing the good stuff",
    });
    expect(parsed.rows[0]!.why.length).toBeGreaterThan(10);
    expect(parsed.rows[0]!.post.length).toBeGreaterThan(10);
    expect(parsed.rows[0]!.format.toLowerCase()).toContain("photo");
    expect(parsed.weekHeaders.length).toBeGreaterThanOrEqual(1);
  });

  test("parses youtube-v2 reference output", () => {
    const text = readFileSync(join(fixtures, "youtube-v2.md"), "utf8");
    const parsed = parseCalendarMarkdown(text);
    expect(parsed.rows.length).toBeGreaterThanOrEqual(28);
    expect(parsed.rows[0]!.day).toBe(1);
    expect(parsed.rows[0]!.theme.toLowerCase()).toContain("gear");
  });

  test("parses saas-v2 reference output with short headers", () => {
    const text = readFileSync(join(fixtures, "saas-v2.md"), "utf8");
    const parsed = parseCalendarMarkdown(text);
    expect(parsed.rows.length).toBeGreaterThanOrEqual(28);
    expect(parsed.rows[0]).toMatchObject({
      day: 1,
      theme: "Sharing a valuable scheduling resource",
    });
    expect(parsed.rows[0]!.format.toLowerCase()).toContain("carousel");
  });
});

const SMALL_CALENDAR: CalendarRow[] = [
  {
    day: 1,
    theme: "Sharing the good stuff",
    why: "The week is for talking, so show the bun people already ask about.",
    post: 'Morning tray: "the bun that sells out by 9."',
    format: "photo",
  },
  {
    day: 2,
    theme: "Ask, then bake",
    why: "Planning day: one question that names tomorrow's bake.",
    post: "Poll: croissant or morning bun? Reply with the one you'd walk over for.",
    format: "story",
  },
  {
    day: 3,
    theme: "Proof in the window",
    why: "Explain the wait without a lecture.",
    post: "Reel of dough rising next to the clock. Caption: this is why 7am.",
    format: "short video",
  },
];

describe("content-engine CSV export", () => {
  test("round-trips a small calendar table, including quotes and commas", () => {
    const csv = rowsToCsv(SMALL_CALENDAR);
    expect(csv.startsWith(`${CALENDAR_CSV_HEADER}\n`)).toBe(true);
    expect(csv.endsWith("\n")).toBe(true);
    expect(csv).toContain('""the bun that sells out by 9.""');
    const back = csvToRows(csv);
    expect(back).toEqual(SMALL_CALENDAR);
  });

  test("round-trips a quoted newline inside a cell", () => {
    const rows: CalendarRow[] = [
      {
        day: 4,
        theme: "Two-line caption",
        why: "Keep the reason short.",
        post: "Line one.\nLine two.",
        format: "thread",
      },
    ];
    expect(csvToRows(rowsToCsv(rows))).toEqual(rows);
  });
});

function mockKv(): ContentCalendarKv & {
  store: Map<string, { value: string; expirationTtl?: number }>;
} {
  const store = new Map<string, { value: string; expirationTtl?: number }>();
  return {
    store,
    async get(key: string) {
      return store.get(key)?.value ?? null;
    },
    async put(key: string, value: string, options?: { expirationTtl?: number }) {
      store.set(key, { value, expirationTtl: options?.expirationTtl });
    },
  };
}

function sampleStored(sessionId: string): StoredCalendar {
  return {
    sessionId,
    business: "Kalispell bakery",
    startDate: "2026-09-05",
    generatedAt: "2026-09-05T12:00:00.000Z",
    weekHeaders: ["Week of talking to neighbors"],
    rows: SMALL_CALENDAR,
    csv: rowsToCsv(SMALL_CALENDAR),
  };
}

describe("content-engine KV session storage", () => {
  test("calendarKvKey is session-scoped", () => {
    expect(calendarKvKey("cs_test_abc")).toBe("content-calendar:cs_test_abc");
  });

  test("write then read round-trips through mock KV with 30-day TTL", async () => {
    const kv = mockKv();
    const stored = sampleStored("cs_test_roundtrip");
    expect(await writeStoredCalendar(stored, kv)).toBe(true);
    expect(kv.store.get(calendarKvKey(stored.sessionId))?.expirationTtl).toBe(
      CALENDAR_KV_TTL_SECONDS,
    );
    expect(CALENDAR_KV_TTL_SECONDS).toBe(30 * 24 * 60 * 60);
    const loaded = await readStoredCalendar(stored.sessionId, kv);
    expect(loaded).toEqual(stored);
    expect(csvToRows(loaded!.csv)).toEqual(SMALL_CALENDAR);
  });

  test("missing key, empty session, null KV, and bad JSON are all null/false", async () => {
    const kv = mockKv();
    expect(await readStoredCalendar("cs_missing", kv)).toBeNull();
    expect(await readStoredCalendar("", kv)).toBeNull();
    expect(await readStoredCalendar("cs_test_abc", null)).toBeNull();
    expect(await writeStoredCalendar(sampleStored("cs_test_abc"), null)).toBe(false);
    await kv.put(calendarKvKey("cs_bad"), "{not-json");
    expect(await readStoredCalendar("cs_bad", kv)).toBeNull();
  });
});

describe("content-engine sample cache key", () => {
  test("key is date + sha256 of normalized lowercase business text", async () => {
    const date = "2026-09-05";
    const key = await sampleCacheKey(date, "Kalispell bakery");
    const hash = await sha256Hex("kalispell bakery");
    expect(key).toBe(`content-engine-sample:${date}:${hash}`);
    expect(hash).toHaveLength(64);
  });

  test("whitespace and case collapse to the same key; date and text do not", async () => {
    const date = "2026-09-05";
    const a = await sampleCacheKey(date, "Kalispell bakery");
    const b = await sampleCacheKey(date, "  Kalispell   BAKERY  ");
    const c = await sampleCacheKey("2026-09-06", "Kalispell bakery");
    const d = await sampleCacheKey(date, "Kalispell cafe");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).not.toBe(d);
  });

  test("normalizeBusiness trims, collapses space, and caps at 240 chars", () => {
    expect(normalizeBusiness("  Kalispell   bakery  ")).toBe("Kalispell bakery");
    expect(normalizeBusiness(12)).toBe("");
    const long = `${"x".repeat(MAX_BUSINESS)}yz`;
    expect(normalizeBusiness(long)).toHaveLength(MAX_BUSINESS);
    expect(normalizeBusiness(long)).toBe("x".repeat(MAX_BUSINESS));
  });
});

describe("content-engine sample rate limit (5/IP/hour)", () => {
  test("same IP is allowed 5 times then 429; another IP is independent", () => {
    const t0 = 1_700_000_000_000;
    const ipA = new Request("https://cardblueprints.com/api/content-engine/sample", {
      method: "POST",
      headers: { "cf-connecting-ip": "203.0.113.10" },
    });
    const ipB = new Request("https://cardblueprints.com/api/content-engine/sample", {
      method: "POST",
      headers: { "cf-connecting-ip": "203.0.113.20" },
    });
    expect(clientIp(ipA)).toBe("203.0.113.10");
    expect(rateLimitKey(ipA, SAMPLE_RATE_SCOPE)).toBe(
      `${SAMPLE_RATE_SCOPE}:203.0.113.10`,
    );
    expect(SAMPLE_LIMIT).toBe(5);
    expect(SAMPLE_WINDOW_MS).toBe(60 * 60 * 1000);

    const keyA = `${SAMPLE_RATE_SCOPE}:e2-a:${t0}`;
    const keyB = `${SAMPLE_RATE_SCOPE}:e2-b:${t0}`;
    for (let i = 0; i < SAMPLE_LIMIT; i++) {
      const result = rateLimit(keyA, {
        limit: SAMPLE_LIMIT,
        windowMs: SAMPLE_WINDOW_MS,
        now: t0,
      });
      expect(result.ok).toBe(true);
    }
    const blocked = rateLimit(keyA, {
      limit: SAMPLE_LIMIT,
      windowMs: SAMPLE_WINDOW_MS,
      now: t0 + 1,
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
    }
    const other = rateLimit(keyB, {
      limit: SAMPLE_LIMIT,
      windowMs: SAMPLE_WINDOW_MS,
      now: t0,
    });
    expect(other.ok).toBe(true);
  });

  test("window expiry opens a new bucket", () => {
    const t0 = 1_700_100_000_000;
    const key = `${SAMPLE_RATE_SCOPE}:e2-window:${t0}`;
    for (let i = 0; i < SAMPLE_LIMIT; i++) {
      expect(
        rateLimit(key, { limit: SAMPLE_LIMIT, windowMs: SAMPLE_WINDOW_MS, now: t0 }).ok,
      ).toBe(true);
    }
    expect(
      rateLimit(key, { limit: SAMPLE_LIMIT, windowMs: SAMPLE_WINDOW_MS, now: t0 }).ok,
    ).toBe(false);
    expect(
      rateLimit(key, {
        limit: SAMPLE_LIMIT,
        windowMs: SAMPLE_WINDOW_MS,
        now: t0 + SAMPLE_WINDOW_MS,
      }).ok,
    ).toBe(true);
  });
});

describe("content-engine production smoke script", () => {
  test("default run is a dry-run and does not hit the network", () => {
    const result = spawnSync("bun", ["scripts/content-engine-smoke.ts"], {
      cwd: join(import.meta.dir, ".."),
      encoding: "utf8",
      env: { ...process.env, CONTENT_ENGINE_SMOKE_LIVE: "" },
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("DRY RUN");
    expect(result.stdout).toContain("Kalispell bakery");
    expect(result.stdout).toContain("/api/content-engine/sample");
    expect(result.stdout).not.toMatch(/ya29\.|BEGIN PRIVATE KEY|sk_live_/);
  });
});
