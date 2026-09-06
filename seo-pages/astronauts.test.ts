import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { reservedPersonSlugReason } from "./src/urls";
import { buildAstronautPages } from "./src/astronauts/build";
import { astronautCheckoutHref, astronautPath, reservedAstronautSlugReason } from "./src/astronauts/urls";

const tmp = mkdtempSync(join(tmpdir(), "seo-astronauts-"));
const build = buildAstronautPages({ outDir: tmp });

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function read(relativePath: string): string {
  return readFileSync(join(tmp, relativePath), "utf8");
}

test("builds one hub plus one page per kept astronaut", () => {
  expect(build.people.length).toBeGreaterThan(0);
  expect(build.files).toContain("astronauts/index.html");
  expect(build.files.some((file) => file.startsWith("birth-card/"))).toBe(false);
  expect(build.files.filter((file) => file.startsWith("astronauts/") && file.endsWith("/index.html"))).toHaveLength(
    build.people.length + 1,
  );
});

test("does not emit reserved celeb or card-meaning slugs", () => {
  for (const person of build.people) {
    expect(reservedAstronautSlugReason(person.slug)).toBeNull();
    expect(reservedPersonSlugReason(person.slug)).toBeNull();
    expect(person.slug).not.toBe("joker");
  }
});

test("hub lists kept people, sources, coordinate voice, and Deep Dive CTA", () => {
  const html = read("astronauts/index.html");
  expect(html).toContain("NASA Astronauts’ Birth Cards");
  expect(html).toContain(`${build.people.length} people`);
  expect(html).toContain("coordinates, not fortune-telling");
  expect(html).toContain("Wikidata CC0");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain("nasa.gov/astronauts");
  expect(html).toContain("astronaut-fact-book");
  expect(html).toContain(astronautCheckoutHref("hub").replace("&", "&amp;"));
  expect(html).not.toContain("/create-checkout");
  expect(html).not.toContain("stripe");
});

test("person pages use /astronauts URLs, UTM, sources, and leave /birth-card person routes alone", () => {
  const sample = build.people[0];
  expect(sample).toBeTruthy();
  const html = read(`astronauts/${sample.slug}/index.html`);
  expect(html).toContain(`${sample.name}&#39;s Birth Card:`);
  expect(html).toContain(sample.qid);
  expect(html).toContain("Wikidata CC0");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain("NASA astronaut biography");
  expect(html).toContain(astronautCheckoutHref(sample.slug).replace("&", "&amp;"));
  expect(html).toContain("Get the $9 Deep Dive");
  expect(html).not.toContain(`/birth-card/${sample.slug}`);
  expect(html).toContain("/birth-card/");
  expect(html).not.toContain('action="/create-checkout"');
  expect(html).toContain(`rel="canonical" href="https://cardblueprints.com/astronauts/${sample.slug}"`);
  expect(html).toContain('data-slot="sources"');
  expect(html).toContain("coordinates, not fortune-telling");

  const jsonLd = extractJsonLd(html);
  const types = (jsonLd["@graph"] as Array<Record<string, unknown>>).map((node) => node["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Person", "BreadcrumbList", "FAQPage"]));
});

test("Armstrong page is present when NASA+Wikidata day dates match", () => {
  const armstrong = build.people.find(
    (person) => person.slug === "neil-a-armstrong" || person.slug === "neil-armstrong",
  );
  if (!armstrong) return;
  const html = read(`astronauts/${armstrong.slug}/index.html`);
  expect(html).toContain("Neil");
  expect(html).toContain("Armstrong");
  expect(html).toContain("1930");
  expect(html).toContain("8 of Diamonds");
  expect(html).toContain(astronautPath(armstrong.slug));
});

test("December 31 astronauts render the D1 Joker lineage note", () => {
  const jokers = build.people.filter((person) => person.card === "Joker" || person.birth_date.endsWith("-12-31"));
  for (const person of jokers) {
    const html = read(`astronauts/${person.slug}/index.html`);
    expect(html).toContain("Joker");
    expect(html).toContain('data-cass-lock="D1"');
    expect(html).toContain("December 31");
  }
});

test("path ownership keeps astronauts off celeb and card-meaning routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "path-ownership.json"), "utf8"),
  ) as {
    astronauts_isolated: { pages_will_own: string[]; must_not_own: string[] };
  };

  expect(ownership.astronauts_isolated.pages_will_own).toEqual(
    expect.arrayContaining(["/astronauts", "/astronauts/{slug}"]),
  );
  expect(ownership.astronauts_isolated.must_not_own).toEqual(
    expect.arrayContaining([
      "/birth-card/{person-slug}",
      "/birth-card/{rank}-of-{suit}",
      "/birth-card/joker",
    ]),
  );
});

test("sitemap and robots stay on /astronauts and do not claim celeb routes", () => {
  const sitemap = read("sitemap-astronauts.xml");
  expect(sitemap).toContain("https://cardblueprints.com/astronauts</loc>");
  expect(sitemap).not.toContain("/birth-card/");
  if (build.people[0]) {
    expect(sitemap).toContain(`https://cardblueprints.com/astronauts/${build.people[0].slug}`);
  }

  const robots = read("robots.txt");
  expect(robots).toContain("Allow: /astronauts/");
  expect(robots).toContain("Disallow: /birth-card/");
  expect(robots).toContain("Disallow: /checkout");
  expect(robots).toContain("Sitemap: https://cardblueprints.com/sitemap-astronauts.xml");
});

function extractJsonLd(html: string): Record<string, unknown> {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(match).toBeTruthy();
  return JSON.parse(match![1]) as Record<string, unknown>;
}
