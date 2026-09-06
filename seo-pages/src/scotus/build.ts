import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_URL } from "../types";
import { renderUrlset } from "../sitemap";
import { loadCardMeanings, loadScotusRows } from "./load";
import { renderScotusHub } from "./render-hub";
import { renderScotusPage } from "./render-person";
import type { ScotusRow } from "./types";
import { SCOTUS_HUB_PATH, SCOTUS_SITEMAP, scotusPath } from "./urls";

const SEO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_ROOT = join(SEO_ROOT, "..");

export type ScotusBuildOptions = {
  peoplePath?: string;
  meaningsPath?: string;
  outDir?: string;
  publicDir?: string;
};

export type ScotusBuildResult = {
  outDir: string;
  people: ScotusRow[];
  files: string[];
};

export function buildScotusPages(options: ScotusBuildOptions = {}): ScotusBuildResult {
  const peoplePath = options.peoplePath ?? join(REPO_ROOT, "pipeline", "data", "scotus", "people.jsonl");
  const meaningsPath =
    options.meaningsPath ?? join(REPO_ROOT, "pipeline", "data", "card_meanings.json");
  const outDir = options.outDir ?? join(SEO_ROOT, "dist-scotus");
  const publicDir = options.publicDir ?? join(SEO_ROOT, "public");

  const people = loadScotusRows(peoplePath);
  const meanings = loadCardMeanings(meaningsPath);
  if (people.length === 0) {
    throw new Error("No SCOTUS justice rows loaded");
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
  write(outDir, "scotus/index.html", renderScotusHub(people, meanings), files);

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
      `${scotusPath(person.slug).replace(/^\//, "")}/index.html`,
      renderScotusPage(person, meaning, sameCard),
      files,
    );
  }

  const paths = [SCOTUS_HUB_PATH, ...people.map((person) => scotusPath(person.slug))];
  write(outDir, SCOTUS_SITEMAP.replace(/^\//, ""), renderUrlset(paths), files);
  write(outDir, "robots.txt", scotusRobotsTxt(), files);

  return { outDir, people, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const target = join(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(relativePath);
}

function scotusRobotsTxt(): string {
  return `# Isolated SCOTUS justices birth-card scaffold.
# Do not publish this file as the origin robots.txt on cardblueprints.com.

User-agent: *
Allow: /scotus/

# Celebrity person pages and live card-meaning routes stay on their owners.
# Payment and app surfaces stay on the existing Next.js origin.
Disallow: /birth-card/
Disallow: /checkout
Disallow: /checkout/
Disallow: /api/
Disallow: /create-checkout

Sitemap: ${SITE_URL}/sitemap-scotus.xml
`;
}

if (import.meta.main) {
  const result = buildScotusPages();
  console.log(
    `Built ${result.files.length} files for ${result.people.length} sitting justices → ${result.outDir}`,
  );
}
