import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { reservedPersonSlugReason } from "./src/urls";
import { buildSignerPages } from "./src/signers/build";
import { signerCheckoutHref, signerPath } from "./src/signers/urls";

const tmp = mkdtempSync(join(tmpdir(), "seo-signers-"));
const build = buildSignerPages({ outDir: tmp });

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function read(relativePath: string): string {
  return readFileSync(join(tmp, relativePath), "utf8");
}

test("builds one hub plus one page per verified signer", () => {
  expect(build.people).toHaveLength(44);
  expect(build.files).toContain("signers/index.html");
  expect(build.files).toContain("signers/john-adams/index.html");
  expect(build.files).toContain("signers/thomas-jefferson/index.html");
  expect(build.files).toContain("signers/josiah-bartlett/index.html");
  expect(build.files.some((file) => file.startsWith("birth-card/"))).toBe(false);
  expect(build.files.some((file) => file.includes("john-hancock"))).toBe(false);
  expect(build.files.some((file) => file.includes("benjamin-harrison"))).toBe(false);
  expect(build.files.some((file) => file.includes("joseph-hewes"))).toBe(false);
  expect(build.files.some((file) => file.includes("button-gwinnett"))).toBe(false);
});

test("does not emit reserved celeb or card-meaning slugs", () => {
  for (const person of build.people) {
    expect(reservedPersonSlugReason(person.slug)).toBeNull();
    expect(person.slug).not.toBe("joker");
  }
});

test("hub lists verified set, held list, year-unknown footnotes, and Deep Dive CTA", () => {
  const html = read("signers/index.html");
  expect(html).toContain("Declaration Signers’ Birth Cards");
  expect(html).toContain("44 verified signers");
  expect(html).toContain("/signers/john-adams");
  expect(html).toContain("/signers/thomas-jefferson");
  expect(html).toContain("coordinates, not fortune-telling");
  expect(html).toContain("NARA");
  expect(html).toContain("Signers Factsheet");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain("Bioguide");
  expect(html).toContain("Wikidata P569");
  expect(html).toContain("John Hancock");
  expect(html).toContain("Benjamin Harrison V");
  expect(html).toContain("Joseph Hewes");
  expect(html).toContain("Button Gwinnett");
  expect(html).toContain("day of birth is unknown");
  expect(html).toContain("Day unknown");
  expect(html).toContain(signerCheckoutHref("hub").replace("&", "&amp;"));
  expect(html).not.toContain("/create-checkout");
  expect(html).not.toContain("/signers/john-hancock");
  expect(html).not.toContain("stripe");
});

test("person page uses /signers URL, UTM, sources, and leaves /birth-card person routes alone", () => {
  const html = read("signers/thomas-jefferson/index.html");
  expect(html).toContain("Thomas Jefferson&#39;s Birth Card: The 8 of Diamonds");
  expect(html).toContain('data-slot="h1"');
  expect(html).toContain('data-slot="hook"');
  expect(html).toContain('data-slot="card-meaning"');
  expect(html).toContain('data-slot="evidence"');
  expect(html).toContain('data-slot="faq"');
  expect(html).toContain('data-slot="cta"');
  expect(html).toContain('data-slot="sources"');
  expect(html).toContain("Q11812");
  expect(html).toContain("NARA");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain("J000069");
  expect(html).toContain(signerCheckoutHref("thomas-jefferson").replace("&", "&amp;"));
  expect(html).toContain("Get the $9 Deep Dive");
  expect(html).not.toContain("/birth-card/thomas-jefferson");
  expect(html).toContain("/birth-card/");
  expect(html).not.toContain('action="/create-checkout"');
  expect(html).toContain('rel="canonical" href="https://cardblueprints.com/signers/thomas-jefferson"');

  const jsonLd = extractJsonLd(html);
  const types = (jsonLd["@graph"] as Array<Record<string, unknown>>).map((node) => node["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Person", "BreadcrumbList", "FAQPage"]));
});

test("New Style pages footnote the Old Style NARA day", () => {
  const bartlett = read("signers/josiah-bartlett/index.html");
  expect(bartlett).toContain("December 2, 1729");
  expect(bartlett).toContain("Old Style");
  expect(bartlett).toContain('data-slot="footnote"');

  const hooper = read("signers/william-hooper/index.html");
  expect(hooper).toContain("June 28, 1742");
  expect(hooper).toContain("Old Style");
});

test("path ownership keeps signers off celeb and card-meaning routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "path-ownership.json"), "utf8"),
  ) as {
    signers_isolated: { pages_will_own: string[]; must_not_own: string[] };
  };

  expect(ownership.signers_isolated.pages_will_own).toEqual(
    expect.arrayContaining(["/signers", "/signers/{slug}"]),
  );
  expect(ownership.signers_isolated.must_not_own).toEqual(
    expect.arrayContaining([
      "/birth-card/{person-slug}",
      "/birth-card/{rank}-of-{suit}",
      "/birth-card/joker",
    ]),
  );
});

test("sitemap and robots stay on /signers and do not claim celeb routes", () => {
  const sitemap = read("sitemap-signers.xml");
  expect(sitemap).toContain("https://cardblueprints.com/signers</loc>");
  expect(sitemap).toContain("https://cardblueprints.com/signers/john-adams");
  expect(sitemap).not.toContain("/birth-card/");
  expect(sitemap).not.toContain("john-hancock");

  const robots = read("robots.txt");
  expect(robots).toContain("Allow: /signers/");
  expect(robots).toContain("Disallow: /birth-card/");
  expect(robots).toContain("Disallow: /checkout");
  expect(robots).toContain("Sitemap: https://cardblueprints.com/sitemap-signers.xml");
});

test("signer checkout helper uses utm_source=signers", () => {
  expect(signerCheckoutHref("john-adams")).toBe(
    "/checkout/deep-dive?utm_source=signers&utm_content=john-adams",
  );
  expect(signerPath("john-adams")).toBe("/signers/john-adams");
});

function extractJsonLd(html: string): Record<string, unknown> {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(match).toBeTruthy();
  return JSON.parse(match![1]) as Record<string, unknown>;
}
