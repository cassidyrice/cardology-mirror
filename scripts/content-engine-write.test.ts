import { describe, expect, test } from "bun:test";

import { fixtureStoredCalendar } from "../lib/content-engine/fixture-session";
import type { CalendarRow } from "../lib/content-engine/prompt";
import {
  readStoredCalendar,
  writeStoredCalendar,
  type ContentCalendarKv,
} from "../lib/content-engine/storage";
import {
  MAX_GENERATIONS_PER_CALENDAR,
  MAX_GENERATIONS_PER_DAY,
  applyGeneration,
  canGenerate,
  dayGenerations,
  totalGenerations,
} from "../lib/content-engine/write-counters";
import {
  PIECE_KINDS,
  buildWriteUserPrompt,
  formatSpecForKind,
  isPieceKind,
} from "../lib/content-engine/write-prompt";

const SAMPLE_DAY: CalendarRow = {
  day: 1,
  theme: "Sharing the good stuff",
  why: "The week is for talking, so show the bun people already ask about.",
  post: 'Morning tray: "the bun that sells out by 9."',
  format: "photo",
};

describe("write counter logic", () => {
  test("allows three generations per day then blocks", () => {
    let counters = {};
    for (let i = 0; i < MAX_GENERATIONS_PER_DAY; i++) {
      expect(canGenerate(counters, 1).ok).toBe(true);
      counters = applyGeneration(counters, 1);
    }
    expect(canGenerate(counters, 1)).toEqual({ ok: false, reason: "day_limit" });
    expect(dayGenerations(counters, 1)).toBe(3);
  });

  test("calendar-wide cap is 156 generations", () => {
    let counters: Record<string, { generations: number }> = {};
    for (let day = 1; day <= 52; day++) {
      for (let i = 0; i < MAX_GENERATIONS_PER_DAY; i++) {
        counters = applyGeneration(counters, day);
      }
    }
    expect(totalGenerations(counters)).toBe(MAX_GENERATIONS_PER_CALENDAR);
    expect(canGenerate(counters, 1)).toEqual({ ok: false, reason: "calendar_limit" });
  });
});

describe("write prompt builder", () => {
  for (const kind of PIECE_KINDS) {
    test(`${kind} prompt includes the format spec`, () => {
      const prompt = buildWriteUserPrompt({
        business: "Kalispell bakery",
        weekHeader: "Week of talking to neighbors",
        day: SAMPLE_DAY,
        kind,
      });
      expect(prompt).toContain("Kalispell bakery");
      expect(prompt).toContain(SAMPLE_DAY.theme);
      expect(prompt).toContain(formatSpecForKind(kind));
      expect(isPieceKind(kind)).toBe(true);
    });
  }
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
  test("stores pieces and counters on the calendar record", async () => {
    const kv = mockKv();
    const stored = fixtureStoredCalendar("cs_test_write_shape");
    stored.pieces = {
      "1": {
        article: {
          kind: "article",
          content: "## Hook\n\nBody copy.",
          generatedAt: "2026-09-05T12:00:00.000Z",
          regeneration: 0,
        },
      },
    };
    stored.counters = { "1": { generations: 1 } };
    await writeStoredCalendar(stored, kv);
    const loaded = await readStoredCalendar(stored.sessionId, kv);
    expect(loaded?.pieces?.["1"]?.article?.content).toContain("Hook");
    expect(loaded?.counters?.["1"]?.generations).toBe(1);
    expect(loaded?.rows).toHaveLength(2);
  });
});
