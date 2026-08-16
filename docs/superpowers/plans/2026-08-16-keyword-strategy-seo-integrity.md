# Keyword Strategy SEO Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the remaining high-confidence recommendations from the mapped half of the Card Blueprints keyword workbook by improving crawlable internal discovery, structured data, sitemap truth, and mobile conversion behavior without changing Cardology calculations or the Worker deployment.

**Architecture:** Keep the maintainable Next.js application responsible for core pages, calculators, shared navigation, schema, and its own sitemap. Add pure boundary helpers for the separately deployed Worker’s `/born-on/*` and `/compatibility/*` routes, validate those helpers exhaustively, and exercise only a bounded sample against production through an explicit network command. Centralize breadcrumb JSON-LD in `SeoShell`; keep page-type schema page-owned.

**Tech Stack:** Next.js 15.1.6, React 19, TypeScript 5.7, Bun 1.3, Bun test, Playwright 1.60, Cloudflare Pages via `@cloudflare/next-on-pages`.

## Global Constraints

- Use only workbook rows 2–528 as implementation inputs; rows 529–1184 are malformed/unassigned and must not create pages or change titles.
- Modify only the maintainable Next.js application. Do not patch, reverse-engineer, or deploy the recovered Cloudflare Worker bundle.
- Preserve the existing deterministic birth-card, ruling-card, and compatibility calculations.
- Worker destinations must be plain `<a>` elements; do not route them through `next/link`.
- Do not change Stripe, checkout, fulfillment, analytics payloads, pricing, or product claims.
- Do not add a tarot calculator or describe Cardology as tarot.
- Do not add dependencies; use the existing Bun, React, Next.js, and Playwright toolchain.
- Canonical production origin remains exactly `https://cardblueprints.com`.
- Do not push to GitHub or deploy to Cloudflare without a separate user instruction.
- Work only in the clean clone at `/Users/main/Documents/Codex/2026-08-16/use/work/cardology-mirror-seo`; do not touch the stale dirty checkout under `/Users/main/Documents/Codex/2026-08-08/can/work/cardology-mirror`.

---

## File and interface map

- `app/sitemap.ts` owns the Next.js sitemap and truthful path-level dates. It must never list Worker-owned URLs; strict date parsing lives in a normal library module because Next metadata routes cannot export arbitrary fields.
- `lib/worker-seo-routes.ts` is the small, client-safe boundary module for strict ISO parsing plus `birthdayWorkerPathFromIsoDate(isoDate: string): string | null` and `compatibilityPairPath(firstSlug: string, secondSlug: string): string | null`.
- `lib/birth-card-calculator.ts` consumes the shared ISO parser without changing calculation behavior; `lib/compat-pairs.ts` retains the Worker report data and re-exports the pair helper for server-side callers.
- `components/seo/BirthCardCalculator.tsx` and `components/seo/CompatibilityCalculator.tsx` consume those helpers and render conditional plain anchors.
- `lib/structured-data.ts` owns validated breadcrumb construction through `buildBreadcrumbJsonLd(items: readonly BreadcrumbData[]): BreadcrumbListJsonLd | null`.
- `components/seo/SeoShell.tsx` consumes the breadcrumb helper and emits the sole `BreadcrumbList` for pages using the shell.
- Page modules retain their own `Article`, `CollectionPage`, `ItemList`, and `FAQPage` graphs.
- `lib/elroy/widget.ts` owns the pure `shouldScheduleElroyTeaser(pathname: string, isSmallScreen: boolean): boolean` policy; `ElroyLauncher` only applies it.
- `scripts/worker-production-contract.ts` is the only new production-network check and must not use a `.test.ts` suffix.
- Focused unit `scripts/*.test.ts` files are CI-fast and make no network requests; the explicit Playwright smoke uses only a developer-started localhost server.

### Task 1: Make sitemap modification dates truthful

**Files:**
- Create: `scripts/sitemap-integrity.test.ts`
- Create: `lib/sitemap-date.ts`
- Modify: `app/sitemap.ts`

**Interfaces:**
- Consumes: `MARKETING_PATHS`, `SITE_URL`, `allCardSlugs()`, and existing blog date metadata.
- Produces: `sitemapDate(value: string): Date` from `lib/sitemap-date.ts`; the special Next metadata route keeps only its allowed exports and default `MetadataRoute.Sitemap` function.

- [ ] **Step 1: Install the locked dependencies and confirm the isolated clone**

Run:

```bash
pwd
git status --short --branch
bun install --frozen-lockfile
```

Expected: the path ends in `work/cardology-mirror-seo`; the branch is only ahead by the approved docs commits before implementation; installation does not rewrite `bun.lock`.

- [ ] **Step 2: Write the failing sitemap integrity test**

Create `scripts/sitemap-integrity.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import sitemap from "../app/sitemap";
import { allBlogPosts, type BlogPost } from "../lib/blog";
import { allCardSlugs } from "../lib/seo-cards";
import { MARKETING_PATHS, SITE_URL } from "../lib/site";
import { sitemapDate } from "../lib/sitemap-date";

const entries = sitemap();

function dayFor(path: string): string {
  const entry = entries.find((item) => new URL(item.url).pathname === path);
  expect(entry, `missing sitemap entry for ${path}`).toBeDefined();
  expect(entry?.lastModified).toBeInstanceOf(Date);
  return (entry?.lastModified as Date).toISOString().slice(0, 10);
}

function modified(post: BlogPost): string {
  return post.dateModified || post.datePublished;
}

describe("sitemap dates", () => {
  test("rejects malformed and impossible ISO days", () => {
    expect(() => sitemapDate("2026-8-16")).toThrow();
    expect(() => sitemapDate("2026-02-30")).toThrow();
    expect(sitemapDate("2024-02-29").toISOString()).toBe("2024-02-29T00:00:00.000Z");
  });

  test("uses truthful dates for updated and stable routes", () => {
    expect(dayFor("/")).toBe("2026-08-16");
    expect(dayFor("/birth-card")).toBe("2026-08-16");
    expect(dayFor("/birth-card-calculator")).toBe("2026-08-16");
    expect(dayFor("/birth-card-compatibility-calculator")).toBe("2026-08-16");
    expect(dayFor("/playing-card-spreads")).toBe("2026-08-16");
    expect(dayFor("/about")).toBe("2026-08-12");
    expect(dayFor("/shadow-karma-guide")).toBe("2026-07-02");
    expect(dayFor("/birth-card/joker")).toBe("2026-08-15");
  });

  test("uses the shared August 15 content date for all 52 card pages", () => {
    for (const slug of allCardSlugs()) {
      expect(dayFor(`/birth-card/${slug}`)).toBe("2026-08-15");
    }
  });

  test("keeps blog indexes tied to post metadata", () => {
    const latest = allBlogPosts().map(modified).sort().at(-1);
    expect(dayFor("/blog")).toBe(latest);
  });
});

describe("sitemap ownership", () => {
  test("contains unique same-origin URLs and every marketing path", () => {
    const urls = entries.map((entry) => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls) expect(new URL(url).origin).toBe(SITE_URL);
    for (const path of MARKETING_PATHS) {
      expect(urls).toContain(path === "/" ? SITE_URL : `${SITE_URL}${path}`);
    }
  });

  test("never lists Worker-owned routes or unmaintained hints", () => {
    for (const entry of entries) {
      const path = new URL(entry.url).pathname;
      expect(path === "/born-on" || path.startsWith("/born-on/")).toBe(false);
      expect(path === "/compatibility" || path.startsWith("/compatibility/")).toBe(false);
      expect(entry.changeFrequency).toBeUndefined();
      expect(entry.priority).toBeUndefined();
    }
  });
});
```

