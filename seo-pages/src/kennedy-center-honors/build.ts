import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_URL } from "../types";
import { renderUrlset } from "../sitemap";
import { loadCardMeanings, loadKennedyCenterProvenance, loadKennedyCenterRows } from "./load";
import { renderKennedyCenterHub } from "./render-hub";
import { renderKennedyCenterPage } from "./render-person";
import type { KennedyCenterRow } from "./types";
import { KENNEDY_CENTER_HUB_PATH, KENNEDY_CENTER_SITEMAP, kennedyCenterPath } from "./urls";

const SEO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_ROOT = join(SEO_ROOT, "..");

export type KennedyCenterBuildOptions = {
  peoplePath?: string;
  provenancePath?: string;
  meaningsPath?: string;
  outDir?: string;
  publicDir?: string;
};

export type KennedyCenterBuildResult = {
  outDir: string;
  people: KennedyCenterRow[];
  files: string[];
};

export function buildKennedyCenterPages(options: KennedyCenterBuildOptions = {}): KennedyCenterBuildResult {
  const peoplePath =
    options.peoplePath ?? join(REPO_ROOT, "pipeline", "data", "kennedy_center_honors", "people.jsonl");
  const provenancePath =
    options.provenancePath ?? join(REPO_ROOT, "pipeline", "data", "kennedy_center_honors", "provenance.json");
  const meaningsPath =
    options.meaningsPath ?? join(REPO_ROOT, "pipeline", "data", "card_meanings.json");
  const outDir = options.outDir ?? join(SEO_ROOT, "dist-kennedy-center-honors");
  const publicDir = options.publicDir ?? join(SEO_ROOT, "public");

  const people = loadKennedyCenterRows(peoplePath);
  const provenance = loadKennedyCenterProvenance(provenancePath);
  const meanings = loadCardMeanings(meaningsPath);
  if (people.length === 0) {
    throw new Error("No Kennedy Center Honors rows loaded");
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
  write(outDir, "kennedy-center-honors/index.html", renderKennedyCenterHub(people, meanings, provenance), files);

  for (const person of people) {
    const meaning = meanings.get(person.card);
    if (!meaning) {
      throw new Error(`Missing meaning for ${person.slug}`);
    }
    const sameCard = people.filter((other) => other.slug !== person.slug && other.card === person.card);
    write(
      outDir,
      `${kennedyCenterPath(person.slug).replace(/^\//, "")}/index.html`,
      renderKennedyCenterPage(person, meaning, sameCard),
      files,
    );
  }

  const paths = [KENNEDY_CENTER_HUB_PATH, ...people.map((person) => kennedyCenterPath(person.slug))];
  write(outDir, KENNEDY_CENTER_SITEMAP.replace(/^\//, ""), renderUrlset(paths), files);
  write(outDir, "robots.txt", kennedyCenterRobotsTxt(), files);

  return { outDir, people, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const target = join(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(relativePath);
}

function kennedyCenterRobotsTxt(): string {
  return `# Isolated Kennedy Center Honors birth-card scaffold.
# Do not publish this file as the origin robots.txt on cardblueprints.com.

User-agent: *
Allow: /kennedy-center-honors/

# Celebrity person pages and live card-meaning routes stay on their owners.
# Payment and app surfaces stay on the existing Next.js origin.
Disallow: /birth-card/
Disallow: /checkout
Disallow: /checkout/
Disallow: /api/
Disallow: /create-checkout

Sitemap: ${SITE_URL}/sitemap-kennedy-center-honors.xml
`;
}

if (import.meta.main) {
  const result = buildKennedyCenterPages();
  console.log(
    `Built ${result.files.length} files for ${result.people.length} Kennedy Center Honors people → ${result.outDir}`,
  );
}
