import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { Glob } from "bun";

// Everything visitors, search engines and AI agents read. Fulfillment for past
// buyers (app/api, success, my-purchases, blueprint, consultation) is left out on purpose.
const PAST_BUYER = /^app\/(api|checkout\/success|my-purchases|blueprint|consultation)\/|^components\/ops\//;
const PUBLIC_FILES = [
  ...[...new Glob("{app,components}/**/*.{ts,tsx}").scanSync(".")].filter((f) => !PAST_BUYER.test(f)),
  "lib/faq.ts", "lib/site.ts", "lib/site-nav.ts", "lib/readings-nav.ts", "lib/worker-port/cardology-unlock.mjs",
  "lib/generated-blog-posts.json", "content/born-on/pages.json",
  "public/llms.txt", "public/llms-full.txt", "public/.well-known/agent-card.json",
];
const RETIRED = [
  /one-question-reading/,
  /\/products\/(year-ahead|blueprint-report|card-blueprint-app)/, /free-course/,
  /NewsletterSignupForm|FreeCourseCta|ElroyLauncher|buttondown\.com\/api/,
];

test("retired offers and email capture stay off public pages", () => {
  expect(PUBLIC_FILES.length).toBeGreaterThan(100);
  const hits = PUBLIC_FILES.flatMap((file) => {
    const src = readFileSync(file, "utf8");
    return RETIRED.filter((re) => re.test(src)).map((re) => `${file}: ${re}`);
  });
  expect(hits).toEqual([]);
});

test("$13 on public pages only ever means the Birth Card Blueprint", () => {
  const hits = PUBLIC_FILES.flatMap((file) =>
    readFileSync(file, "utf8").split("\n").filter((line) => /\$13\b/.test(line) && !/Birth Card Blueprint|[Ff]rom \$13|start at \$13|^\s*price: "\$13",$/.test(line)).map((line) => `${file}: ${line.trim().slice(0, 120)}`),
  );
  expect(hits).toEqual([]);
});

test("the offers are the Birth Card Blueprint, Timing Map, Chemistry Check and Family Snapshot", async () => {
  const { READINGS_NAV } = await import("../lib/readings-nav");
  expect(READINGS_NAV.map((r) => r.id)).toEqual(["birth-card-blueprint", "timing-map", "chemistry-check", "family-snapshot"]);
  const { CARD_APP_ON_SALE } = await import("../lib/products");
  const { YEAR_AHEAD_ON_SALE } = await import("../lib/year-ahead");
  expect([CARD_APP_ON_SALE, YEAR_AHEAD_ON_SALE]).toEqual([false, false]);
});