- [ ] **Step 3: Run the focused test and verify the red state**

Run: `bun test scripts/sitemap-integrity.test.ts`

Expected: FAIL because `lib/sitemap-date.ts` does not exist, route dates still share `CORE_UPDATED`, and entries still include `changeFrequency`/`priority`.

- [ ] **Step 4: Implement strict dates and the per-path registry**

Create `lib/sitemap-date.ts` so the special `app/sitemap.ts` route does not expose an unsupported named export:

```ts
export function sitemapDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid sitemap date: ${value}`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid sitemap date: ${value}`);
  }
  return parsed;
}
```

Import `sitemapDate` into `app/sitemap.ts`, then replace `CORE_UPDATED`, `date`, and the unmaintainable hints with this registry:

```ts
const FALLBACK_UPDATED = "2026-07-12";
const CARD_MEANINGS_UPDATED = "2026-08-15";

const ROUTE_UPDATED: Readonly<Record<string, string>> = {
  "/": "2026-08-16",
  "/about": "2026-08-12",
  "/videos": "2026-07-29",
  "/birth-card": "2026-08-16",
  "/birth-card/joker": "2026-08-15",
  "/birth-card-calculator": "2026-08-16",
  "/card-of-the-day": "2026-08-15",
  "/52-day-period-meaning-tool": "2026-07-30",
  "/birth-card-compatibility-calculator": "2026-08-16",
  "/cardology-compatibility": "2026-08-16",
  "/products/personal-card-blueprint": "2026-08-12",
  "/products/analog-algorithm": "2026-08-08",
  "/free-course": "2026-08-07",
  "/what-is-cardology": "2026-08-16",
  "/cardology-for-beginners": "2026-08-12",
  "/cardology-vs-tarot": "2026-08-12",
  "/destiny-cards": "2026-08-15",
  "/cartomancy-vs-tarot": "2026-08-07",
  "/how-to-read-playing-cards": "2026-08-16",
  "/playing-card-spreads": "2026-08-16",
  "/playing-card-spreads/three-card": "2026-08-16",
  "/playing-card-spreads/love": "2026-08-16",
  "/playing-card-spreads/yes-or-no": "2026-08-16",
  "/52-card-astrology-explained": "2026-08-16",
  "/birth-card-vs-ruling-card": "2026-08-15",
  "/planetary-ruling-card": "2026-08-15",
  "/methodology": "2026-08-15",
  "/editorial-policy": "2026-08-06",
  "/contact": "2026-08-12",
  "/shadow-karma-guide": "2026-07-02",
  "/privacy-policy": "2026-08-12",
  "/refund-policy": "2026-08-12",
  "/terms-of-service": "2026-08-12",
};

function updatedForPath(path: string): string {
  return ROUTE_UPDATED[path] ?? FALLBACK_UPDATED;
}
```

Set `latestPostDate` to `latestOf(posts.map(postModified)) || FALLBACK_UPDATED`. Use `sitemapDate(p === "/blog" ? latestPostDate : updatedForPath(p))` for marketing entries, `CARD_MEANINGS_UPDATED` for the 52 card pages, `ROUTE_UPDATED["/birth-card/joker"]` for Joker, and `sitemapDate(...)` for blog pillars/posts. Remove every `changeFrequency` and `priority` property. Preserve the existing Worker-exclusion comments.

- [ ] **Step 5: Run the focused and existing public-truth checks**

Run:

```bash
bun test scripts/sitemap-integrity.test.ts
bun run test
```

Expected: both commands PASS.

- [ ] **Step 6: Commit the sitemap unit**

```bash
git add app/sitemap.ts lib/sitemap-date.ts scripts/sitemap-integrity.test.ts
git commit -m "fix(seo): make sitemap dates truthful"
```

### Task 2: Add exhaustive calculator-to-Worker links

**Files:**
- Create: `scripts/calculator-library-links.test.ts`
- Create: `lib/worker-seo-routes.ts`
- Modify: `lib/birth-card-calculator.ts`
- Modify: `lib/compat-pairs.ts`
- Modify: `components/seo/BirthCardCalculator.tsx`
- Modify: `components/seo/CompatibilityCalculator.tsx`

**Interfaces:**
- Produces from the client-safe module: `parseIsoCalendarDate(isoDate: string): IsoCalendarDate | null`.
- Produces from the client-safe module: `birthdayWorkerPathFromIsoDate(isoDate: string): string | null`.
- Produces from the client-safe module: `compatibilityPairPath(firstSlug: string, secondSlug: string): string | null`.
- Consumes: the Worker deck order hearts → clubs → diamonds → spades and Ace → King; a test must prove it still matches both `Object.keys(PAIRS)` and `allCardSlugs()`. Never lexical-sort card slugs.

- [ ] **Step 1: Write the failing exhaustive route test**

Create `scripts/calculator-library-links.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import PAIRS from "../lib/compat-pairs.json";
import { allCardSlugs } from "../lib/seo-cards";
import {
  birthdayWorkerPathFromIsoDate,
  compatibilityPairPath,
} from "../lib/worker-seo-routes";
import { buildBirthdayMapRows } from "./generate-cardology-birthday-map";

const root = join(import.meta.dir, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("birthday Worker paths", () => {
  test("matches all 366 public birthday dataset URLs", () => {
    const paths = new Set<string>();
    for (const row of buildBirthdayMapRows()) {
      const actual = birthdayWorkerPathFromIsoDate(`2000-${row.month_day}`);
      expect(actual).toBe(new URL(row.birthday_url).pathname);
      if (actual) paths.add(actual);
    }
    expect(paths.size).toBe(366);
  });

  test("handles boundaries and rejects invalid dates", () => {
    expect(birthdayWorkerPathFromIsoDate("2000-02-29")).toBe("/born-on/february-29");
    expect(birthdayWorkerPathFromIsoDate("2000-12-31")).toBe("/born-on/december-31");
    expect(birthdayWorkerPathFromIsoDate("2001-02-29")).toBeNull();
    expect(birthdayWorkerPathFromIsoDate("not-a-date")).toBeNull();
  });
});

describe("compatibility Worker paths", () => {
  test("keeps the compact helper order aligned with both data sources", () => {
    expect(Object.keys(PAIRS)).toEqual(allCardSlugs());
  });

  test("creates exactly 1,378 canonical unordered pairs", () => {
    const cards = allCardSlugs();
    const paths = new Set<string>();
    for (let first = 0; first < cards.length; first += 1) {
      for (let second = first; second < cards.length; second += 1) {
        const expected = `/compatibility/${cards[first]}-and-${cards[second]}`;
        expect(compatibilityPairPath(cards[first], cards[second])).toBe(expected);
        expect(compatibilityPairPath(cards[second], cards[first])).toBe(expected);
        paths.add(expected);
      }
    }
    expect(paths.size).toBe(1_378);
  });

  test("preserves same-card pairs and rejects unknown slugs", () => {
    expect(compatibilityPairPath("queen-of-hearts", "queen-of-hearts"))
      .toBe("/compatibility/queen-of-hearts-and-queen-of-hearts");
    expect(compatibilityPairPath("queen-of-hearts", "no-card")).toBeNull();
  });
});

test("calculator results use conditional plain Worker anchors", () => {
  const birth = read("components/seo/BirthCardCalculator.tsx");
  const compatibility = read("components/seo/CompatibilityCalculator.tsx");
  expect(birth).toContain("birthdate && birthdate <= todayISO()");
  expect(birth).toContain("<a\n              href={birthdayPath}");
  expect(compatibility).toContain("<a\n            href={pairPath}");
  expect(birth).toContain("Read the {birthdayLabel} birth-card page");
  expect(compatibility).toContain("Read the full {pa?.label} + {pb?.label} pairing");
  expect(birth).toContain("What&apos;s inside the Blueprint?");
  expect(compatibility).toContain('href="/cardology-compatibility"');
});
```

