import { describe, expect, test } from "bun:test";
import { buildYearBlueprint } from "../lib/year-blueprint";
import { toYearPreview } from "../lib/year-preview";

describe("public year preview boundary", () => {
  test("only returns a birth-card introduction and chapter name/dates", async () => {
    const year = await buildYearBlueprint("1991-02-17", "2026-09-11");
    const preview = toYearPreview(year);
    expect(Object.keys(preview).sort()).toEqual(["birthCard", "birthdate", "current", "introduction", "targetDate"]);
    expect(Object.keys(preview.current).sort()).toEqual(["endLabel", "planet", "startLabel"]);
    expect(preview.introduction).toBe(year.birthCopy.light);
    expect(preview.current.planet).toBe(year.current.planet);
    const serialized = JSON.stringify(preview);
    for (const field of ["birthCopy", "birthShadowLong", "birthIdentity", "chapters", "next", "pluto", "result", "longRange", "karma", "spreads", "shadow", "dare"]) {
      expect(serialized).not.toContain(`"${field}":`);
    }
    expect(serialized).not.toContain(year.birthCopy.shadow);
    expect(serialized).not.toContain(year.current.copy.shadow);
  });

  test("does not mutate the full paid model or pass future fields through", async () => {
    const year = await buildYearBlueprint("1988-06-15", "2026-09-11");
    const before = JSON.stringify(year);
    const preview = toYearPreview({ ...year, futurePaidFeature: "private" } as typeof year);
    expect(JSON.stringify(preview)).not.toContain("private");
    expect(JSON.stringify(year)).toBe(before);
    expect(year.chapters).toHaveLength(7);
    expect(year.birthCopy.shadow.length).toBeGreaterThan(0);
  });
});
