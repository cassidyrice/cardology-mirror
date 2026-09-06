import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_URL } from "../types";
import { renderUrlset } from "../sitemap";
import { loadCardMeanings, loadHouseChairRows, loadHouseChairsProvenance } from "./load";
import { renderHouseChairsHub } from "./render-hub";
import { renderHouseChairPage } from "./render-person";
import type { HouseChairRow } from "./types";
import { HOUSE_CHAIRS_HUB_PATH, HOUSE_CHAIRS_SITEMAP, houseChairPath } from "./urls";

const SEO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_ROOT = join(SEO_ROOT, "..");

export type HouseChairsBuildOptions = {
  peoplePath?: string;
  provenancePath?: string;
  meaningsPath?: string;
  outDir?: string;
  publicDir?: string;
};

export type HouseChairsBuildResult = {
  outDir: string;
  people: HouseChairRow[];
  files: string[];
};

export function buildHouseChairPages(options: HouseChairsBuildOptions = {}): HouseChairsBuildResult {
  const peoplePath =
    options.peoplePath ?? join(REPO_ROOT, "pipeline", "data", "house_chairs", "people.jsonl");
  const provenancePath =
    options.provenancePath ?? join(REPO_ROOT, "pipeline", "data", "house_chairs", "provenance.json");
  const meaningsPath =
    options.meaningsPath ?? join(REPO_ROOT, "pipeline", "data", "card_meanings.json");
  const outDir = options.outDir ?? join(SEO_ROOT, "dist-house-chairs");
  const publicDir = options.publicDir ?? join(SEO_ROOT, "public");

  const people = loadHouseChairRows(peoplePath);
  const provenance = loadHouseChairsProvenance(provenancePath);
  const meanings = loadCardMeanings(meaningsPath);
  if (people.length === 0) {
    throw new Error("No house-chairs rows loaded");
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
  write(outDir, "house-chairs/index.html", renderHouseChairsHub(people, meanings, provenance), files);

  for (const person of people) {
    const meaning = meanings.get(person.card);
    if (!meaning) {
      throw new Error(`Missing meaning for ${person.slug}`);
    }
    const sameCard = people.filter((other) => other.slug !== person.slug && other.card === person.card);
    write(
      outDir,
      `${houseChairPath(person.slug).replace(/^\//, "")}/index.html`,
      renderHouseChairPage(person, meaning, sameCard),
      files,
    );
  }

  const paths = [HOUSE_CHAIRS_HUB_PATH, ...people.map((person) => houseChairPath(person.slug))];
  write(outDir, HOUSE_CHAIRS_SITEMAP.replace(/^\//, ""), renderUrlset(paths), files);
  write(outDir, "robots.txt", houseChairsRobotsTxt(), files);

  return { outDir, people, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const target = join(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(relativePath);
}

function houseChairsRobotsTxt(): string {
  return `# Isolated House leadership + standing-chair birth-card scaffold.
# Do not publish this file as the origin robots.txt on cardblueprints.com.

User-agent: *
Allow: /house-chairs/

# Celebrity person pages and live card-meaning routes stay on their owners.
# Payment and app surfaces stay on the existing Next.js origin.
Disallow: /birth-card/
Disallow: /checkout
Disallow: /checkout/
Disallow: /api/
Disallow: /create-checkout

Sitemap: ${SITE_URL}/sitemap-house-chairs.xml
`;
}

if (import.meta.main) {
  const result = buildHouseChairPages();
  console.log(
    `Built ${result.files.length} files for ${result.people.length} House leaders/chairs → ${result.outDir}`,
  );
}
