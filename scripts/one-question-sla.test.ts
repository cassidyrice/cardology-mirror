import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ONE_QUESTION_TURNAROUND } from "../lib/deep-dive";

const root = join(import.meta.dir, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

const MARKETING_SLA_FILES = [
  "app/what-is-cardology/page.tsx",
  "app/cardology-for-beginners/page.tsx",
  "app/birth-card/page.tsx",
  "app/birth-card/[slug]/page.tsx",
  "app/destiny-cards/page.tsx",
  "app/about/page.tsx",
  "app/contact/page.tsx",
  "components/home/HomepageJourney.tsx",
] as const;

const LEGAL_SLA_FILES = [
  "app/terms-of-service/page.tsx",
  "app/refund-policy/page.tsx",
] as const;

test("ONE_QUESTION_TURNAROUND stays the minute SLA", () => {
  expect(ONE_QUESTION_TURNAROUND).toBe("about a minute");
});

test("edu and marketing One Question Reading copy uses the minute SLA", () => {
  for (const file of MARKETING_SLA_FILES) {
    const source = read(file);
    expect(source.includes("ONE_QUESTION_TURNAROUND")).toBe(true);
    expect(source.includes("2 business days")).toBe(false);
    expect(/2-business-day/i.test(source)).toBe(false);
  }
});

test("legal refund and terms keep the 2-business-day window", () => {
  for (const file of LEGAL_SLA_FILES) {
    const source = read(file);
    expect(source.includes("2 business days")).toBe(true);
    expect(source.includes("ONE_QUESTION_TURNAROUND")).toBe(false);
    expect(source.includes("about a minute")).toBe(false);
  }
});

test("generated blog posts and generator match $13 / minute offer copy", () => {
  const posts = read("lib/generated-blog-posts.json");
  const generator = read("scripts/generate_daily_blog_post.ts");

  expect(posts).toContain("$13 written reading");
  expect(posts).toContain("emailed within about a minute");
  expect(posts).toContain("$13 — one question, read from your card and your year.");
  expect(posts).not.toContain("2 business days");
  expect(posts).not.toContain("$47 written reading");
  expect(posts).not.toContain("$47 — one question");
  expect(posts).not.toMatch(/\$47\b/);

  expect(generator).toContain("DEEP_DIVE_PRICE_LABEL");
  expect(generator).toContain("ONE_QUESTION_TURNAROUND");
  expect(generator).not.toContain("2 business days");
  expect(generator).not.toContain("$47 written reading");
  expect(generator).not.toContain("$47 — one question");
});

test("public llm files advertise the $13 / minute SLA", () => {
  for (const file of ["public/llms.txt", "public/llms-full.txt"]) {
    const source = read(file);
    expect(source.includes("about a minute")).toBe(true);
    expect(source.includes("2 business days")).toBe(false);
    expect(/\$47 One Question/.test(source)).toBe(false);
  }
});