- [ ] **Step 2: Run the focused test and verify the red state**

Run: `bun test scripts/calculator-library-links.test.ts`

Expected: FAIL because both helper exports and both result anchors are absent.

- [ ] **Step 3: Create the small Worker-route boundary module**

Create `lib/worker-seo-routes.ts`; it must not import `compat-pairs.json`, `card-meanings.json`, the engine, React, or Next:

```ts
const MONTH_SLUGS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
] as const;

const WORKER_SUITS = ["hearts", "clubs", "diamonds", "spades"] as const;
const WORKER_RANKS = [
  "ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king",
] as const;

const WORKER_CARD_ORDER = new Map<string, number>(
  WORKER_SUITS.flatMap((suit) => WORKER_RANKS.map((rank) => `${rank}-of-${suit}`))
    .map((slug, index) => [slug, index] as const),
);

export type IsoCalendarDate = Readonly<{ year: number; month: number; day: number }>;

export function parseIsoCalendarDate(isoDate: string): IsoCalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12) return null;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day < 1 || day > days[month - 1]) return null;
  return { year, month, day };
}

export function birthdayWorkerPathFromIsoDate(isoDate: string): string | null {
  const parts = parseIsoCalendarDate(isoDate);
  if (!parts) return null;
  return `/born-on/${MONTH_SLUGS[parts.month - 1]}-${parts.day}`;
}

export function compatibilityPairPath(
  firstSlug: string,
  secondSlug: string,
): string | null {
  const firstIndex = WORKER_CARD_ORDER.get(firstSlug);
  const secondIndex = WORKER_CARD_ORDER.get(secondSlug);
  if (firstIndex === undefined || secondIndex === undefined) return null;
  const [first, second] = firstIndex <= secondIndex
    ? [firstSlug, secondSlug]
    : [secondSlug, firstSlug];
  return `/compatibility/${first}-and-${second}`;
}
```

- [ ] **Step 4: Reuse the parser and expose the server-side compatibility API**

In `lib/birth-card-calculator.ts`, import and re-export the small helpers, then replace its inline ISO parsing with `const parts = parseIsoCalendarDate(isoDate)` and call `calculateBirthCard(parts.month, parts.day)` after the null guard:

```ts
import { parseIsoCalendarDate } from "./worker-seo-routes";
export { birthdayWorkerPathFromIsoDate } from "./worker-seo-routes";

export function calculateBirthCardFromIsoDate(
  isoDate: string,
): BirthCardResult | null {
  const parts = parseIsoCalendarDate(isoDate);
  if (!parts) return null;
  return calculateBirthCard(parts.month, parts.day);
}
```

At the bottom of `lib/compat-pairs.ts`, add this server-side re-export while keeping `compatForCard` unchanged:

```ts
export { compatibilityPairPath } from "./worker-seo-routes";
```

- [ ] **Step 5: Render the birthday Worker anchor without exposing future dates**

In `BirthCardCalculator.tsx`, import `todayISO` from `@/lib/cards` and `birthdayWorkerPathFromIsoDate` from the existing birth-card calculator module. In `BirthCardResultCard`, derive:

```ts
const birthdayPath =
  birthdate && birthdate <= todayISO()
    ? birthdayWorkerPathFromIsoDate(birthdate)
    : null;
const birthdayLabel = birthdayPath
  ? new Date(`${birthdate}T00:00:00.000Z`).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    })
  : "";
```

Place this plain anchor after the Blueprint explainer link and before the card meaning link:

```tsx
{birthdayPath && (
  <a
    href={birthdayPath}
    className="text-sm font-medium text-brand-ink underline underline-offset-4"
  >
    Read the {birthdayLabel} birth-card page →
  </a>
)}
```

- [ ] **Step 6: Render the canonical compatibility-pair anchor**

Import `compatibilityPairPath` directly from `@/lib/worker-seo-routes` in `CompatibilityCalculator.tsx` so the 67KB compatibility report JSON does not enter the client bundle. Derive `const pairPath = aSlug && bSlug ? compatibilityPairPath(aSlug, bSlug) : null;`, then insert this plain anchor before the generic compatibility guide:

```tsx
{pairPath && (
  <a
    href={pairPath}
    className="text-sm font-medium text-brand-ink underline underline-offset-4"
  >
    Read the full {pa?.label} + {pb?.label} pairing →
  </a>
)}
```

- [ ] **Step 7: Run exhaustive and regression tests**

Run:

```bash
bun test scripts/calculator-library-links.test.ts
bun test scripts/generate-cardology-birthday-map.test.ts scripts/leap-day-truth.test.ts scripts/calc-chart.test.ts
bun run test
```

Expected: all commands PASS; the exhaustive test reports 366 unique birthday paths and 1,378 unique pair paths.

- [ ] **Step 8: Commit the Worker-link unit**

```bash
git add lib/worker-seo-routes.ts lib/birth-card-calculator.ts lib/compat-pairs.ts components/seo/BirthCardCalculator.tsx components/seo/CompatibilityCalculator.tsx scripts/calculator-library-links.test.ts
git commit -m "feat(seo): link calculator results to exact libraries"
```

### Task 3: Improve shared discovery and Queen-card promotion

**Files:**
- Create: `scripts/site-navigation.test.ts`
- Modify: `components/seo/SiteHeader.tsx`
- Modify: `components/seo/SiteFooter.tsx`
- Modify: `app/birth-card/page.tsx`
- Modify: `scripts/card-meaning-equity.test.ts`

**Interfaces:**
- Consumes: the existing shared `NAV_LINKS` render loop and the existing Popular card meanings array.
- Produces: Compatibility in both header nav variants; one footer how-to link; five promoted card meanings.

- [ ] **Step 1: Write failing rendered-navigation and Queen tests**

Create `scripts/site-navigation.test.ts`:

