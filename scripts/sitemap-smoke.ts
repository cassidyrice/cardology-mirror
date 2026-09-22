/**
 * Offline smoke for the application sitemap generator.
 * CI runs this via `bun test scripts/sitemap-integrity.test.ts` and this script
 * so generation crashes fail the pipeline before deploy.
 *
 * Usage: bun scripts/sitemap-smoke.ts
 */
import {
  buildApplicationSitemapEntries,
  renderApplicationSitemapXml,
} from "../lib/application-sitemap";
import { SITE_URL } from "../lib/site";

const REQUIRED_PATHS = [
  "/",
  "/what-is-cardology",
  "/birth-card/ace-of-hearts",
  "/products/one-question-reading",
  "/birth-card-calculator",
  "/card-of-the-day",
  "/blog",
  "/explore",
  "/destiny-cards",
  "/karma-cards",
];

function fail(message: string): never {
  console.error(`sitemap-smoke FAILED: ${message}`);
  process.exit(1);
}

const entries = buildApplicationSitemapEntries();
if (entries.length < 50) {
  fail(`expected ≥50 URLs, got ${entries.length}`);
}

const xml = renderApplicationSitemapXml();
if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
  fail("missing urlset root");
}
if (!xml.trimEnd().endsWith("</urlset>")) {
  fail("urlset not closed");
}

const locs = new Set(
  [...xml.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc>/gi)].map((m) => m[1].trim()),
);

for (const path of REQUIRED_PATHS) {
  const url = path === "/" ? SITE_URL : `${SITE_URL}${path}`;
  if (!locs.has(url)) {
    fail(`missing required URL ${url}`);
  }
}

const legacyReport = `${SITE_URL}/products/blueprint-report`;
if (locs.has(legacyReport)) {
  fail(`optional Blueprint Report must stay off the main sitemap: ${legacyReport}`);
}

console.log(
  `sitemap-smoke OK: ${entries.length} URLs, ${xml.length} bytes, urlset well-formed`,
);
