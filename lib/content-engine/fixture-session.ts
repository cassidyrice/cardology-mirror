import type { StoredCalendar } from "./storage";
import { rowsToCsv } from "./storage";

export const STUB_SESSION_ID = "ce_fixture_001";

const FIXTURE_ROWS = [
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
    post: "Poll: croissant or morning bun?",
    format: "story",
  },
];

export function fixtureStoredCalendar(sessionId = STUB_SESSION_ID): StoredCalendar {
  return {
    sessionId,
    business: "Kalispell bakery",
    startDate: "2026-09-05",
    generatedAt: "2026-09-05T12:00:00.000Z",
    weekHeaders: ["Week of talking to neighbors"],
    rows: FIXTURE_ROWS,
    csv: rowsToCsv(FIXTURE_ROWS),
    pieces: {},
    counters: {},
  };
}

export function isFixtureSession(sessionId: string): boolean {
  return sessionId === STUB_SESSION_ID && process.env.CONTENT_ENGINE_TEST_STUB === "1";
}