```ts
import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteFooter } from "../components/seo/SiteFooter";
import { SiteHeader } from "../components/seo/SiteHeader";

test("desktop and mobile primary nav discover compatibility", () => {
  const html = renderToStaticMarkup(createElement(SiteHeader));
  expect(html).toContain('aria-label="Primary"');
  expect(html).toContain('aria-label="Mobile primary"');
  expect(html.match(/href="\/birth-card-compatibility-calculator"/g)).toHaveLength(2);
  expect(html.match(/>Compatibility<\/a>/g)).toHaveLength(2);
});

test("footer Learn group discovers the how-to guide", () => {
  const html = renderToStaticMarkup(createElement(SiteFooter, { bare: true }));
  expect(html.match(/href="\/how-to-read-playing-cards"/g)).toHaveLength(1);
  expect(html).toContain(">How to Read Playing Cards</a>");
});
```

Extend `scripts/card-meaning-equity.test.ts` so its assertion scope is only the popular section:

```ts
const popularSource = source.slice(popular, deck);
expect(popularSource).toContain('["Queen of Hearts meaning", "/birth-card/queen-of-hearts"]');
expect(popularSource).toContain('["Queen of Clubs meaning", "/birth-card/queen-of-clubs"]');
```

- [ ] **Step 2: Run tests and verify the red state**

Run: `bun test scripts/site-navigation.test.ts scripts/card-meaning-equity.test.ts`

Expected: FAIL because the new header/footer destinations and both Queen tuples are absent.

- [ ] **Step 3: Make the minimal shared-navigation changes**

In `SiteHeader.tsx`, update the comment to five destinations and use:

```ts
const NAV_LINKS = [
  { label: "Blueprint", href: "/products/personal-card-blueprint" },
  { label: "Calculator", href: "/birth-card-calculator" },
  { label: "Compatibility", href: "/birth-card-compatibility-calculator" },
  { label: "Card Meanings", href: "/birth-card" },
  { label: "Learn", href: "/what-is-cardology" },
];
```

Because the fifth label no longer fits beside the wordmark and CTA at the 768px `md` breakpoint, keep the existing menu component but move the desktop switch to `lg`: change the primary nav’s `md:flex` to `lg:flex`, the `<details>` `md:hidden` to `lg:hidden`, and the desktop CTA wrapper’s `md:block` to `lg:block`. Do not compress, truncate, or wrap any navigation label.

In the footer Learn list, insert:

```tsx
<li><Link href="/how-to-read-playing-cards" className="hover:text-brand-ink">How to Read Playing Cards</Link></li>
```

- [ ] **Step 4: Expand Popular card meanings to exactly five links**

Use this array in `app/birth-card/page.tsx`:

```ts
[
  ["Ace of Hearts meaning", "/birth-card/ace-of-hearts"],
  ["10 of Hearts meaning", "/birth-card/10-of-hearts"],
  ["10 of Diamonds meaning", "/birth-card/10-of-diamonds"],
  ["Queen of Hearts meaning", "/birth-card/queen-of-hearts"],
  ["Queen of Clubs meaning", "/birth-card/queen-of-clubs"],
]
```

- [ ] **Step 5: Run the focused tests and commit**

Run:

```bash
bun test scripts/site-navigation.test.ts scripts/card-meaning-equity.test.ts
git add components/seo/SiteHeader.tsx components/seo/SiteFooter.tsx app/birth-card/page.tsx scripts/site-navigation.test.ts scripts/card-meaning-equity.test.ts
git commit -m "feat(seo): promote compatibility and queen meanings"
```

Expected: both tests PASS, followed by a successful commit.

### Task 4: Centralize breadcrumb structured data

**Files:**
- Create: `lib/structured-data.ts`
- Create: `scripts/structured-data.test.ts`
- Modify: `components/seo/SeoShell.tsx`
- Modify: `app/playing-card-spreads/three-card/page.tsx`
- Modify: `app/playing-card-spreads/love/page.tsx`
- Modify: `app/playing-card-spreads/yes-or-no/page.tsx`
- Modify: `app/blog/pillar/[slug]/page.tsx`
- Modify: `app/blog/[slug]/page.tsx`
- Modify: `app/birth-card/[slug]/page.tsx`

**Interfaces:**
- Produces: `BreadcrumbData = Readonly<{ name: string; href: string }>`.
- Produces: `buildBreadcrumbJsonLd(items: readonly BreadcrumbData[]): BreadcrumbListJsonLd | null`.
- Consumes: existing `SeoShell` `crumb?: { label: string; href: string }[]`; do not change caller shape.

- [ ] **Step 1: Write the failing helper and duplicate-source tests**

Create `scripts/structured-data.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildBreadcrumbJsonLd } from "../lib/structured-data";

const root = join(import.meta.dir, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("buildBreadcrumbJsonLd", () => {
  test("returns absolute same-origin items with consecutive positions", () => {
    expect(buildBreadcrumbJsonLd([
      { name: " Home ", href: "/" },
      { name: "Birth Cards", href: "/birth-card" },
      { name: "Queen of Hearts", href: "/birth-card/queen-of-hearts" },
    ])).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://cardblueprints.com/" },
        { "@type": "ListItem", position: 2, name: "Birth Cards", item: "https://cardblueprints.com/birth-card" },
        { "@type": "ListItem", position: 3, name: "Queen of Hearts", item: "https://cardblueprints.com/birth-card/queen-of-hearts" },
      ],
    });
  });

  test("omits short trails and rejects unsupported inputs", () => {
    expect(buildBreadcrumbJsonLd([{ name: "Home", href: "/" }])).toBeNull();
    expect(() => buildBreadcrumbJsonLd([
      { name: "Home", href: "/" },
      { name: "Elsewhere", href: "https://example.com/path" },
    ])).toThrow("same-origin");
    expect(() => buildBreadcrumbJsonLd([
      { name: "Home", href: "/" },
      { name: " ", href: "/bad" },
    ])).toThrow("name");
    expect(() => buildBreadcrumbJsonLd([
      { name: "Home", href: "/" },
      { name: "Bad", href: " " },
    ])).toThrow("href");
  });
});

test("SeoShell owns the single breadcrumb graph", () => {
  const shell = read("components/seo/SeoShell.tsx");
  expect(shell).toContain("buildBreadcrumbJsonLd");
  expect(shell).toContain('data-seo-breadcrumb="true"');
});

test("migrated templates contain no hand-authored BreadcrumbList", () => {
  const paths = [
    "app/playing-card-spreads/three-card/page.tsx",
    "app/playing-card-spreads/love/page.tsx",
    "app/playing-card-spreads/yes-or-no/page.tsx",
    "app/blog/pillar/[slug]/page.tsx",
    "app/blog/[slug]/page.tsx",
    "app/birth-card/[slug]/page.tsx",
  ];
  for (const path of paths) {
    expect(read(path), path).not.toContain('"@type": "BreadcrumbList"');
  }
});

test("blog post visible and machine breadcrumbs end on the current post", () => {
  const source = read("app/blog/[slug]/page.tsx");
  expect(source).toContain('{ label: post.title, href: blogPostPath(post) }');
  expect(source).not.toContain("function breadcrumbJsonLd");
});
```

- [ ] **Step 2: Run the focused test and verify the red state**

Run: `bun test scripts/structured-data.test.ts`

