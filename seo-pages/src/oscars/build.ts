import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_URL } from "../types";
import { renderUrlset } from "../sitemap";
import { loadCardMeanings, loadOscarRows, loadOscarsProvenance } from "./load";
import { renderOscarsHub } from "./render-hub";
import { renderOscarPage } from "./render-person";
import type { OscarRow } from "./types";
import { OSCARS_HUB_PATH, OSCARS_SITEMAP, oscarPath } from "./urls";

const SEO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_ROOT = join(SEO_ROOT, "..");

export type OscarsBuildOptions = {
  peoplePath?: string;
  provenancePath?: string;
  meaningsPath?: string;
  outDir?: string;
  publicDir?: string;
};

export type OscarsBuildResult = {
  outDir: string;
  people: OscarRow[];
  files: string[];
};

export function buildOscarPages(options: OscarsBuildOptions = {}): OscarsBuildResult {
  const peoplePath =
    options.peoplePath ?? join(REPO_ROOT, "pipeline", "data", "oscars", "people.jsonl");
  const provenancePath =
    options.provenancePath ?? join(REPO_ROOT, "pipeline", "data", "oscars", "provenance.json");
  const meaningsPath =
    options.meaningsPath ?? join(REPO_ROOT, "pipeline", "data", "card_meanings.json");
  const outDir = options.outDir ?? join(SEO_ROOT, "dist-oscars");
  const publicDir = options.publicDir ?? join(SEO_ROOT, "public");

  const people = loadOscarRows(peoplePath);
  const provenance = loadOscarsProvenance(provenancePath);
  const meanings = loadCardMeanings(meaningsPath);
  if (people.length === 0) {
    throw new Error("No Oscar winner rows loaded");
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
  write(outDir, "oscars/index.html", renderOscarsHub(people, meanings, provenance), files);

  for (const person of people) {
    const meaning = meanings.get(person.card);
    if (!meaning) {
      throw new Error(`Missing meaning for ${person.slug}`);
    }
    const sameCard = people.filter((other) => other.slug !== person.slug && other.card === person.card);
    write(
      outDir,
      `${oscarPath(person.slug).replace(/^\//, "")}/index.html`,
      renderOscarPage(person, meaning, sameCard),
      files,
    );
  }

  const paths = [OSCARS_HUB_PATH, ...people.map((person) => oscarPath(person.slug))];
  write(outDir, OSCARS_SITEMAP.replace(/^\//, ""), renderUrlset(paths), files);
  write(outDir, "robots.txt", oscarsRobotsTxt(), files);

  return { outDir, people, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const target = join(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(relativePath);
}

function oscarsRobotsTxt(): string {
  return `# Isolated Academy Award winner birth-card scaffold.
# Do not publish this file as the origin robots.txt on cardblueprints.com.

User-agent: *
Allow: /oscars/

# Celebrity person pages and live card-meaning routes stay on their owners.
# Payment and app surfaces stay on the existing Next.js origin.
Disallow: /birth-card/
Disallow: /checkout
Disallow: /checkout/
Disallow: /api/
Disallow: /create-checkout

Sitemap: ${SITE_URL}/sitemap-oscars.xml
`;
}

if (import.meta.main) {
  const result = buildOscarPages();
  console.log(
    `Built ${result.files.length} files for ${result.people.length} Oscar winners → ${result.outDir}`,
  );
}
