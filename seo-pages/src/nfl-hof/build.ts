import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_URL } from "../types";
import { renderUrlset } from "../sitemap";
import { loadCardMeanings, loadHofProvenance, loadHofRows } from "./load";
import { renderHofHub } from "./render-hub";
import { renderHofPage } from "./render-person";
import type { HofRow } from "./types";
import { NFL_HOF_HUB_PATH, NFL_HOF_SITEMAP, hofPath } from "./urls";

const SEO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_ROOT = join(SEO_ROOT, "..");

export type HofBuildOptions = {
  peoplePath?: string;
  provenancePath?: string;
  meaningsPath?: string;
  outDir?: string;
  publicDir?: string;
};

export type HofBuildResult = {
  outDir: string;
  people: HofRow[];
  files: string[];
};

export function buildHofPages(options: HofBuildOptions = {}): HofBuildResult {
  const peoplePath =
    options.peoplePath ?? join(REPO_ROOT, "pipeline", "data", "nfl_hof", "people.jsonl");
  const provenancePath =
    options.provenancePath ?? join(REPO_ROOT, "pipeline", "data", "nfl_hof", "provenance.json");
  const meaningsPath =
    options.meaningsPath ?? join(REPO_ROOT, "pipeline", "data", "card_meanings.json");
  const outDir = options.outDir ?? join(SEO_ROOT, "dist-nfl-hof");
  const publicDir = options.publicDir ?? join(SEO_ROOT, "public");

  const people = loadHofRows(peoplePath);
  const provenance = loadHofProvenance(provenancePath);
  const meanings = loadCardMeanings(meaningsPath);
  if (people.length === 0) {
    throw new Error("No NFL Hall of Fame rows loaded");
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
  write(outDir, "nfl-hof/index.html", renderHofHub(people, meanings, provenance), files);

  for (const person of people) {
    const meaning = meanings.get(person.card);
    if (!meaning) {
      throw new Error(`Missing meaning for ${person.slug}`);
    }
    const sameCard = people.filter((other) => other.slug !== person.slug && other.card === person.card);
    write(
      outDir,
      `${hofPath(person.slug).replace(/^\//, "")}/index.html`,
      renderHofPage(person, meaning, sameCard),
      files,
    );
  }

  const paths = [NFL_HOF_HUB_PATH, ...people.map((person) => hofPath(person.slug))];
  write(outDir, NFL_HOF_SITEMAP.replace(/^\//, ""), renderUrlset(paths), files);
  write(outDir, "robots.txt", hofRobotsTxt(), files);

  return { outDir, people, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const target = join(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(relativePath);
}

function hofRobotsTxt(): string {
  return `# Isolated NFL Hall of Fame birth-card scaffold.
# Do not publish this file as the origin robots.txt on cardblueprints.com.

User-agent: *
Allow: /nfl-hof/

# Celebrity person pages and live card-meaning routes stay on their owners.
# Payment and app surfaces stay on the existing Next.js origin.
Disallow: /birth-card/
Disallow: /checkout
Disallow: /checkout/
Disallow: /api/
Disallow: /create-checkout

Sitemap: ${SITE_URL}/sitemap-nfl-hof.xml
`;
}

if (import.meta.main) {
  const result = buildHofPages();
  console.log(
    `Built ${result.files.length} files for ${result.people.length} NFL HOF inductees → ${result.outDir}`,
  );
}