Expected: FAIL because `lib/structured-data.ts` and the shared graph do not exist and six template families still author breadcrumbs manually.

- [ ] **Step 3: Implement the validated pure breadcrumb builder**

Create `lib/structured-data.ts`:

```ts
import { SITE_URL } from "@/lib/site";

export type BreadcrumbData = Readonly<{ name: string; href: string }>;

export type BreadcrumbListJsonLd = Readonly<{
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: ReadonlyArray<Readonly<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>>;
}>;

export function buildBreadcrumbJsonLd(
  items: readonly BreadcrumbData[],
): BreadcrumbListJsonLd | null {
  if (items.length < 2) return null;
  const site = new URL(SITE_URL);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => {
      const name = item.name.trim();
      if (!name) throw new Error("Breadcrumb name must not be empty");
      const href = item.href.trim();
      if (!href) throw new Error("Breadcrumb href must not be empty");
      const url = new URL(href, site);
      if (!/^https?:$/.test(url.protocol) || url.origin !== site.origin) {
        throw new Error(`Breadcrumb href must be same-origin: ${item.href}`);
      }
      return {
        "@type": "ListItem" as const,
        position: index + 1,
        name,
        item: url.href,
      };
    }),
  };
}
```

- [ ] **Step 4: Make `SeoShell` emit exactly one machine breadcrumb**

Import `buildBreadcrumbJsonLd`, derive it before the return, and place its script next to the visible breadcrumb:

```tsx
const breadcrumbJsonLd = crumb
  ? buildBreadcrumbJsonLd(crumb.map(({ label, href }) => ({ name: label, href })))
  : null;

{breadcrumbJsonLd && (
  <script
    type="application/ld+json"
    data-seo-breadcrumb="true"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
  />
)}
```

Do not change the accessible visual `<nav aria-label="Breadcrumb">` behavior.

- [ ] **Step 5: Remove all six manual breadcrumb implementations**

Make these exact transformations:

- In each spread spoke, change `jsonLd` from `[BreadcrumbList, FAQPage]` to the `FAQPage` object alone and remove the now-unused `SITE_URL` import.
- In both blog templates, remove `breadcrumbJsonLd(...)` from the JSON-LD array and delete the local helper. In `app/blog/[slug]/page.tsx`, append `{ label: post.title, href: blogPostPath(post) }` to the `SeoShell` trail.
- In both render branches of `app/birth-card/[slug]/page.tsx`, remove `breadcrumbJsonLd(...)` from `jsonLd` and delete the local helper. Preserve every FAQ, Article, and VideoObject graph.

For a spread spoke, the remaining graph must have this shape:

```ts
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};
```

- [ ] **Step 6: Run focused schema and existing content tests**

Run:

```bash
bun test scripts/structured-data.test.ts
bun test scripts/card-meaning-depth.test.ts scripts/birth-card-hub-eeat.test.ts
```

Expected: all tests PASS.

- [ ] **Step 7: Commit the breadcrumb unit**

```bash
git add lib/structured-data.ts components/seo/SeoShell.tsx app/playing-card-spreads/three-card/page.tsx app/playing-card-spreads/love/page.tsx app/playing-card-spreads/yes-or-no/page.tsx app/blog/pillar/'[slug]'/page.tsx app/blog/'[slug]'/page.tsx app/birth-card/'[slug]'/page.tsx scripts/structured-data.test.ts
git commit -m "refactor(seo): centralize breadcrumb schema"
```

### Task 5: Add accurate page-type structured data

**Files:**
- Create: `scripts/page-schema.test.ts`
- Modify: `app/playing-card-spreads/page.tsx`
- Modify: `app/how-to-read-playing-cards/page.tsx`
- Modify: `app/52-card-astrology-explained/page.tsx`

**Interfaces:**
- Consumes: `SPREADS`, `SPREADS_HUB_PATH`, `SITE_URL`, existing visible titles/descriptions, and organization ID `${SITE_URL}/#organization`.
- Produces: one `CollectionPage` + nested `ItemList` on the spreads hub and one truthful `Article` graph on each guide.

- [ ] **Step 1: Write failing page-schema source contracts**

Create `scripts/page-schema.test.ts`:

```ts
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

test("spreads hub exposes its three visible spokes as an ItemList", () => {
  const source = read("app/playing-card-spreads/page.tsx");
  expect(source).toContain('"@type": "CollectionPage"');
  expect(source).toContain('"@type": "ItemList"');
  expect(source).toContain("itemListElement: SPREADS.map((spread, index)");
  expect(source).toContain("position: index + 1");
  expect(source).toContain("url: `${SITE_URL}${spread.path}`");
});

test("how-to guide has visible authorship and matching Article schema", () => {
  const source = read("app/how-to-read-playing-cards/page.tsx");
  expect(source).toContain('"@type": "Article"');
  expect(source).toContain('headline: "How to Read Playing Cards"');
  expect(source).toContain('datePublished: "2026-07-12"');
  expect(source).toContain('dateModified: "2026-08-16"');
  expect(source).toContain("Cassidy Rice");
  expect(source).toContain("Updated August 16, 2026");
});

test("52-card explainer has matching Article schema and update text", () => {
  const source = read("app/52-card-astrology-explained/page.tsx");
  expect(source).toContain('"@type": "Article"');
  expect(source).toContain("headline: TITLE");
  expect(source).toContain('datePublished: "2026-06-05"');
  expect(source).toContain('dateModified: "2026-08-16"');
  expect(source).toContain("Updated August 16, 2026");
});
```

- [ ] **Step 2: Run the test and verify the red state**

Run: `bun test scripts/page-schema.test.ts`

Expected: FAIL because none of the three page-type graphs exists and the 52-card byline still says August 15.

- [ ] **Step 3: Add `CollectionPage` + `ItemList` to the spreads hub**

Import `SITE_URL` and build this graph beside the existing FAQ graph:

```ts
const collectionPage = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Playing Card Spreads",
  description: metadata.description,
  url: `${SITE_URL}${SPREADS_HUB_PATH}`,
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: SPREADS.length,
    itemListElement: SPREADS.map((spread, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: spread.name,
      url: `${SITE_URL}${spread.path}`,
    })),
  },
};
```

Serialize `[collectionPage, faq]` in the page’s existing JSON-LD script. The list must remain sourced from the same `SPREADS` array as the visible cards.

- [ ] **Step 4: Add a visible byline and Article graph to the how-to guide**

Define `TITLE`, `DESCRIPTION`, and use them in metadata. Add:

