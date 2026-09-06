import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_URL } from "../types";
import { renderUrlset } from "../sitemap";
import { loadCardMeanings, loadEmmyProvenance, loadEmmyRows } from "./load";
import { renderEmmysHub } from "./render-hub";
import { renderEmmyPage } from "./render-person";
import type { EmmyRow } from "./types";
import { EMMYS_HUB_PATH, EMMYS_SITEMAP, emmyPath } from "./urls";

const SEO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_ROOT = join(SEO_ROOT, "..");

export type EmmyBuildOptions = {
  peoplePath?: string;
  provenancePath?: string;
  meaningsPath?: string;
  outDir?: string;
  publicDir?: string;
};

export type EmmyBuildResult = {
  outDir: string;
  people: EmmyRow[];
  files: string[];
};

export function buildEmmyPages(options: EmmyBuildOptions = {}): EmmyBuildResult {
  const peoplePath = options.peoplePath ?? join(REPO_ROOT, "pipeline", "data", "emmys", "people.jsonl");
  const provenancePath =
    options.provenancePath ?? join(REPO_ROOT, "pipeline", "data", "emmys", "provenance.json");
  const meaningsPath =
    options.meaningsPath ?? join(REPO_ROOT, "pipeline", "data", "card_meanings.json");
  const outDir = options.outDir ?? join(SEO_ROOT, "dist-emmys");
  const publicDir = options.publicDir ?? join(SEO_ROOT, "public");

  const people = loadEmmyRows(peoplePath);
  const provenance = loadEmmyProvenance(provenancePath);
  const meanings = loadCardMeanings(meaningsPath);
  if (people.length === 0) {
    throw new Error("No Emmy winner rows loaded");
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
  write(outDir, "emmys/index.html", renderEmmysHub(people, meanings, provenance), files);

  for (const person of people) {
    const meaning = meanings.get(person.card);
    if (!meaning) {
      throw new Error(`Missing meaning for ${person.slug}`);
    }
    const sameCard = people.filter((other) => other.slug !== person.slug && other.card === person.card);
    write(
      outDir,
      `${emmyPath(person.slug).replace(/^\//, "")}/index.html`,
      renderEmmyPage(person, meaning, sameCard),
      files,
    );
  }

  const paths = [EMMYS_HUB_PATH, ...people.map((person) => emmyPath(person.slug))];
  write(outDir, EMMYS_SITEMAP.replace(/^\//, ""), renderUrlset(paths), files);
  write(outDir, "robots.txt", emmysRobotsTxt(), files);

  return { outDir, people, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const target = join(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(relativePath);
}

function emmysRobotsTxt(): string {
  return `# Isolated Primetime Emmy Lead Actor/Actress birth-card scaffold.
# Do not publish this file as the origin robots.txt on cardblueprints.com.

User-agent: *
Allow: /emmys/

# Celebrity person pages and live card-meaning routes stay on their owners.
# Payment and app surfaces stay on the existing Next.js origin.
Disallow: /birth-card/
Disallow: /checkout
Disallow: /checkout/
Disallow: /api/
Disallow: /create-checkout

Sitemap: ${SITE_URL}/sitemap-emmys.xml
`;
}

if (import.meta.main) {
  const result = buildEmmyPages();
  console.log(
    `Built ${result.files.length} files for ${result.people.length} Emmy winners → ${result.outDir}`,
  );
}
