import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_URL } from "../types";
import { renderUrlset } from "../sitemap";
import { loadAstronautRows, loadAstronautsProvenance, loadCardMeanings } from "./load";
import { renderAstronautsHub } from "./render-hub";
import { renderAstronautPage } from "./render-person";
import type { AstronautRow } from "./types";
import { ASTRONAUTS_HUB_PATH, ASTRONAUTS_SITEMAP, astronautPath } from "./urls";

const SEO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_ROOT = join(SEO_ROOT, "..");

export type AstronautsBuildOptions = {
  peoplePath?: string;
  provenancePath?: string;
  meaningsPath?: string;
  outDir?: string;
  publicDir?: string;
};

export type AstronautsBuildResult = {
  outDir: string;
  people: AstronautRow[];
  files: string[];
};

export function buildAstronautPages(options: AstronautsBuildOptions = {}): AstronautsBuildResult {
  const peoplePath =
    options.peoplePath ?? join(REPO_ROOT, "pipeline", "data", "astronauts", "people.jsonl");
  const provenancePath =
    options.provenancePath ?? join(REPO_ROOT, "pipeline", "data", "astronauts", "provenance.json");
  const meaningsPath =
    options.meaningsPath ?? join(REPO_ROOT, "pipeline", "data", "card_meanings.json");
  const outDir = options.outDir ?? join(SEO_ROOT, "dist-astronauts");
  const publicDir = options.publicDir ?? join(SEO_ROOT, "public");

  const people = loadAstronautRows(peoplePath);
  const provenance = loadAstronautsProvenance(provenancePath);
  const meanings = loadCardMeanings(meaningsPath);
  if (people.length === 0) {
    throw new Error("No NASA astronaut rows loaded");
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
  write(outDir, "astronauts/index.html", renderAstronautsHub(people, meanings, provenance), files);

  for (const person of people) {
    const meaning = meanings.get(person.card);
    if (!meaning) {
      throw new Error(`Missing meaning for ${person.slug}`);
    }
    const sameCard = people.filter((other) => other.slug !== person.slug && other.card === person.card);
    write(
      outDir,
      `${astronautPath(person.slug).replace(/^\//, "")}/index.html`,
      renderAstronautPage(person, meaning, sameCard),
      files,
    );
  }

  const paths = [ASTRONAUTS_HUB_PATH, ...people.map((person) => astronautPath(person.slug))];
  write(outDir, ASTRONAUTS_SITEMAP.replace(/^\//, ""), renderUrlset(paths), files);
  write(outDir, "robots.txt", astronautsRobotsTxt(), files);

  return { outDir, people, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const target = join(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(relativePath);
}

function astronautsRobotsTxt(): string {
  return `# Isolated NASA astronaut birth-card scaffold.
# Do not publish this file as the origin robots.txt on cardblueprints.com.

User-agent: *
Allow: /astronauts/

# Celebrity person pages and live card-meaning routes stay on their owners.
# Payment and app surfaces stay on the existing Next.js origin.
Disallow: /birth-card/
Disallow: /checkout
Disallow: /checkout/
Disallow: /api/
Disallow: /create-checkout

Sitemap: ${SITE_URL}/sitemap-astronauts.xml
`;
}

if (import.meta.main) {
  const result = buildAstronautPages();
  console.log(
    `Built ${result.files.length} files for ${result.people.length} NASA astronauts → ${result.outDir}`,
  );
}
