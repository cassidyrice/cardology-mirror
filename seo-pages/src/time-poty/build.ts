import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_URL } from "../types";
import { renderUrlset } from "../sitemap";
import { loadCardMeanings, loadTimePotyProvenance, loadTimePotyRows } from "./load";
import { renderTimePotyHub } from "./render-hub";
import { renderTimePotyPage } from "./render-person";
import type { TimePotyRow } from "./types";
import { TIME_POTY_HUB_PATH, TIME_POTY_SITEMAP, timePotyPath } from "./urls";

const SEO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_ROOT = join(SEO_ROOT, "..");

export type TimePotyBuildOptions = {
  peoplePath?: string;
  provenancePath?: string;
  meaningsPath?: string;
  outDir?: string;
  publicDir?: string;
};

export type TimePotyBuildResult = {
  outDir: string;
  people: TimePotyRow[];
  files: string[];
};

export function buildTimePotyPages(options: TimePotyBuildOptions = {}): TimePotyBuildResult {
  const peoplePath =
    options.peoplePath ?? join(REPO_ROOT, "pipeline", "data", "time_poty", "people.jsonl");
  const provenancePath =
    options.provenancePath ?? join(REPO_ROOT, "pipeline", "data", "time_poty", "provenance.json");
  const meaningsPath =
    options.meaningsPath ?? join(REPO_ROOT, "pipeline", "data", "card_meanings.json");
  const outDir = options.outDir ?? join(SEO_ROOT, "dist-time-poty");
  const publicDir = options.publicDir ?? join(SEO_ROOT, "public");

  const people = loadTimePotyRows(peoplePath);
  const provenance = loadTimePotyProvenance(provenancePath);
  const meanings = loadCardMeanings(meaningsPath);
  if (people.length === 0) {
    throw new Error("No TIME Person of the Year rows loaded");
  }
  for (const person of people) {
    if (!meanings.has(person.card)) {
      throw new Error(`No harvested meaning for ${person.name} card ${person.card}`);
    }
  }

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  cpSync(publicDir, outDir, { recursive: true });

  const files: string[] = [];
  write(outDir, "time-person-of-the-year/index.html", renderTimePotyHub(people, meanings, provenance), files);

  for (const person of people) {
    const meaning = meanings.get(person.card);
    if (!meaning) {
      throw new Error(`Missing meaning for ${person.slug}`);
    }
    const sameCard = people.filter((other) => other.slug !== person.slug && other.card === person.card);
    write(
      outDir,
      `${timePotyPath(person.slug).replace(/^\//, "")}/index.html`,
      renderTimePotyPage(person, meaning, sameCard),
      files,
    );
  }

  const paths = [TIME_POTY_HUB_PATH, ...people.map((person) => timePotyPath(person.slug))];
  write(outDir, TIME_POTY_SITEMAP.replace(/^\//, ""), renderUrlset(paths), files);
  write(outDir, "robots.txt", timePotyRobotsTxt(), files);

  return { outDir, people, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const target = join(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(relativePath);
}

function timePotyRobotsTxt(): string {
  return `# Isolated TIME Person of the Year birth-card scaffold.
# Do not publish this file as the origin robots.txt on cardblueprints.com.

User-agent: *
Allow: /time-person-of-the-year/

# Celebrity person pages and live card-meaning routes stay on their owners.
# Payment and app surfaces stay on the existing Next.js origin.
Disallow: /birth-card/
Disallow: /checkout
Disallow: /checkout/
Disallow: /api/
Disallow: /create-checkout

Sitemap: ${SITE_URL}/sitemap-time-person-of-the-year.xml
`;
}

if (import.meta.main) {
  const result = buildTimePotyPages();
  console.log(
    `Built ${result.files.length} files for ${result.people.length} TIME Person of the Year people → ${result.outDir}`,
  );
}
