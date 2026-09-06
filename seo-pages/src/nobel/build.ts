import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_URL } from "../types";
import { renderUrlset } from "../sitemap";
import { loadCardMeanings, loadNobelRows } from "./load";
import { renderNobelHub } from "./render-hub";
import { renderNobelPage } from "./render-person";
import type { NobelRow } from "./types";
import { NOBEL_HUB_PATH, NOBEL_SITEMAP, nobelPath } from "./urls";

const SEO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_ROOT = join(SEO_ROOT, "..");

export type NobelBuildOptions = {
  peoplePath?: string;
  meaningsPath?: string;
  outDir?: string;
  publicDir?: string;
};

export type NobelBuildResult = {
  outDir: string;
  people: NobelRow[];
  files: string[];
};

export function buildNobelPages(options: NobelBuildOptions = {}): NobelBuildResult {
  const peoplePath = options.peoplePath ?? join(REPO_ROOT, "pipeline", "data", "nobel", "people.jsonl");
  const meaningsPath =
    options.meaningsPath ?? join(REPO_ROOT, "pipeline", "data", "card_meanings.json");
  const outDir = options.outDir ?? join(SEO_ROOT, "dist-nobel");
  const publicDir = options.publicDir ?? join(SEO_ROOT, "public");

  const people = loadNobelRows(peoplePath);
  const meanings = loadCardMeanings(meaningsPath);
  if (people.length === 0) {
    throw new Error("No Nobel laureate rows loaded");
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
  write(outDir, "nobel/index.html", renderNobelHub(people, meanings), files);

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
      `${nobelPath(person.slug).replace(/^\//, "")}/index.html`,
      renderNobelPage(person, meaning, sameCard, people),
      files,
    );
  }

  const paths = [NOBEL_HUB_PATH, ...people.map((person) => nobelPath(person.slug))];
  write(outDir, NOBEL_SITEMAP.replace(/^\//, ""), renderUrlset(paths), files);
  write(outDir, "robots.txt", nobelRobotsTxt(), files);

  return { outDir, people, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const target = join(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(relativePath);
}

function nobelRobotsTxt(): string {
  return `# Isolated Nobel laureate birth-card scaffold.
# Do not publish this file as the origin robots.txt on cardblueprints.com.

User-agent: *
Allow: /nobel/

# Celebrity person pages and live card-meaning routes stay on their owners.
# Payment and app surfaces stay on the existing Next.js origin.
Disallow: /birth-card/
Disallow: /checkout
Disallow: /checkout/
Disallow: /api/
Disallow: /create-checkout

Sitemap: ${SITE_URL}/sitemap-nobel.xml
`;
}

if (import.meta.main) {
  const result = buildNobelPages();
  console.log(
    `Built ${result.files.length} files for ${result.people.length} Nobel laureates → ${result.outDir}`,
  );
}
