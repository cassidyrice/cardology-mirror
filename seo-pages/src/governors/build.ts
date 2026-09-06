import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_URL } from "../types";
import { renderUrlset } from "../sitemap";
import { loadCardMeanings, loadGovernorRows, loadGovernorsProvenance } from "./load";
import { renderGovernorsHub } from "./render-hub";
import { renderGovernorPage } from "./render-person";
import type { GovernorRow } from "./types";
import { GOVERNORS_HUB_PATH, GOVERNORS_SITEMAP, governorPath } from "./urls";

const SEO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_ROOT = join(SEO_ROOT, "..");

export type GovernorsBuildOptions = {
  peoplePath?: string;
  provenancePath?: string;
  meaningsPath?: string;
  outDir?: string;
  publicDir?: string;
};

export type GovernorsBuildResult = {
  outDir: string;
  people: GovernorRow[];
  files: string[];
};

export function buildGovernorPages(options: GovernorsBuildOptions = {}): GovernorsBuildResult {
  const peoplePath =
    options.peoplePath ?? join(REPO_ROOT, "pipeline", "data", "governors", "people.jsonl");
  const provenancePath =
    options.provenancePath ?? join(REPO_ROOT, "pipeline", "data", "governors", "provenance.json");
  const meaningsPath =
    options.meaningsPath ?? join(REPO_ROOT, "pipeline", "data", "card_meanings.json");
  const outDir = options.outDir ?? join(SEO_ROOT, "dist-governors");
  const publicDir = options.publicDir ?? join(SEO_ROOT, "public");

  const people = loadGovernorRows(peoplePath);
  const provenance = loadGovernorsProvenance(provenancePath);
  const meanings = loadCardMeanings(meaningsPath);
  if (people.length === 0) {
    throw new Error("No governor rows loaded");
  }
  if (people.length !== 49) {
    throw new Error(`Expected 49 verified sitting governors, got ${people.length}`);
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
  write(outDir, "governors/index.html", renderGovernorsHub(people, meanings, provenance), files);

  for (const person of people) {
    const meaning = meanings.get(person.card);
    if (!meaning) {
      throw new Error(`Missing meaning for ${person.slug}`);
    }
    const sameCard = people.filter((other) => other.slug !== person.slug && other.card === person.card);
    write(
      outDir,
      `${governorPath(person.slug).replace(/^\//, "")}/index.html`,
      renderGovernorPage(person, meaning, sameCard),
      files,
    );
  }

  const paths = [GOVERNORS_HUB_PATH, ...people.map((person) => governorPath(person.slug))];
  write(outDir, GOVERNORS_SITEMAP.replace(/^\//, ""), renderUrlset(paths), files);
  write(outDir, "robots.txt", governorsRobotsTxt(), files);

  return { outDir, people, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const target = join(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(relativePath);
}

function governorsRobotsTxt(): string {
  return `# Isolated current-governors birth-card scaffold.
# Do not publish this file as the origin robots.txt on cardblueprints.com.

User-agent: *
Allow: /governors/

# Celebrity person pages and live card-meaning routes stay on their owners.
# Payment and app surfaces stay on the existing Next.js origin.
Disallow: /birth-card/
Disallow: /checkout
Disallow: /checkout/
Disallow: /api/
Disallow: /create-checkout

Sitemap: ${SITE_URL}/sitemap-governors.xml
`;
}

if (import.meta.main) {
  const result = buildGovernorPages();
  console.log(
    `Built ${result.files.length} files for ${result.people.length} governors → ${result.outDir}`,
  );
}
