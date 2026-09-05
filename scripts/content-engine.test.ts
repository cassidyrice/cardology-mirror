import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  assertFixedHeaderInPrompt,
  buildSystemPrompt,
  FIXED_TABLE_HEADER,
  parseCalendarMarkdown,
} from "../lib/content-engine/prompt";
import { buildSampleStructure } from "../lib/content-engine/structure";

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
