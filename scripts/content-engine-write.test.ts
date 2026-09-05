import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

import { fixtureStoredCalendar } from "../lib/content-engine/fixture-session";
import type { CalendarRow } from "../lib/content-engine/prompt";
import {
  CALENDAR_KV_TTL_SECONDS,
  calendarKvKey,
  readStoredCalendar,
  writeStoredCalendar,
  type ContentCalendarKv,
} from "../lib/content-engine/storage";
import {
  MAX_GENERATIONS_PER_CALENDAR,
  MAX_GENERATIONS_PER_DAY,
  WRITE_LIMIT,
  WRITE_RATE_SCOPE,
  WRITE_WINDOW_MS,
  applyGeneration,
  canGenerate,
  dayGenerations,
  dayKey,
  nextRegenerationIndex,
  totalGenerations,
  upsertDayPiece,
  type CalendarCounters,
  type WrittenPiece,
} from "../lib/content-engine/write-counters";
import {
  PIECE_KINDS,
  buildWriteSystemPrompt,
  buildWriteUserPrompt,
  formatSpecForKind,
  isPieceKind,
  pieceKindLabel,
  type PieceKind,
} from "../lib/content-engine/write-prompt";
import { rateLimit } from "../lib/rate-limit";

const SAMPLE_DAY: CalendarRow = {
  day: 1,
  theme: "Sharing the good stuff",
  why: "The week is for talking, so show the bun people already ask about.",
  post: 'Morning tray: "the bun that sells out by 9."',
  format: "photo",
};

const KIND_SPECS: Record<PieceKind, { label: string; spec: string }> = {
  article: {
    label: "article",
    spec: "900–1,200 words with H2 headings",
  },
  "short-video": {
    label: "short-video script",
    spec: "45–60 second script with hook, beats, and CTA",
  },
  thread: {
    label: "thread",
    spec: "6–9 posts for a social thread",
  },
  carousel: {
    label: "carousel copy",
    spec: "6–8 slides with headline and body per slide",
  },
  newsletter: {
    label: "newsletter",
    spec: "150–250 words",
  },
};

function piece(
  kind: PieceKind,
  content: string,
  regeneration: number,
): WrittenPiece {
  return {
    kind,
    content,
    generatedAt: "2026-09-05T12:00:00.000Z",
    regeneration,
  };
}

