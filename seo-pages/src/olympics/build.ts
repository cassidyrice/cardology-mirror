import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_URL } from "../types";
import { renderUrlset } from "../sitemap";
import { loadCardMeanings, loadOlympicsProvenance, loadOlympicsRows } from "./load";
import { renderOlympicsHub } from "./render-hub";
import { renderOlympicsPage } from "./render-person";
import type { OlympicRow } from "./types";
import { OLYMPICS_HUB_PATH, OLYMPICS_SITEMAP, olympicsPath } from "./urls";

const SEO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_ROOT = join(SEO_ROOT, "..");

export type OlympicsBuildOptions = {
  peoplePath?: string;
  provenancePath?: string;
  meaningsPath?: string;
  outDir?: string;
  publicDir?: string;
};

export type OlympicsBuildResult = {
  outDir: string;
  people: OlympicRow[];
  files: string[];
};

export function buildOlympicsPages(options: OlympicsBuildOptions = {}): OlympicsBuildResult {
  const peoplePath =
    options.peoplePath ?? join(REPO_ROOT, "pipeline", "data", "olympics", "people.jsonl");
  const provenancePath =
    options.provenancePath ?? join(REPO_ROOT, "pipeline", "data", "olympics", "provenance.json");
  const meaningsPath =
    options.meaningsPath ?? join(REPO_ROOT, "pipeline", "data", "card_meanings.json");
  const outDir = options.outDir ?? join(SEO_ROOT, "dist-olympics");
  const publicDir = options.publicDir ?? join(SEO_ROOT, "public");

  const people = loadOlympicsRows(peoplePath);
  const provenance = loadOlympicsProvenance(provenancePath);
  const meanings = loadCardMeanings(meaningsPath);
  if (people.length === 0) {
    throw new Error("No Summer Olympian rows loaded");
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
  write(outDir, "olympics/summer/index.html", renderOlympicsHub(people, meanings, provenance), files);

  for (const person of people) {
    const meaning = meanings.get(person.card);
    if (!meaning) {
      throw new Error(`Missing meaning for ${person.slug}`);
    }
    const sameCard = people.filter(
      (other) => other.slug !== person.slug && other.card === person.card,
    );
    write(
      outDir,
      `${olympicsPath(person.slug).replace(/^\//, "")}/index.html`,
      renderOlympicsPage(person, meaning, sameCard),
      files,
    );
  }

  const paths = [OLYMPICS_HUB_PATH, ...people.map((person) => olympicsPath(person.slug))];
  write(outDir, OLYMPICS_SITEMAP.replace(/^\//, ""), renderUrlset(paths), files);
  write(outDir, "robots.txt", olympicsRobotsTxt(), files);

  return { outDir, people, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const target = join(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(relativePath);
}

function olympicsRobotsTxt(): string {
  return `# Isolated Summer Olympian birth-card scaffold.
# Do not publish this file as the origin robots.txt on cardblueprints.com.

User-agent: *
Allow: /olympics/summer/

# Celebrity person pages and live card-meaning routes stay on their owners.
# Payment and app surfaces stay on the existing Next.js origin.
Disallow: /birth-card/
Disallow: /checkout
Disallow: /checkout/
Disallow: /api/
Disallow: /create-checkout

Sitemap: ${SITE_URL}/sitemap-olympics-summer.xml
`;
}

if (import.meta.main) {
  const result = buildOlympicsPages();
  console.log(
    `Built ${result.files.length} files for ${result.people.length} Summer Olympians → ${result.outDir}`,
  );
}