```ts
const article = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "How to Read Playing Cards",
  description: DESCRIPTION,
  url: `${SITE_URL}/how-to-read-playing-cards`,
  mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/how-to-read-playing-cards` },
  datePublished: "2026-07-12",
  dateModified: "2026-08-16",
  author: { "@type": "Person", name: "Cassidy Rice", url: `${SITE_URL}/about` },
  publisher: { "@id": `${SITE_URL}/#organization` },
};
```

Serialize `[article, faq]`. Immediately after the H1 add visible copy containing `By Cassidy Rice · Updated August 16, 2026` with the author linked to `/about` and Methodology linked to `/methodology`.

- [ ] **Step 5: Add the equivalent Article graph to the 52-card guide**

Use:

```ts
const article = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: TITLE,
  description: DESCRIPTION,
  url: `${SITE_URL}/52-card-astrology-explained`,
  mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/52-card-astrology-explained` },
  datePublished: "2026-06-05",
  dateModified: "2026-08-16",
  author: { "@type": "Person", name: "Cassidy Rice", url: `${SITE_URL}/about` },
  publisher: { "@id": `${SITE_URL}/#organization` },
};
```

Import `SITE_URL`, serialize `[article, faq]`, and change the visible byline to `Updated August 16, 2026`.

- [ ] **Step 6: Run schema and content tests, then commit**

Run:

```bash
bun test scripts/page-schema.test.ts scripts/structured-data.test.ts scripts/calc-chart.test.ts
git add app/playing-card-spreads/page.tsx app/how-to-read-playing-cards/page.tsx app/52-card-astrology-explained/page.tsx scripts/page-schema.test.ts
git commit -m "feat(seo): add accurate page type schema"
```

Expected: all tests PASS, followed by a successful commit.

### Task 6: Suppress the Elroy timed teaser on protected mobile routes

**Files:**
- Modify: `lib/elroy/widget.ts`
- Modify: `components/elroy/ElroyLauncher.tsx`
- Modify: `scripts/elroy-widget.test.ts`
- Move: `scripts/elroy-browser.test.ts` → `scripts/elroy-browser.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `shouldScheduleElroyTeaser(pathname: string, isSmallScreen: boolean): boolean`.
- Consumes: existing `isElroyEligiblePath`, suppression storage, launcher, panel, and 10-second timer behavior.

- [ ] **Step 1: Add failing pure policy tests**

Import `shouldScheduleElroyTeaser` into `scripts/elroy-widget.test.ts` and add:

```ts
describe("shouldScheduleElroyTeaser", () => {
  const protectedPaths = [
    "/",
    "/birth-card-calculator",
    "/birth-card-compatibility-calculator",
    "/products/personal-card-blueprint",
  ];

  test("suppresses only the timed teaser on protected small screens", () => {
    for (const path of protectedPaths) {
      expect(shouldScheduleElroyTeaser(path, true)).toBe(false);
      expect(shouldScheduleElroyTeaser(`${path}?source=test`, true)).toBe(false);
      expect(shouldScheduleElroyTeaser(path === "/" ? "/" : `${path}/`, true)).toBe(false);
      expect(shouldScheduleElroyTeaser(path, false)).toBe(true);
    }
  });

  test("preserves other eligible mobile routes and whole-widget exclusions", () => {
    expect(shouldScheduleElroyTeaser("/birth-card/queen-of-hearts", true)).toBe(true);
    expect(shouldScheduleElroyTeaser("/checkout/personal-card-blueprint", false)).toBe(false);
    expect(shouldScheduleElroyTeaser("/privacy-policy", true)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the unit test and verify the red state**

Run: `bun test scripts/elroy-widget.test.ts`

Expected: FAIL because the new policy export does not exist.

- [ ] **Step 3: Implement the pure teaser policy**

In `lib/elroy/widget.ts`, add:

```ts
const MOBILE_TEASER_BLOCKED = new Set([
  "/",
  "/birth-card-calculator",
  "/birth-card-compatibility-calculator",
  "/products/personal-card-blueprint",
]);

function normalizedPath(pathname: string): string {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "");
  return path || "/";
}

export function shouldScheduleElroyTeaser(
  pathname: string,
  isSmallScreen: boolean,
): boolean {
  if (!isElroyEligiblePath(pathname)) return false;
  return !(isSmallScreen && MOBILE_TEASER_BLOCKED.has(normalizedPath(pathname)));
}
```

- [ ] **Step 4: Gate only the timer in `ElroyLauncher`**

Import the policy and add conservative viewport state:

```tsx
const [isSmallScreen, setIsSmallScreen] = useState(true);

useEffect(() => {
  const media = window.matchMedia("(max-width: 640px)");
  const update = () => setIsSmallScreen(media.matches);
  update();
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}, []);
```

Derive `const teaserEligible = eligible && shouldScheduleElroyTeaser(pathname, isSmallScreen);` and use `teaserEligible` in the timer effect’s early return and dependencies. Continue using `eligible` for the component’s final `return null` decision so the compact launcher and manual panel remain available.

- [ ] **Step 5: Add one bounded 390 × 844 browser assertion**

First run `git mv scripts/elroy-browser.test.ts scripts/elroy-browser.ts` so bare `bun test` never launches a browser or requires a server. In `scripts/elroy-browser.ts`, replace the current narrow-mobile block’s leading close action with the following sequence. It first closes the February 29 panel, runs the 390px teaser check, ends with the panel closed via Escape, and then lets the existing block continue at `await page.setViewportSize({ width: 320, height: 640 });`:

```ts
await page.click('button[aria-label="Close Elroy"]');
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/birth-card-calculator`, { waitUntil: "domcontentloaded" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector('button[aria-label="Open Elroy micro-reading"]');
await page.waitForTimeout(10_500);
assert.equal(
  await page.getByText("Want the pattern behind your birth card?").count(),
  0,
  "protected mobile route must not show the timed teaser",
);
await page.click('button[aria-label="Open Elroy micro-reading"]');
await page.waitForSelector("#elroy-birthdate");
await page.keyboard.press("Escape");
```

- [ ] **Step 6: Keep the unit and browser commands separate, then commit**

Replace the overly broad `test:elroy` glob in `package.json` with an explicit unit-only command and point the browser command at the renamed script:

```json
"test:elroy": "bun test scripts/elroy-analytics.test.ts scripts/elroy-api.test.ts scripts/elroy-contact.test.ts scripts/elroy-email.test.ts scripts/elroy-idempotency.test.ts scripts/elroy-input.test.ts scripts/elroy-reading.test.ts scripts/elroy-route.test.ts scripts/elroy-widget.test.ts",
"test:elroy:browser": "bun scripts/elroy-browser.ts"
```

Run:

```bash
bun test scripts/elroy-widget.test.ts
bun run test:elroy
git add lib/elroy/widget.ts components/elroy/ElroyLauncher.tsx scripts/elroy-widget.test.ts scripts/elroy-browser.ts package.json
git commit -m "fix(elroy): protect mobile conversion surfaces"
```

Expected: all non-browser Elroy tests PASS. The Playwright script runs in Task 8 with a local server.

### Task 7: Add an explicit production Worker contract

**Files:**
- Create: `scripts/worker-production-contract.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `birthdayWorkerPathFromIsoDate`, `compatibilityPairPath`, `BIRTHDAY_DIRECTORY_PATH`, and `COMPATIBILITY_DIRECTORY_PATH`.
- Produces: opt-in `bun run test:worker-contract`; it is not part of `bun test` or CI.

- [ ] **Step 1: Create the production contract script**

Create `scripts/worker-production-contract.ts` with the following complete implementation:

```ts
import assert from "node:assert/strict";
import { BIRTHDAY_DIRECTORY_PATH, COMPATIBILITY_DIRECTORY_PATH } from "../lib/site";
import {
  birthdayWorkerPathFromIsoDate,
  compatibilityPairPath,
} from "../lib/worker-seo-routes";