describe("write counter logic", () => {
  test("1 piece + 2 regenerations = 3 generations per day, then day_limit", () => {
    expect(MAX_GENERATIONS_PER_DAY).toBe(3);
    expect(canGenerate(undefined, 1)).toEqual({ ok: true, remaining: 3 });

    let counters: CalendarCounters = {};
    const remaining = [3, 2, 1];
    for (let i = 0; i < MAX_GENERATIONS_PER_DAY; i++) {
      expect(canGenerate(counters, 1)).toEqual({
        ok: true,
        remaining: remaining[i]!,
      });
      expect(nextRegenerationIndex(counters, 1)).toBe(i);
      counters = applyGeneration(counters, 1);
    }

    expect(dayGenerations(counters, 1)).toBe(3);
    expect(nextRegenerationIndex(counters, 1)).toBe(3);
    expect(canGenerate(counters, 1)).toEqual({ ok: false, reason: "day_limit" });
    expect(canGenerate(counters, 2).ok).toBe(true);
  });

  test("days are independent until the 156 calendar cap", () => {
    let counters: CalendarCounters = {};
    for (let i = 0; i < MAX_GENERATIONS_PER_DAY; i++) {
      counters = applyGeneration(counters, 1);
    }
    expect(canGenerate(counters, 1)).toEqual({ ok: false, reason: "day_limit" });
    expect(canGenerate(counters, 2)).toEqual({ ok: true, remaining: 3 });
    counters = applyGeneration(counters, 2);
    expect(dayGenerations(counters, 1)).toBe(3);
    expect(dayGenerations(counters, 2)).toBe(1);
    expect(totalGenerations(counters)).toBe(4);
  });

  test("calendar-wide cap is 156 generations (52 days × 3)", () => {
    expect(MAX_GENERATIONS_PER_CALENDAR).toBe(156);
    let counters: CalendarCounters = {};
    for (let day = 1; day <= 52; day++) {
      for (let i = 0; i < MAX_GENERATIONS_PER_DAY; i++) {
        expect(canGenerate(counters, day).ok).toBe(true);
        counters = applyGeneration(counters, day);
      }
    }
    expect(totalGenerations(counters)).toBe(MAX_GENERATIONS_PER_CALENDAR);
    expect(canGenerate(counters, 1)).toEqual({
      ok: false,
      reason: "calendar_limit",
    });
    expect(canGenerate(counters, 52)).toEqual({
      ok: false,
      reason: "calendar_limit",
    });
  });

  test("calendar_limit wins over day_limit once 156 is reached", () => {
    let counters: CalendarCounters = {};
    for (let day = 1; day <= 51; day++) {
      for (let i = 0; i < MAX_GENERATIONS_PER_DAY; i++) {
        counters = applyGeneration(counters, day);
      }
    }
    counters = applyGeneration(counters, 52);
    counters = applyGeneration(counters, 52);
    expect(totalGenerations(counters)).toBe(155);
    expect(canGenerate(counters, 52)).toEqual({ ok: true, remaining: 1 });
    counters = applyGeneration(counters, 52);
    expect(totalGenerations(counters)).toBe(156);
    expect(canGenerate(counters, 52)).toEqual({
      ok: false,
      reason: "calendar_limit",
    });
  });

  test("applyGeneration does not mutate the previous counters object", () => {
    const before: CalendarCounters = { "1": { generations: 1 } };
    const after = applyGeneration(before, 1);
    expect(before).toEqual({ "1": { generations: 1 } });
    expect(after).toEqual({ "1": { generations: 2 } });
    expect(after).not.toBe(before);
  });

  test("empty, missing, and other-day counters count as zero", () => {
    expect(totalGenerations(undefined)).toBe(0);
    expect(dayGenerations(undefined, 1)).toBe(0);
    expect(dayGenerations({ "2": { generations: 2 } }, 1)).toBe(0);
    expect(dayKey(12)).toBe("12");
  });
});

