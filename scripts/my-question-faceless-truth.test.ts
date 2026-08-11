import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("My Question faceless truth", () => {
  const page = read("app/myquestion/page.tsx");
  const terms = read("app/terms-of-service/page.tsx");
  const privacy = read("app/privacy-policy/page.tsx");
  const checkout = read("app/myquestion/checkout/route.ts");
  const env = read(".env.example");

  test("discloses the actual faceless and synthetic format", () => {
    expect(page).toContain("Faceless sample reading");
    expect(page).toContain("AI-generated narration");
    expect(page).toContain("Mechanics verified");
    expect(page).toContain("Interpretation human-reviewed");
  });

  test("removes obsolete human-recorded proof claims", () => {
    const publicTruth = `${page}\n${terms}`;
    expect(publicTruth).not.toMatch(
      /human-recorded|personally recorded|created by a real person|creator demonstration|BIGVU/i,
    );
  });

  test("documents and enforces narration readiness", () => {
    expect(env).toContain("MY_QUESTION_NARRATION_READY=false");
    expect(page).toContain("MY_QUESTION_NARRATION_READY");
    expect(checkout).toContain("MY_QUESTION_NARRATION_READY");
    expect(privacy).toMatch(/OpenRouter/i);
    expect(privacy).toMatch(/MiniMax/i);
  });
});