const ORIGIN = "https://cardblueprints.com";

function requiredPath(path: string | null, label: string): string {
  assert.ok(path, `${label} helper returned null`);
  return path;
}

function tagAttribute(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`${name}=["']([^"']+)["']`, "i"));
  return match?.[1] ?? null;
}

function canonicalHref(html: string): string | null {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = tagAttribute(tag, "rel")?.toLowerCase().split(/\s+/) ?? [];
    if (rel.includes("canonical")) return tagAttribute(tag, "href");
  }
  return null;
}

function robotsContent(html: string): string {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (tagAttribute(tag, "name")?.toLowerCase() === "robots") {
      return tagAttribute(tag, "content")?.toLowerCase() ?? "";
    }
  }
  return "";
}

async function checkHtml(path: string): Promise<void> {
  const url = `${ORIGIN}${path}`;
  const response = await fetch(url, { redirect: "manual" });
  assert.equal(response.status, 200, `${url}: expected HTTP 200`);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/i, `${url}: expected HTML`);
  assert.doesNotMatch(response.headers.get("x-robots-tag") ?? "", /noindex/i, `${url}: X-Robots-Tag`);
  const html = await response.text();
  assert.equal(canonicalHref(html), url, `${url}: self canonical`);
  assert.equal((html.match(/<h1\b/gi) ?? []).length, 1, `${url}: exactly one H1`);
  const robots = robotsContent(html);
  assert.match(robots, /(?:^|[,\s])index(?:[,\s]|$)/, `${url}: robots index`);
  assert.doesNotMatch(robots, /noindex/, `${url}: robots noindex`);
}

