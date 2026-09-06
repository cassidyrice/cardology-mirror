import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_URL } from "../types";
import { renderUrlset } from "../sitemap";
import { loadCardMeanings, loadSenatorRows, loadSenatorsProvenance } from "./load";
import { renderSenatorsHub } from "./render-hub";
import { renderSenatorPage } from "./render-person";
import type { SenatorRow } from "./types";
import { SENATORS_HUB_PATH, SENATORS_SITEMAP, senatorPath } from "./urls";

const SEO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_ROOT = join(SEO_ROOT, "..");

export type SenatorsBuildOptions = {
  peoplePath?: string;
  provenancePath?: string;
  meaningsPath?: string;
  outDir?: string;
  publicDir?: string;
};

export type SenatorsBuildResult = {
  outDir: string;
  people: SenatorRow[];
  files: string[];
};

export function buildSenatorPages(options: SenatorsBuildOptions = {}): SenatorsBuildResult {
  const peoplePath =
    options.peoplePath ?? join(REPO_ROOT, "pipeline", "data", "senators", "people.jsonl");
  const provenancePath =
    options.provenancePath ?? join(REPO_ROOT, "pipeline", "data", "senators", "provenance.json");
  const meaningsPath =
    options.meaningsPath ?? join(REPO_ROOT, "pipeline", "data", "card_meanings.json");
  const outDir = options.outDir ?? join(SEO_ROOT, "dist-senators");
  const publicDir = options.publicDir ?? join(SEO_ROOT, "public");

  const people = loadSenatorRows(peoplePath);
  const provenance = loadSenatorsProvenance(provenancePath);
  const meanings = loadCardMeanings(meaningsPath);
  if (people.length === 0) {
    throw new Error("No senator rows loaded");
  }
  if (people.length !== 99) {
    throw new Error(`Expected 99 verified sitting senators, got ${people.length}`);
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
  write(outDir, "senators/index.html", renderSenatorsHub(people, meanings, provenance), files);

  for (const person of people) {
    const meaning = meanings.get(person.card);
    if (!meaning) {
      throw new Error(`Missing meaning for ${person.slug}`);
    }
    const sameCard = people.filter((other) => other.slug !== person.slug && other.card === person.card);
    write(
      outDir,
      `${senatorPath(person.slug).replace(/^\//, "")}/index.html`,
      renderSenatorPage(person, meaning, sameCard),
      files,
    );
  }

  const paths = [SENATORS_HUB_PATH, ...people.map((person) => senatorPath(person.slug))];
  write(outDir, SENATORS_SITEMAP.replace(/^\//, ""), renderUrlset(paths), files);
  write(outDir, "robots.txt", senatorsRobotsTxt(), files);

  return { outDir, people, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const target = join(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(relativePath);
}

function senatorsRobotsTxt(): string {
  return `# Isolated current-senators birth-card scaffold.
# Do not publish this file as the origin robots.txt on cardblueprints.com.

User-agent: *
Allow: /senators/

# Celebrity person pages and live card-meaning routes stay on their owners.
# Payment and app surfaces stay on the existing Next.js origin.
Disallow: /birth-card/
Disallow: /checkout
Disallow: /checkout/
Disallow: /api/
Disallow: /create-checkout

Sitemap: ${SITE_URL}/sitemap-senators.xml
`;
}

if (import.meta.main) {
  const result = buildSenatorPages();
  console.log(
    `Built ${result.files.length} files for ${result.people.length} senators → ${result.outDir}`,
  );
}
