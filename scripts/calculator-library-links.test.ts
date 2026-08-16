import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import PAIRS from "../lib/compat-pairs.json";
import { allCardSlugs } from "../lib/seo-cards";
import {
  birthdayWorkerPathFromIsoDate,
  compatibilityPairPath,
  parseIsoCalendarDate,
} from "../lib/worker-seo-routes";
import { buildBirthdayMapRows } from "./generate-cardology-birthday-map";

const root = join(import.meta.dir, "..");

test("every leap-year calendar date maps to its exact birthday-library path", () => {
  const paths = buildBirthdayMapRows().map((row) => {
    const path = birthdayWorkerPathFromIsoDate(`2000-${row.month_day}`);
    expect(path).toBe(new URL(row.birthday_url).pathname);
    return path;
  });

  expect(paths).toHaveLength(366);
  expect(new Set(paths).size).toBe(366);
});

test("birthday-library paths include leap day and the Joker boundary", () => {
  expect(birthdayWorkerPathFromIsoDate("2000-02-29")).toBe(
    "/born-on/february-29",
  );
  expect(birthdayWorkerPathFromIsoDate("2000-12-31")).toBe(
    "/born-on/december-31",
  );
});

test("ISO calendar parsing rejects malformed and impossible dates", () => {
  expect(parseIsoCalendarDate("2000-02-29")).toEqual({
    year: 2000,
    month: 2,
    day: 29,
  });
  expect(parseIsoCalendarDate("1900-02-29")).toBeNull();
  expect(parseIsoCalendarDate("2001-04-31")).toBeNull();
  expect(parseIsoCalendarDate("0000-01-01")).toBeNull();
  expect(parseIsoCalendarDate("2000-2-29")).toBeNull();
  expect(parseIsoCalendarDate("not-a-date")).toBeNull();
  expect(birthdayWorkerPathFromIsoDate("1900-02-29")).toBeNull();
  expect(birthdayWorkerPathFromIsoDate("2000/02/29")).toBeNull();
});

test("the compact Worker route deck order matches the generated pair library", () => {
  expect(Object.keys(PAIRS)).toEqual(allCardSlugs());
});

test("every unordered card pair maps to one canonical compatibility path", () => {
  const cards = allCardSlugs();
  const paths = new Set<string>();

  for (let i = 0; i < cards.length; i += 1) {
    for (let j = i; j < cards.length; j += 1) {
      const expected = `/compatibility/${cards[i]}-and-${cards[j]}`;
      const forward = compatibilityPairPath(cards[i], cards[j]);
      const reversed = compatibilityPairPath(cards[j], cards[i]);

      expect(forward).toBe(expected);
      expect(reversed).toBe(expected);
      paths.add(forward!);
    }
  }

  expect(paths.size).toBe(1_378);
});

test("compatibility paths allow same cards and reject unknown slugs", () => {
  expect(
    compatibilityPairPath("queen-of-hearts", "queen-of-hearts"),
  ).toBe("/compatibility/queen-of-hearts-and-queen-of-hearts");
  expect(compatibilityPairPath("not-a-card", "queen-of-hearts")).toBeNull();
  expect(compatibilityPairPath("queen-of-hearts", "not-a-card")).toBeNull();
});

test("calculator results expose guarded plain anchors to the exact Worker libraries", () => {
  const birthSource = readFileSync(
    join(root, "components", "seo", "BirthCardCalculator.tsx"),
    "utf8",
  );
  const compatibilitySource = readFileSync(
    join(root, "components", "seo", "CompatibilityCalculator.tsx"),
    "utf8",
  );
  const routeSource = readFileSync(
    join(root, "lib", "worker-seo-routes.ts"),
    "utf8",
  );

  expect(birthSource).toMatch(
    /import\s*{\s*parseCard,\s*todayISO\s*}\s*from\s*"@\/lib\/cards"/,
  );
  expect(birthSource).toMatch(
    /import\s*{[^}]*birthdayWorkerPathFromIsoDate[^}]*}\s*from\s*"@\/lib\/birth-card-calculator"/s,
  );
  expect(birthSource).toMatch(
    /const\s+birthdayPath\s*=\s*birthdate\s*&&\s*birthdate\s*<=\s*todayISO\(\)\s*\?\s*birthdayWorkerPathFromIsoDate\(birthdate\)\s*:\s*null/,
  );
  expect(birthSource).toMatch(
    /new Date\(`\$\{birthdate}T00:00:00\.000Z`\)\.toLocaleDateString\(\s*"en-US",\s*{[^}]*month:\s*"long"[^}]*day:\s*"numeric"[^}]*timeZone:\s*"UTC"/s,
  );
  expect(birthSource).toMatch(
    /{birthdayPath\s*&&\s*\(\s*<a\s+href={birthdayPath}[^>]*>\s*Read the\s+{birthdayLabel}\s+birth-card page →\s*<\/a>\s*\)}/s,
  );
  expect(birthSource).not.toMatch(
    /<Link\b[^>]*\bhref={birthdayPath}/s,
  );

  const blueprintExplainer = birthSource.indexOf(
    'href="/products/personal-card-blueprint"',
  );
  const birthdayDestination = birthSource.indexOf("href={birthdayPath}");
  const cardMeaning = birthSource.indexOf('href={`/birth-card/${slug}`}');
  expect(blueprintExplainer).toBeGreaterThan(-1);
  expect(birthdayDestination).toBeGreaterThan(blueprintExplainer);
  expect(cardMeaning).toBeGreaterThan(birthdayDestination);
  expect(birthSource).toContain("href={checkoutHref}");
  expect(birthSource).toContain("Get My Blueprint");

  expect(compatibilitySource).toMatch(
    /import\s*{\s*compatibilityPairPath\s*}\s*from\s*"@\/lib\/worker-seo-routes"/,
  );
  expect(compatibilitySource).not.toMatch(
    /from\s*["']@\/lib\/compat-pairs["']/,
  );
  expect(compatibilitySource).toMatch(
    /const\s+pairPath\s*=\s*aSlug\s*&&\s*bSlug\s*\?\s*compatibilityPairPath\(aSlug,\s*bSlug\)\s*:\s*null/,
  );
  expect(compatibilitySource).toMatch(
    /{pairPath\s*&&\s*\(\s*<a\s+href={pairPath}[^>]*>\s*Read the full\s+{pa\?\.label}\s*\+\s*{pb\?\.label}\s+pairing →\s*<\/a>\s*\)}/s,
  );
  expect(compatibilitySource).not.toMatch(
    /<Link\b[^>]*\bhref={pairPath}/s,
  );

  const pairDestination = compatibilitySource.indexOf("href={pairPath}");
  const genericGuide = compatibilitySource.indexOf(
    'href="/cardology-compatibility"',
  );
  expect(pairDestination).toBeGreaterThan(-1);
  expect(genericGuide).toBeGreaterThan(pairDestination);
  expect(compatibilitySource).toContain("href={checkoutHref}");
  expect(compatibilitySource).toContain('href={`/birth-card/${aSlug}`}');
  expect(compatibilitySource).toContain('href={`/birth-card/${bSlug}`}');

  expect(routeSource).not.toMatch(
    /compat-pairs\.json|card-meanings\.json|engine(?:-core)?|from\s*["'](?:react|next(?:\/|["']))/,
  );
});
