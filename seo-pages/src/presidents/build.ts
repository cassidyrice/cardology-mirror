import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_URL } from "../types";
import { renderUrlset } from "../sitemap";
import { loadCardMeanings, loadPresidentRows } from "./load";
import { renderPresidentsHub } from "./render-hub";
import { renderPresidentPage } from "./render-person";
import type { PresidentRow } from "./types";
import { PRESIDENTS_HUB_PATH, PRESIDENTS_SITEMAP, presidentPath } from "./urls";

const SEO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_ROOT = join(SEO_ROOT, "..");

export type PresidentsBuildOptions = {
  peoplePath?: string;
  meaningsPath?: string;
  outDir?: string;
  publicDir?: string;
};

export type PresidentsBuildResult = {
  outDir: string;
  people: PresidentRow[];
  files: string[];
};

export function buildPresidentPages(options: PresidentsBuildOptions = {}): PresidentsBuildResult {
  const peoplePath = options.peoplePath ?? join(REPO_ROOT, "pipeline", "data", "presidents", "people.jsonl");
  const meaningsPath =
    options.meaningsPath ?? join(REPO_ROOT, "pipeline", "data", "card_meanings.json");
  const outDir = options.outDir ?? join(SEO_ROOT, "dist-presidents");
  const publicDir = options.publicDir ?? join(SEO_ROOT, "public");

  const people = loadPresidentRows(peoplePath);
  const meanings = loadCardMeanings(meaningsPath);
  if (people.length === 0) {
    throw new Error("No president rows loaded");
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
  write(outDir, "presidents/index.html", renderPresidentsHub(people, meanings), files);

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
      `${presidentPath(person.slug).replace(/^\//, "")}/index.html`,
      renderPresidentPage(person, meaning, sameCard),
      files,
    );
  }

  const paths = [PRESIDENTS_HUB_PATH, ...people.map((person) => presidentPath(person.slug))];
  write(outDir, PRESIDENTS_SITEMAP.replace(/^\//, ""), renderUrlset(paths), files);
  write(outDir, "robots.txt", presidentsRobotsTxt(), files);

  return { outDir, people, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const target = join(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(relativePath);
}

function presidentsRobotsTxt(): string {
  return `# Isolated presidents birth-card scaffold.
# Do not publish this file as the origin robots.txt on cardblueprints.com.

User-agent: *
Allow: /presidents/

# Celebrity person pages and live card-meaning routes stay on their owners.
# Payment and app surfaces stay on the existing Next.js origin.
Disallow: /birth-card/
Disallow: /checkout
Disallow: /checkout/
Disallow: /api/
Disallow: /create-checkout

Sitemap: ${SITE_URL}/sitemap-presidents.xml
`;
}

if (import.meta.main) {
  const result = buildPresidentPages();
  console.log(
    `Built ${result.files.length} files for ${result.people.length} presidents → ${result.outDir}`,
  );
}
