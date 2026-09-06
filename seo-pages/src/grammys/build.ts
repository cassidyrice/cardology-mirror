import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_URL } from "../types";
import { renderUrlset } from "../sitemap";
import { loadCardMeanings, loadGrammyRows, loadGrammysProvenance } from "./load";
import { renderGrammysHub } from "./render-hub";
import { renderGrammyPage } from "./render-person";
import type { GrammyRow } from "./types";
import { GRAMMYS_HUB_PATH, GRAMMYS_SITEMAP, grammyPath } from "./urls";

const SEO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_ROOT = join(SEO_ROOT, "..");

export type GrammysBuildOptions = {
  peoplePath?: string;
  provenancePath?: string;
  meaningsPath?: string;
  outDir?: string;
  publicDir?: string;
};

export type GrammysBuildResult = {
  outDir: string;
  people: GrammyRow[];
  files: string[];
};

export function buildGrammyPages(options: GrammysBuildOptions = {}): GrammysBuildResult {
  const peoplePath =
    options.peoplePath ?? join(REPO_ROOT, "pipeline", "data", "grammys", "people.jsonl");
  const provenancePath =
    options.provenancePath ?? join(REPO_ROOT, "pipeline", "data", "grammys", "provenance.json");
  const meaningsPath =
    options.meaningsPath ?? join(REPO_ROOT, "pipeline", "data", "card_meanings.json");
  const outDir = options.outDir ?? join(SEO_ROOT, "dist-grammys");
  const publicDir = options.publicDir ?? join(SEO_ROOT, "public");

  const people = loadGrammyRows(peoplePath);
  const provenance = loadGrammysProvenance(provenancePath);
  const meanings = loadCardMeanings(meaningsPath);
  if (people.length === 0) {
    throw new Error("No Grammy AOTY rows loaded");
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
  write(outDir, "grammys/aoty/index.html", renderGrammysHub(people, meanings, provenance), files);

  for (const person of people) {
    const meaning = meanings.get(person.card);
    if (!meaning) {
      throw new Error(`Missing meaning for ${person.slug}`);
    }
    const sameCard = people.filter((other) => other.slug !== person.slug && other.card === person.card);
    write(
      outDir,
      `${grammyPath(person.slug).replace(/^\//, "")}/index.html`,
      renderGrammyPage(person, meaning, sameCard),
      files,
    );
  }

  const paths = [GRAMMYS_HUB_PATH, ...people.map((person) => grammyPath(person.slug))];
  write(outDir, GRAMMYS_SITEMAP.replace(/^\//, ""), renderUrlset(paths), files);
  write(outDir, "robots.txt", grammysRobotsTxt(), files);

  return { outDir, people, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const target = join(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(relativePath);
}

function grammysRobotsTxt(): string {
  return `# Isolated Grammy Album of the Year birth-card scaffold.
# Do not publish this file as the origin robots.txt on cardblueprints.com.

User-agent: *
Allow: /grammys/aoty/

# Celebrity person pages and live card-meaning routes stay on their owners.
# Payment and app surfaces stay on the existing Next.js origin.
Disallow: /birth-card/
Disallow: /checkout
Disallow: /checkout/
Disallow: /api/
Disallow: /create-checkout

Sitemap: ${SITE_URL}/sitemap-grammy-aoty.xml
`;
}

if (import.meta.main) {
  const result = buildGrammyPages();
  console.log(
    `Built ${result.files.length} files for ${result.people.length} Grammy AOTY people → ${result.outDir}`,
  );
}
