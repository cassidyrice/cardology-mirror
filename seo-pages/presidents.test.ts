import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { reservedPersonSlugReason } from "./src/urls";
import { buildPresidentPages } from "./src/presidents/build";
import { presidentCheckoutHref, presidentPath } from "./src/presidents/urls";

const tmp = mkdtempSync(join(tmpdir(), "seo-presidents-"));
const build = buildPresidentPages({ outDir: tmp });

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function read(relativePath: string): string {
  return readFileSync(join(tmp, relativePath), "utf8");
}

test("builds one hub plus one page per president person", () => {
  expect(build.people).toHaveLength(45);
  expect(build.files).toContain("presidents/index.html");
  expect(build.files).toContain("presidents/george-washington/index.html");
  expect(build.files).toContain("presidents/donald-trump/index.html");
  expect(build.files).toContain("presidents/grover-cleveland/index.html");
  expect(build.files.some((file) => file.startsWith("birth-card/"))).toBe(false);
});

test("does not emit reserved celeb or card-meaning slugs", () => {
  for (const person of build.people) {
    expect(reservedPersonSlugReason(person.slug)).toBeNull();
    expect(person.slug).not.toBe("joker");
  }
});

test("hub lists 45 people, 47-presidency note, sources, and Deep Dive CTA", () => {
  const html = read("presidents/index.html");
  expect(html).toContain("US Presidents’ Birth Cards");
  expect(html).toContain("45 people");
  expect(html).toContain("47 presidencies");
  expect(html).toContain("/presidents/george-washington");
  expect(html).toContain("/presidents/grover-cleveland");
  expect(html).toContain("coordinates, not fortune-telling");
  expect(html).toContain("Wikidata CC0");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain("/checkout/deep-dive?utm_source=presidents&amp;utm_content=hub");
  expect(html).not.toContain("/create-checkout");
});

test("person page uses presidents URL, UTM, sources, and leaves /birth-card person routes alone", () => {
  const html = read("presidents/abraham-lincoln/index.html");
  expect(html).toContain("Abraham Lincoln&#39;s Birth Card: The King of Diamonds");
  expect(html).toContain('data-slot="h1"');
  expect(html).toContain('data-slot="hook"');
  expect(html).toContain('data-slot="card-meaning"');
  expect(html).toContain('data-slot="evidence"');
  expect(html).toContain('data-slot="faq"');
  expect(html).toContain('data-slot="cta"');
  expect(html).toContain('data-slot="sources"');
  expect(html).toContain("Q91");
  expect(html).toContain("Wikidata CC0");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain(presidentCheckoutHref("abraham-lincoln").replace("&", "&amp;"));
  expect(html).toContain("Get the $9 Deep Dive");
  expect(html).not.toContain("/birth-card/abraham-lincoln");
  expect(html).toContain("/birth-card/");
  expect(html).not.toContain('action="/create-checkout"');
  expect(html).toContain('rel="canonical" href="https://cardblueprints.com/presidents/abraham-lincoln"');

  const jsonLd = extractJsonLd(html);
  const types = (jsonLd["@graph"] as Array<Record<string, unknown>>).map((node) => node["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Person", "BreadcrumbList", "FAQPage"]));
});

test("Cleveland and Trump are one person page each with both ordinals", () => {
  const cleveland = read("presidents/grover-cleveland/index.html");
  expect(cleveland).toContain("22nd");
  expect(cleveland).toContain("24th");
  expect(cleveland).toContain(presidentPath("grover-cleveland"));

  const trump = read("presidents/donald-trump/index.html");
  expect(trump).toContain("45th");
  expect(trump).toContain("47th");
});

test("path ownership keeps presidents off celeb and card-meaning routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "path-ownership.json"), "utf8"),
  ) as {
    presidents_isolated: { pages_will_own: string[]; must_not_own: string[] };
  };

  expect(ownership.presidents_isolated.pages_will_own).toEqual(
    expect.arrayContaining(["/presidents", "/presidents/{slug}"]),
  );
  expect(ownership.presidents_isolated.must_not_own).toEqual(
    expect.arrayContaining([
      "/birth-card/{person-slug}",
      "/birth-card/{rank}-of-{suit}",
      "/birth-card/joker",
    ]),
  );
});

test("sitemap and robots stay on /presidents and do not claim celeb routes", () => {
  const sitemap = read("sitemap-presidents.xml");
  expect(sitemap).toContain("https://cardblueprints.com/presidents</loc>");
  expect(sitemap).toContain("https://cardblueprints.com/presidents/george-washington");
  expect(sitemap).not.toContain("/birth-card/");

  const robots = read("robots.txt");
  expect(robots).toContain("Allow: /presidents/");
  expect(robots).toContain("Disallow: /birth-card/");
  expect(robots).toContain("Disallow: /checkout");
  expect(robots).toContain("Sitemap: https://cardblueprints.com/sitemap-presidents.xml");
});

function extractJsonLd(html: string): Record<string, unknown> {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(match).toBeTruthy();
  return JSON.parse(match![1]) as Record<string, unknown>;
}