async function sitemapLocations(path: string): Promise<string[]> {
  const url = `${ORIGIN}${path}`;
  const response = await fetch(url);
  assert.equal(response.status, 200, `${url}: expected HTTP 200`);
  assert.match(response.headers.get("content-type") ?? "", /xml/i, `${url}: expected XML`);
  const xml = await response.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

async function main(): Promise<void> {
  const birthdayPaths = [
    BIRTHDAY_DIRECTORY_PATH,
    requiredPath(birthdayWorkerPathFromIsoDate("2000-01-15"), "normal birthday"),
    requiredPath(birthdayWorkerPathFromIsoDate("2000-02-29"), "leap birthday"),
    requiredPath(birthdayWorkerPathFromIsoDate("2000-12-31"), "Joker birthday"),
    requiredPath(birthdayWorkerPathFromIsoDate("2000-07-29"), "Queen of Hearts birthday"),
    requiredPath(birthdayWorkerPathFromIsoDate("2000-01-28"), "Queen of Clubs birthday"),
  ];
  const pairPaths = [
    requiredPath(compatibilityPairPath("queen-of-hearts", "queen-of-hearts"), "same pair"),
    requiredPath(compatibilityPairPath("ace-of-clubs", "queen-of-hearts"), "reversed pair"),
    requiredPath(compatibilityPairPath("ace-of-hearts", "queen-of-spades"), "cross-suit pair"),
  ];

  for (const path of [COMPATIBILITY_DIRECTORY_PATH, ...birthdayPaths, ...pairPaths]) {
    await checkHtml(path);
  }

  const birthdayLocs = await sitemapLocations("/sitemap-cardology.xml");
  const compatibilityLocs = await sitemapLocations("/sitemap-compatibility.xml");
  const birthdaySitemapUrl = `${ORIGIN}/sitemap-cardology.xml`;
  const compatibilitySitemapUrl = `${ORIGIN}/sitemap-compatibility.xml`;
  assert.equal(new Set(birthdayLocs).size, 367, `${birthdaySitemapUrl}: expected 367 unique locs`);
  assert.equal(birthdayLocs.length, 367, `${birthdaySitemapUrl}: expected 367 total locs`);
  assert.equal(new Set(compatibilityLocs).size, 1_431, `${compatibilitySitemapUrl}: expected 1431 unique locs`);
  assert.equal(compatibilityLocs.length, 1_431, `${compatibilitySitemapUrl}: expected 1431 total locs`);
  for (const path of birthdayPaths) {
    assert.ok(birthdayLocs.includes(`${ORIGIN}${path}`), `${birthdaySitemapUrl}: missing ${ORIGIN}${path}`);
  }
  for (const path of pairPaths) {
    assert.ok(compatibilityLocs.includes(`${ORIGIN}${path}`), `${compatibilitySitemapUrl}: missing ${ORIGIN}${path}`);
  }

  console.log("PASS: production Worker SEO contract");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 2: Add the explicit package command**

Add this script without changing the default `test` chain:

```json
"test:worker-contract": "bun scripts/worker-production-contract.ts"
```

- [ ] **Step 3: Run the explicit contract**

Run: `bun run test:worker-contract`

Expected: PASS with exact sitemap counts 367 and 1,431 and `PASS: production Worker SEO contract`. Any failure must name the exact production URL or invariant; do not modify or deploy the Worker in response.

- [ ] **Step 4: Commit the opt-in contract**

```bash
git add scripts/worker-production-contract.ts package.json
git commit -m "test(seo): add Worker production contract"
```

### Task 8: Add end-to-end SEO integrity coverage and run release gates

**Files:**
- Create: `scripts/seo-integrity-browser.ts`
- Move: `scripts/homepage-hero-browser.test.ts` → `scripts/homepage-hero-browser.ts`
- Modify: `package.json`
- Modify: `.github/workflows/pr-ci.yml`

**Interfaces:**
- Consumes: every preceding task’s public UI and JSON-LD output.
- Produces: `bun run test:seo:browser` for a local running app and CI coverage for all fast, network-free tests.

- [ ] **Step 1: Write the browser integrity smoke**

Create `scripts/seo-integrity-browser.ts` so bare `bun test` remains network- and browser-free:

```ts
import assert from "node:assert/strict";
import { chromium, type Page } from "playwright";
import { birthCardSlug } from "../lib/birth-card-calculator";
import { buildLifePathProfile } from "../lib/life-path";
import { compatibilityPairPath } from "../lib/worker-seo-routes";

const base = process.env.SEO_BASE_URL || "http://127.0.0.1:3577";

function collectTypes(value: unknown, type: string): unknown[] {
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const found = record["@type"] === type ? [value] : [];
  return found.concat(Object.values(record).flatMap((child) =>
    Array.isArray(child)
      ? child.flatMap((item) => collectTypes(item, type))
      : collectTypes(child, type),
  ));
}

async function jsonLd(page: Page): Promise<unknown[]> {
  return page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
    scripts.map((script) => JSON.parse(script.textContent || "null")),
  );
}

async function assertOneBreadcrumb(page: Page, path: string): Promise<void> {
  await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
  assert.equal(await page.locator('nav[aria-label="Breadcrumb"]').count(), 1, `${path}: visible breadcrumb`);
  const graphs = await jsonLd(page);
  assert.equal(graphs.flatMap((graph) => collectTypes(graph, "BreadcrumbList")).length, 1, path);
}

async function main(): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto(`${base}/birth-card-calculator`, { waitUntil: "domcontentloaded" });
  await page.fill("#bd", "2001-01-15");
  await page.click('button:has-text("Reveal my birth card")');
  await page.waitForSelector('a[href="/born-on/january-15"]');
  await page.fill("#bd", "2000-02-29");
  await page.click('button:has-text("Reveal my birth card")');
  await page.waitForSelector('a[href="/born-on/february-29"]');

  const first = "2000-01-15";
  const second = "2000-02-29";
  const firstProfile = buildLifePathProfile(first, "First");
  const secondProfile = buildLifePathProfile(second, "Second");
  assert.ok(firstProfile && secondProfile);
  const expectedPair = compatibilityPairPath(
    birthCardSlug(firstProfile.birthCard)!,
    birthCardSlug(secondProfile.birthCard)!,
  );
  assert.ok(expectedPair);

  await page.goto(`${base}/birth-card-compatibility-calculator`, { waitUntil: "domcontentloaded" });
  await page.fill("#da", first);
  await page.fill("#db", second);
  await page.click('button:has-text("Compare birth cards and Life Paths")');
  await page.waitForSelector(`a[href="${expectedPair}"]`);
  await page.fill("#da", second);
  await page.fill("#db", first);
  await page.click('button:has-text("Compare birth cards and Life Paths")');
  await page.waitForSelector(`a[href="${expectedPair}"]`);

  await page.goto(`${base}/birth-card`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('a[href="/birth-card/queen-of-hearts"]');
  await page.waitForSelector('a[href="/birth-card/queen-of-clubs"]');
  assert.ok(await page.locator('footer a[href="/how-to-read-playing-cards"]').isVisible());
  assert.equal(await page.locator('nav[aria-label="Primary"] a[href="/birth-card-compatibility-calculator"]').count(), 1);

  await page.setViewportSize({ width: 820, height: 800 });
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  assert.ok(await page.locator("summary:has-text('Menu')").isVisible());
  assert.equal(await page.locator('nav[aria-label="Primary"]').isVisible(), false);

  await page.setViewportSize({ width: 1024, height: 800 });
  await page.reload({ waitUntil: "domcontentloaded" });
  assert.ok(await page.locator('nav[aria-label="Primary"]').isVisible());
  assert.equal(await page.locator("header").evaluate((header) => header.scrollWidth <= header.clientWidth), true);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  await page.click("summary:has-text('Menu')");
  assert.ok(await page.locator('nav[aria-label="Mobile primary"] a[href="/birth-card-compatibility-calculator"]').isVisible());

  for (const path of [
    "/playing-card-spreads/three-card",
    "/blog/four-suits-in-cardology",
    "/blog/pillar/cardology-foundations",
    "/birth-card/queen-of-hearts",
  ]) {
    await assertOneBreadcrumb(page, path);
  }

  for (const [path, type] of [
    ["/playing-card-spreads", "CollectionPage"],
    ["/how-to-read-playing-cards", "Article"],
    ["/52-card-astrology-explained", "Article"],
  ] as const) {
    await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
    const graphs = await jsonLd(page);
    assert.equal(graphs.flatMap((graph) => collectTypes(graph, type)).length, 1, `${path}: ${type}`);
  }

  await browser.close();
  console.log("PASS: SEO integrity browser smoke");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 2: Add the browser command and fast tests to CI**

Add to `package.json`:

```json
"test:homepage-hero:browser": "bun scripts/homepage-hero-browser.ts",
"test:seo:browser": "bun scripts/seo-integrity-browser.ts"
```

Run `git mv scripts/homepage-hero-browser.test.ts scripts/homepage-hero-browser.ts` before changing that command. Together with Task 6’s Elroy rename, no Playwright entry point retains a `.test.ts` suffix.

Add these network-free files to the existing multiline `bun test` command in `.github/workflows/pr-ci.yml`:

```yaml
            scripts/sitemap-integrity.test.ts \
            scripts/calculator-library-links.test.ts \
            scripts/site-navigation.test.ts \
            scripts/card-meaning-equity.test.ts \
            scripts/structured-data.test.ts \
            scripts/page-schema.test.ts \
```

Remove the workflow’s stale `scripts/elroy-turnstile.test.ts` entry because that file is absent from current `main`. Update the browser-exclusion comment to name `scripts/elroy-browser.ts`, `scripts/homepage-hero-browser.ts`, and `scripts/seo-integrity-browser.ts`, then document that `scripts/worker-production-contract.ts` is intentionally opt-in because it requires production network access.

- [ ] **Step 3: Run all fast checks**

Run:

```bash
bun test
bun run test
bun test \
  scripts/sitemap-integrity.test.ts \
  scripts/calculator-library-links.test.ts \
  scripts/site-navigation.test.ts \
  scripts/card-meaning-equity.test.ts \
  scripts/structured-data.test.ts \
  scripts/page-schema.test.ts \
  scripts/elroy-widget.test.ts
bun run test:elroy
```

Expected: all commands PASS with no network access; bare `bun test` discovers only unit/source-contract files.

- [ ] **Step 4: Run the Next.js and Cloudflare build gates**

Run:

```bash
bun run build
bun run pages:build
```

Expected: both builds exit 0. If environment variables are reported missing, record the exact variable and determine whether it is a build-time requirement already documented by the repository; do not invent secrets or weaken production guards.

- [ ] **Step 5: Run both local browser smokes against one dev server**

Use the in-app browser first to inspect `/`, `/birth-card-calculator`, `/birth-card-compatibility-calculator`, and `/products/personal-card-blueprint` at 390 × 844. Confirm the timed teaser stays absent after 10 seconds, the launcher opens manually, and no primary form or CTA is covered. Use the Playwright checks below as the automated cross-check and as the fallback if in-app browser control is unavailable or unreliable.

In terminal 1:

```bash
bun run dev
```

In terminal 2 after port 3577 is ready:

```bash
SEO_BASE_URL=http://127.0.0.1:3577 bun run test:seo:browser
ELROY_BASE_URL=http://127.0.0.1:3577 bun run test:elroy:browser
```

Expected: both scripts print PASS. At 390 × 844, manually inspect `/`, `/birth-card-calculator`, `/birth-card-compatibility-calculator`, and `/products/personal-card-blueprint`: no timed teaser appears, the launcher remains visible/openable, and it does not cover the primary form or CTA.

- [ ] **Step 6: Re-run the explicit production boundary check**

Run: `bun run test:worker-contract`

Expected: PASS. This verifies the public interface only; it authorizes no Worker mutation or deployment.

- [ ] **Step 7: Commit the final verification unit**

```bash
git add scripts/seo-integrity-browser.ts scripts/homepage-hero-browser.ts package.json .github/workflows/pr-ci.yml
git commit -m "test(seo): cover keyword integrity pass"
```

- [ ] **Step 8: Review the complete diff and stop before publication**

Run:

```bash
git status --short --branch
git log --oneline --decorate -10
git diff origin/main...HEAD --stat
git diff --check origin/main...HEAD
```

Expected: only the approved docs, application, and test files are present; `git diff --check` is silent. Report the commits, tests, build results, and any non-blocking browser observations to the user. Do not run `git push`, `bun run pages:deploy`, `wrangler pages deploy`, or any equivalent publication command.