describe("write prompt builder", () => {
  test("exposes the five paid kinds", () => {
    expect(PIECE_KINDS).toEqual([
      "article",
      "short-video",
      "thread",
      "carousel",
      "newsletter",
    ]);
  });

  test("isPieceKind accepts only the five kinds", () => {
    for (const kind of PIECE_KINDS) {
      expect(isPieceKind(kind)).toBe(true);
    }
    expect(isPieceKind("Article")).toBe(false);
    expect(isPieceKind("blog")).toBe(false);
    expect(isPieceKind("script")).toBe(false);
    expect(isPieceKind("")).toBe(false);
    expect(isPieceKind(null)).toBe(false);
    expect(isPieceKind(1)).toBe(false);
  });

  test("system prompt is the buyer's voice and bans mystic words", () => {
    const system = buildWriteSystemPrompt();
    expect(system).toContain("business's own voice");
    expect(system).toContain(
      "fate, universe, energy, destiny, manifest, predicts, journey, vibration, sacred",
    );
    expect(system).toContain(
      "Never mention cards, cardology, planets, patterns, or ranks.",
    );
    expect(system.toLowerCase()).not.toContain("cass");
  });

  for (const kind of PIECE_KINDS) {
    test(`${kind} prompt includes business, day, week, and format spec`, () => {
      const prompt = buildWriteUserPrompt({
        business: "Kalispell bakery",
        weekHeader: "Week of talking to neighbors",
        day: SAMPLE_DAY,
        kind,
      });
      const expected = KIND_SPECS[kind];
      expect(formatSpecForKind(kind)).toBe(expected.spec);
      expect(pieceKindLabel(kind).toLowerCase()).toBe(expected.label);
      expect(prompt).toContain("Business: Kalispell bakery");
      expect(prompt).toContain("Week context: Week of talking to neighbors");
      expect(prompt).toContain(`Day ${SAMPLE_DAY.day}:`);
      expect(prompt).toContain(`- Theme: ${SAMPLE_DAY.theme}`);
      expect(prompt).toContain(`- Why today: ${SAMPLE_DAY.why}`);
      expect(prompt).toContain(`- Post idea: ${SAMPLE_DAY.post}`);
      expect(prompt).toContain(`- Suggested format: ${SAMPLE_DAY.format}`);
      expect(prompt).toContain(`Write a ${expected.label} (${expected.spec})`);
      expect(prompt.toLowerCase()).not.toContain("cardology");
    });
  }

  test("empty week header falls back to This week", () => {
    const prompt = buildWriteUserPrompt({
      business: "  Kalispell bakery  ",
      weekHeader: "   ",
      day: SAMPLE_DAY,
      kind: "newsletter",
    });
    expect(prompt).toContain("Business: Kalispell bakery");
    expect(prompt).toContain("Week context: This week");
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

describe("KV record shape for written pieces", () => {
  test("stores pieces[day][kind] and counters[day] on the calendar record", async () => {
    const kv = mockKv();
    const stored = fixtureStoredCalendar("cs_test_write_shape");
    const article = piece("article", "## Hook\n\nBody copy.", 0);
    stored.pieces = upsertDayPiece(stored.pieces, 1, article);
    stored.counters = applyGeneration(stored.counters, 1);
    await writeStoredCalendar(stored, kv);

    const loaded = await readStoredCalendar(stored.sessionId, kv);
    expect(loaded?.pieces?.["1"]?.article).toEqual(article);
    expect(loaded?.counters?.["1"]).toEqual({ generations: 1 });
    expect(loaded?.rows).toHaveLength(2);

    const raw = kv.store.get(calendarKvKey(stored.sessionId));
    expect(raw?.expirationTtl).toBe(CALENDAR_KV_TTL_SECONDS);
    const parsed = JSON.parse(raw!.value) as {
      pieces: Record<string, Record<string, WrittenPiece>>;
      counters: Record<string, { generations: number }>;
    };
    expect(Object.keys(parsed.pieces)).toEqual(["1"]);
    expect(Object.keys(parsed.pieces["1"]!)).toEqual(["article"]);
    expect(Object.keys(parsed.counters)).toEqual(["1"]);
    expect(parsed.counters["1"]).toEqual({ generations: 1 });
  });

  test("two kinds on the same day share counters[day] and keep both pieces", async () => {
    const kv = mockKv();
    let stored = fixtureStoredCalendar("cs_test_write_two_kinds");
    stored.pieces = upsertDayPiece(
      stored.pieces,
      1,
      piece("article", "article body", 0),
    );
    stored.counters = applyGeneration(stored.counters, 1);
    stored.pieces = upsertDayPiece(
      stored.pieces,
      1,
      piece("thread", "thread body", 1),
    );
    stored.counters = applyGeneration(stored.counters, 1);
    await writeStoredCalendar(stored, kv);

    const loaded = await readStoredCalendar(stored.sessionId, kv);
    expect(loaded?.pieces?.["1"]?.article?.content).toBe("article body");
    expect(loaded?.pieces?.["1"]?.thread?.content).toBe("thread body");
    expect(loaded?.pieces?.["1"]?.newsletter).toBeUndefined();
    expect(loaded?.counters?.["1"]?.generations).toBe(2);
  });

  test("regenerate overwrites that kind and bumps counters[day]", async () => {
    const kv = mockKv();
    let stored = fixtureStoredCalendar("cs_test_write_regen");
    stored.pieces = upsertDayPiece(
      stored.pieces,
      1,
      piece("newsletter", "first draft", 0),
    );
    stored.counters = applyGeneration(stored.counters, 1);
    stored.pieces = upsertDayPiece(
      stored.pieces,
      1,
      piece("newsletter", "second draft", 1),
    );
    stored.counters = applyGeneration(stored.counters, 1);
    await writeStoredCalendar(stored, kv);

    const loaded = await readStoredCalendar(stored.sessionId, kv);
    expect(loaded?.pieces?.["1"]?.newsletter?.content).toBe("second draft");
    expect(loaded?.pieces?.["1"]?.newsletter?.regeneration).toBe(1);
    expect(loaded?.counters?.["1"]?.generations).toBe(2);
  });

  test("upsertDayPiece does not mutate the previous pieces object", () => {
    const before = upsertDayPiece({}, 1, piece("article", "a", 0));
    const after = upsertDayPiece(before, 1, piece("thread", "b", 1));
    expect(before["1"]?.thread).toBeUndefined();
    expect(after["1"]?.article?.content).toBe("a");
    expect(after["1"]?.thread?.content).toBe("b");
    expect(after).not.toBe(before);
  });
});

describe("write path rate limit (30/key/hour)", () => {
  test("same key is allowed 30 times then blocked; another key is independent", () => {
    const t0 = 1_700_200_000_000;
    expect(WRITE_LIMIT).toBe(30);
    expect(WRITE_WINDOW_MS).toBe(60 * 60 * 1000);
    expect(WRITE_RATE_SCOPE).toBe("content-engine-write");

    const keyA = `${WRITE_RATE_SCOPE}:e5-a:${t0}`;
    const keyB = `${WRITE_RATE_SCOPE}:e5-b:${t0}`;
    for (let i = 0; i < WRITE_LIMIT; i++) {
      expect(
        rateLimit(keyA, {
          limit: WRITE_LIMIT,
          windowMs: WRITE_WINDOW_MS,
          now: t0,
        }).ok,
      ).toBe(true);
    }
    const blocked = rateLimit(keyA, {
      limit: WRITE_LIMIT,
      windowMs: WRITE_WINDOW_MS,
      now: t0 + 1,
    });
    expect(blocked.ok).toBe(false);
    expect(
      rateLimit(keyB, {
        limit: WRITE_LIMIT,
        windowMs: WRITE_WINDOW_MS,
        now: t0,
      }).ok,
    ).toBe(true);
  });
});

describe("content-engine write production smoke script", () => {
  const scriptEnv = {
    ...process.env,
    CONTENT_ENGINE_SMOKE_LIVE: "",
    CONTENT_ENGINE_SMOKE_SESSION_ID: "",
    CONTENT_ENGINE_SMOKE_URL: "",
  };

  test("default run is a dry-run and does not hit the network", () => {
    const result = spawnSync("bun", ["scripts/content-engine-write-smoke.ts"], {
      cwd: join(import.meta.dir, ".."),
      encoding: "utf8",
      env: scriptEnv,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("DRY RUN");
    expect(result.stdout).toContain("/api/content-engine/write");
    expect(result.stdout).toContain('"kind":"newsletter"');
    expect(result.stdout).not.toMatch(/ya29\.|BEGIN PRIVATE KEY|sk_live_|cs_live_|cs_test_/);
  });

  test("live without a session id exits before fetch with a clear message", () => {
    const result = spawnSync(
      "bun",
      ["scripts/content-engine-write-smoke.ts", "--live"],
      {
        cwd: join(import.meta.dir, ".."),
        encoding: "utf8",
        env: scriptEnv,
      },
    );
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("CONTENT_ENGINE_SMOKE_SESSION_ID");
    expect(result.stderr).toContain("KV");
    expect(`${result.stdout}${result.stderr}`).not.toMatch(
      /ya29\.|BEGIN PRIVATE KEY|sk_live_/,
    );
  });
});
