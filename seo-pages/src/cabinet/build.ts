import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_URL } from "../types";
import { renderUrlset } from "../sitemap";
import { loadCabinetProvenance, loadCabinetRows, loadCardMeanings } from "./load";
import { renderCabinetHub } from "./render-hub";
import { renderCabinetPage } from "./render-person";
import type { CabinetRow } from "./types";
import { CABINET_HUB_PATH, CABINET_SITEMAP, cabinetPath } from "./urls";

const SEO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_ROOT = join(SEO_ROOT, "..");

export type CabinetBuildOptions = {
  peoplePath?: string;
  provenancePath?: string;
  meaningsPath?: string;
  outDir?: string;
  publicDir?: string;
};

export type CabinetBuildResult = {
  outDir: string;
  people: CabinetRow[];
  files: string[];
};

export function buildCabinetPages(options: CabinetBuildOptions = {}): CabinetBuildResult {
  const peoplePath =
    options.peoplePath ?? join(REPO_ROOT, "pipeline", "data", "cabinet", "people.jsonl");
  const provenancePath =
    options.provenancePath ?? join(REPO_ROOT, "pipeline", "data", "cabinet", "provenance.json");
  const meaningsPath =
    options.meaningsPath ?? join(REPO_ROOT, "pipeline", "data", "card_meanings.json");
  const outDir = options.outDir ?? join(SEO_ROOT, "dist-cabinet");
  const publicDir = options.publicDir ?? join(SEO_ROOT, "public");

  const people = loadCabinetRows(peoplePath);
  const provenance = loadCabinetProvenance(provenancePath);
  const meanings = loadCardMeanings(meaningsPath);
  if (people.length === 0) {
    throw new Error("No cabinet rows loaded");
  }
  if (people.length !== 16) {
    throw new Error(`Expected 16 verified sitting Cabinet officers, got ${people.length}`);
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
  write(outDir, "cabinet/index.html", renderCabinetHub(people, meanings, provenance), files);

  for (const person of people) {
    const meaning = meanings.get(person.card);
    if (!meaning) {
      throw new Error(`Missing meaning for ${person.slug}`);
    }
    const sameCard = people.filter((other) => other.slug !== person.slug && other.card === person.card);
    write(
      outDir,
      `${cabinetPath(person.slug).replace(/^\//, "")}/index.html`,
      renderCabinetPage(person, meaning, sameCard),
      files,
    );
  }

  const paths = [CABINET_HUB_PATH, ...people.map((person) => cabinetPath(person.slug))];
  write(outDir, CABINET_SITEMAP.replace(/^\//, ""), renderUrlset(paths), files);
  write(outDir, "robots.txt", cabinetRobotsTxt(), files);

  return { outDir, people, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const target = join(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(relativePath);
}

function cabinetRobotsTxt(): string {
  return `# Isolated current-cabinet birth-card scaffold.
# Do not publish this file as the origin robots.txt on cardblueprints.com.

User-agent: *
Allow: /cabinet/

# Celebrity person pages and live card-meaning routes stay on their owners.
# Payment and app surfaces stay on the existing Next.js origin.
Disallow: /birth-card/
Disallow: /checkout
Disallow: /checkout/
Disallow: /api/
Disallow: /create-checkout

Sitemap: ${SITE_URL}/sitemap-cabinet.xml
`;
}

if (import.meta.main) {
  const result = buildCabinetPages();
  console.log(
    `Built ${result.files.length} files for ${result.people.length} cabinet officers → ${result.outDir}`,
  );
}
