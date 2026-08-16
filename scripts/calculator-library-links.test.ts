import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BirthdayWorkerAnchor } from "../components/seo/BirthCardCalculator";
import { CompatibilityWorkerAnchor } from "../components/seo/CompatibilityCalculator";
import PAIRS from "../lib/compat-pairs.json";
import { calculateBirthCardRevealFromIsoDate } from "../lib/birth-card-calculator";
import { allCardSlugs } from "../lib/seo-cards";
import {
  birthdayWorkerLinkForReveal,
  birthdayWorkerPathFromIsoDate,
  compatibilityPairPath,
  parseIsoCalendarDate,
} from "../lib/worker-seo-routes";
import { buildBirthdayMapRows } from "./generate-cardology-birthday-map";

const root = join(import.meta.dir, "..");

test("a revealed birth-card snapshot changes only on the next valid submission", () => {
  let liveInput = "2000-02-29";
  let storedReveal = calculateBirthCardRevealFromIsoDate(liveInput);

  expect(storedReveal?.birthdate).toBe("2000-02-29");
  expect(storedReveal?.result.birthCard).toBe("9♣");

  liveInput = "2000-03-01";
  expect(storedReveal?.birthdate).toBe("2000-02-29");
  expect(storedReveal?.result.birthCard).toBe("9♣");

  storedReveal = calculateBirthCardRevealFromIsoDate(liveInput);
  expect(storedReveal?.birthdate).toBe("2000-03-01");
  expect(storedReveal?.result.birthCard).not.toBe("9♣");
});

test("invalid and incomplete submissions cannot create reveal snapshots", () => {
  expect(calculateBirthCardRevealFromIsoDate("2001-02-29")).toBeNull();
  expect(calculateBirthCardRevealFromIsoDate("2000-02")).toBeNull();
  expect(calculateBirthCardRevealFromIsoDate("")).toBeNull();
});

test("a reveal from the fixed current day gets its exact UTC-safe Worker link", () => {
  expect(birthdayWorkerLinkForReveal("2026-08-16", "2026-08-16")).toEqual({
    href: "/born-on/august-16",
    label: "August 16",
  });
  expect(birthdayWorkerLinkForReveal("2000-01-01", "2026-08-16")).toEqual({
    href: "/born-on/january-1",
    label: "January 1",
  });
});

test("future, invalid, and incomplete reveals have no Worker link", () => {
  expect(birthdayWorkerLinkForReveal("2026-08-17", "2026-08-16")).toBeNull();
  expect(birthdayWorkerLinkForReveal("2026-02-29", "2026-08-16")).toBeNull();
  expect(birthdayWorkerLinkForReveal("2026-08", "2026-08-16")).toBeNull();
  expect(birthdayWorkerLinkForReveal("", "2026-08-16")).toBeNull();
});

test("the birthday result renders its Worker anchor only for an eligible reveal", () => {
  let liveInput = "2000-02-29";
  let storedReveal = calculateBirthCardRevealFromIsoDate(liveInput)!;
  const firstReveal = renderToStaticMarkup(
    createElement(BirthdayWorkerAnchor, {
      reveal: storedReveal,
      todayIso: "2026-08-16",
    }),
  );
  expect(firstReveal).toMatch(
    /^<a\b(?=[^>]*\bhref="\/born-on\/february-29")[^>]*>Read the February 29 birth-card page →<\/a>$/,
  );

  liveInput = "2000-03-01";
  const afterEdit = renderToStaticMarkup(
    createElement(BirthdayWorkerAnchor, {
      reveal: storedReveal,
      todayIso: "2026-08-16",
    }),
  );
  expect(afterEdit).toBe(firstReveal);

  storedReveal = calculateBirthCardRevealFromIsoDate(liveInput)!;
  const afterSubmit = renderToStaticMarkup(
    createElement(BirthdayWorkerAnchor, {
      reveal: storedReveal,
      todayIso: "2026-08-16",
    }),
  );
  expect(afterSubmit).toMatch(
    /^<a\b(?=[^>]*\bhref="\/born-on\/march-1")[^>]*>Read the March 1 birth-card page →<\/a>$/,
  );

  const nextDay = renderToStaticMarkup(
    createElement(BirthdayWorkerAnchor, {
      reveal: calculateBirthCardRevealFromIsoDate("2026-08-17")!,
      todayIso: "2026-08-16",
    }),
  );
  expect(nextDay).toBe("");
});

test("the compatibility result renders one canonical Worker pair anchor", () => {
  const markup = renderToStaticMarkup(
    createElement(CompatibilityWorkerAnchor, {
      firstSlug: "ace-of-clubs",
      secondSlug: "king-of-hearts",
      firstLabel: "Ace of Clubs",
      secondLabel: "King of Hearts",
    }),
  );
  expect(markup).toMatch(
    /^<a\b(?=[^>]*\bhref="\/compatibility\/king-of-hearts-and-ace-of-clubs")[^>]*>Read the full Ace of Clubs \+ King of Hearts pairing →<\/a>$/,
  );

  const unknown = renderToStaticMarkup(
    createElement(CompatibilityWorkerAnchor, {
      firstSlug: "not-a-card",
      secondSlug: "king-of-hearts",
      firstLabel: "Unknown",
      secondLabel: "King of Hearts",
    }),
  );
  expect(unknown).toBe("");
});

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

test("calculator Worker links keep a client-safe import boundary and plain anchors", () => {
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
    /<a\b[^>]*\bhref={birthdayLink\.href}/s,
  );
  expect(birthSource).not.toMatch(
    /<Link\b[^>]*\bhref={birthdayLink\.href}/s,
  );

  expect(compatibilitySource).toMatch(
    /import\s*{\s*compatibilityPairPath\s*}\s*from\s*"@\/lib\/worker-seo-routes"/,
  );
  expect(compatibilitySource).not.toMatch(
    /from\s*["']@\/lib\/compat-pairs["']/,
  );
  expect(compatibilitySource).toMatch(
    /<a\b[^>]*\bhref={pairPath}/s,
  );
  expect(compatibilitySource).not.toMatch(
    /<Link\b[^>]*\bhref={pairPath}/s,
  );

  expect(routeSource).not.toMatch(
    /compat-pairs\.json|card-meanings\.json|engine(?:-core)?|from\s*["'](?:react|next(?:\/|["']))/,
  );
});
