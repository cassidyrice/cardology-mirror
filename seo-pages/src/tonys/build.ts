import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_URL } from "../types";
import { renderUrlset } from "../sitemap";
import { loadCardMeanings, loadTonyRows, loadTonysProvenance } from "./load";
import { renderTonysHub } from "./render-hub";
import { renderTonyPage } from "./render-person";
import type { TonyRow } from "./types";
import { TONYS_HUB_PATH, TONYS_SITEMAP, tonyPath } from "./urls";

const SEO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_ROOT = join(SEO_ROOT, "..");

export type TonysBuildOptions = {
  peoplePath?: string;
  provenancePath?: string;
  meaningsPath?: string;
  outDir?: string;
  publicDir?: string;
};

export type TonysBuildResult = {
  outDir: string;
  people: TonyRow[];
  files: string[];
};

export function buildTonyPages(options: TonysBuildOptions = {}): TonysBuildResult {
  const peoplePath = options.peoplePath ?? join(REPO_ROOT, "pipeline", "data", "tonys", "people.jsonl");
  const provenancePath =
    options.provenancePath ?? join(REPO_ROOT, "pipeline", "data", "tonys", "provenance.json");
  const meaningsPath =
    options.meaningsPath ?? join(REPO_ROOT, "pipeline", "data", "card_meanings.json");
  const outDir = options.outDir ?? join(SEO_ROOT, "dist-tonys");
  const publicDir = options.publicDir ?? join(SEO_ROOT, "public");

  const people = loadTonyRows(peoplePath);
  const provenance = loadTonysProvenance(provenancePath);
  const meanings = loadCardMeanings(meaningsPath);
  if (people.length === 0) {
    throw new Error("No Tony leading-acting rows loaded");
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
  write(outDir, "tonys/index.html", renderTonysHub(people, meanings, provenance), files);

  for (const person of people) {
    const meaning = meanings.get(person.card);
    if (!meaning) {
      throw new Error(`Missing meaning for ${person.slug}`);
    }
    const sameCard = people.filter((other) => other.slug !== person.slug && other.card === person.card);
    write(
      outDir,
      `${tonyPath(person.slug).replace(/^\//, "")}/index.html`,
      renderTonyPage(person, meaning, sameCard),
      files,
    );
  }

  const paths = [TONYS_HUB_PATH, ...people.map((person) => tonyPath(person.slug))];
  write(outDir, TONYS_SITEMAP.replace(/^\//, ""), renderUrlset(paths), files);
  write(outDir, "robots.txt", tonysRobotsTxt(), files);

  return { outDir, people, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const target = join(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(relativePath);
}

function tonysRobotsTxt(): string {
  return `# Isolated Tony Award leading-acting birth-card scaffold.
# Do not publish this file as the origin robots.txt on cardblueprints.com.

User-agent: *
Allow: /tonys/

# Celebrity person pages and live card-meaning routes stay on their owners.
# Payment and app surfaces stay on the existing Next.js origin.
Disallow: /birth-card/
Disallow: /checkout
Disallow: /checkout/
Disallow: /api/
Disallow: /create-checkout

Sitemap: ${SITE_URL}/sitemap-tonys.xml
`;
}

if (import.meta.main) {
  const result = buildTonyPages();
  console.log(
    `Built ${result.files.length} files for ${result.people.length} Tony leading winners → ${result.outDir}`,
  );
}
