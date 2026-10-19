import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chartSignupTags, normalizeChartSignup, subscribeChartLead } from "../lib/chart-signup";
import {
  BIRTHDATE_CHART_TAG,
  birthdateChartFilename,
  birthdateChartFromIsoDate,
  birthdateChartTags,
} from "../lib/birthdate-chart";

const root = join(import.meta.dir, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

test("December 31 is the Joker, never a silent King of Spades", () => {
  const chart = birthdateChartFromIsoDate("1990-12-31")!;
  expect(chart.isJoker).toBe(true);
  expect(chart.birth.code).toBe("Joker");
  expect(chart.slug).toBe("joker");
  expect(chart.ruling).toEqual([]);
  expect(chart.karma).toBeNull();
  expect(birthdateChartTags(chart, "calculator-result")).toEqual([BIRTHDATE_CHART_TAG, "calculator-result", "card-joker"]);
});

test("a normal birthday carries birth, ruling, and karma cards", () => {
  const chart = birthdateChartFromIsoDate("1990-06-15")!;
  expect(chart.birth.code).toBe("2♦");
  expect(chart.dateLabel).toBe("June 15");
  expect(chart.ruling.map((c) => c.code)).toEqual(["J♠"]);
  expect(chart.karma?.environment.code).toBe("A♦");
  expect(chart.karma?.displacement.code).toBe("6♣");
  expect(chart.strength.length).toBeGreaterThan(10);
  expect(birthdateChartFilename(chart)).toBe("card-blueprints-birthdate-chart-2-of-diamonds.png");
});

test("fixed cards carry no karma cards", () => {
  const chart = birthdateChartFromIsoDate("1990-01-01")!;
  expect(chart.birth.code).toBe("K♠");
  expect(chart.isFixed).toBe(true);
  expect(chart.karma).toBeNull();
});

test("tags never carry the birthday; invalid dates give no chart", () => {
  const chart = birthdateChartFromIsoDate("1990-06-15")!;
  for (const tag of birthdateChartTags(chart, "home-reveal")) expect(tag).not.toMatch(/\d{4}|06-15|june/i);
  expect(birthdateChartFromIsoDate("1990-02-30")).toBeNull();
});

test("the download component saves the lead through our own API, without leaving the page", () => {
  const c = read("components/seo/BirthdateChartDownload.tsx");
  expect(c).toContain("e.preventDefault()");
  expect(c).toContain('fetch("/api/chart-signup"');
  expect(c).not.toContain("buttondown.com");
  expect(c).not.toContain("action={");
  expect(c).toContain("JSON.stringify({ email, source, slug })");
  expect(read("components/seo/Reveal.tsx")).toContain('<BirthdateChartDownload birthdate={birthdate} source="home-reveal" />');
});

test("chart signup validates input and posts tags to the same Buttondown list with the server key", async () => {
  expect(() => normalizeChartSignup({ email: "nope", source: "home-reveal", slug: "joker" })).toThrow();
  expect(() => normalizeChartSignup({ email: "a@b.co", source: "elsewhere", slug: "joker" })).toThrow();
  expect(() => normalizeChartSignup({ email: "a@b.co", source: "home-reveal", slug: "1990-06-15" })).toThrow();
  const signup = normalizeChartSignup({ email: " A@B.co ", source: "calculator-result", slug: "2-of-diamonds" });
  expect(chartSignupTags(signup)).toEqual([BIRTHDATE_CHART_TAG, "calculator-result", "card-2-of-diamonds"]);
  let seen: { url: string; init: RequestInit } | null = null;
  const fake = (async (url: string, init: RequestInit) => {
    seen = { url, init };
    return new Response("{}", { status: 201 });
  }) as unknown as typeof fetch;
  await subscribeChartLead(signup, "k", "https://cardblueprints.com/", fake);
  expect(seen!.url).toBe("https://api.buttondown.com/v1/subscribers");
  expect((seen!.init.headers as Record<string, string>).Authorization).toBe("Token k");
  const body = JSON.parse(String(seen!.init.body));
  expect(body).toEqual({ email_address: "a@b.co", tags: [BIRTHDATE_CHART_TAG, "calculator-result", "card-2-of-diamonds"], referrer_url: "https://cardblueprints.com/" });
  await subscribeChartLead(signup, "k", "https://cardblueprints.com/", fake, "203.0.113.9");
  expect(JSON.parse(String(seen!.init.body)).ip_address).toBe("203.0.113.9");
  await expect(subscribeChartLead(signup, "", "x", fake)).rejects.toThrow();
  const failing = (async () => new Response("bad", { status: 400 })) as unknown as typeof fetch;
  await expect(subscribeChartLead(signup, "k", "x", failing)).rejects.toThrow();
  expect(read("app/api/chart-signup/route.ts")).toContain("process.env.BUTTONDOWN_API_KEY");
});

test("after the download the next step is the Chemistry Check on Stan, with UTM tags", async () => {
  const c = read("components/seo/BirthdateChartDownload.tsx");
  const { chemistryCheckHrefAfterChart } = await import("../components/seo/BirthdateChartDownload");
  const { CHEMISTRY_CHECK_URL } = await import("../lib/readings-nav");
  expect(chemistryCheckHrefAfterChart("home-reveal")).toBe(
    `${CHEMISTRY_CHECK_URL}?utm_source=cardblueprints&utm_medium=birthdate_chart&utm_campaign=home-reveal`,
  );
  expect(c).toContain("Get the Chemistry Check · $39");
  expect(c).not.toMatch(/Monday/);
  // The only price on the chart flow is the $39 Chemistry Check (13 × 3).
  expect([...c.matchAll(/\$(\d+)/g)].map((m) => m[1])).toEqual(["39"]);
  expect(read("components/seo/BirthCardCalculator.tsx")).toContain('<BirthdateChartDownload birthdate={reveal.birthdate} source="calculator-result" />');
});
