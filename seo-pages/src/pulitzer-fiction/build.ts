import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_URL } from "../types";
import { renderUrlset } from "../sitemap";
import { loadCardMeanings, loadPulitzerProvenance, loadPulitzerRows } from "./load";
import { renderPulitzerHub } from "./render-hub";
import { renderPulitzerPage } from "./render-person";
import type { PulitzerRow } from "./types";
import { PULITZER_HUB_PATH, PULITZER_SITEMAP, pulitzerPath } from "./urls";

const SEO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_ROOT = join(SEO_ROOT, "..");

export type PulitzerBuildOptions = {
  peoplePath?: string;
  provenancePath?: string;
  meaningsPath?: string;
  outDir?: string;
  publicDir?: string;
};

export type PulitzerBuildResult = {
  outDir: string;
  people: PulitzerRow[];
  files: string[];
};

export function buildPulitzerPages(options: PulitzerBuildOptions = {}): PulitzerBuildResult {
  const peoplePath =
    options.peoplePath ?? join(REPO_ROOT, "pipeline", "data", "pulitzer_fiction", "people.jsonl");
  const provenancePath =
    options.provenancePath ?? join(REPO_ROOT, "pipeline", "data", "pulitzer_fiction", "provenance.json");
  const meaningsPath =
    options.meaningsPath ?? join(REPO_ROOT, "pipeline", "data", "card_meanings.json");
  const outDir = options.outDir ?? join(SEO_ROOT, "dist-pulitzer");
  const publicDir = options.publicDir ?? join(SEO_ROOT, "public");

  const people = loadPulitzerRows(peoplePath);
  const provenance = loadPulitzerProvenance(provenancePath);
  const meanings = loadCardMeanings(meaningsPath);
  if (people.length === 0) {
    throw new Error("No Pulitzer Fiction rows loaded");
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
  write(outDir, "pulitzer/fiction/index.html", renderPulitzerHub(people, meanings, provenance), files);

  for (const person of people) {
    const meaning = meanings.get(person.card);
    if (!meaning) {
      throw new Error(`Missing meaning for ${person.slug}`);
    }
    const sameCard = people.filter((other) => other.slug !== person.slug && other.card === person.card);
    write(
      outDir,
      `${pulitzerPath(person.slug).replace(/^\//, "")}/index.html`,
      renderPulitzerPage(person, meaning, sameCard),
      files,
    );
  }

  const paths = [PULITZER_HUB_PATH, ...people.map((person) => pulitzerPath(person.slug))];
  write(outDir, PULITZER_SITEMAP.replace(/^\//, ""), renderUrlset(paths), files);
  write(outDir, "robots.txt", pulitzerRobotsTxt(), files);

  return { outDir, people, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const target = join(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(relativePath);
}

function pulitzerRobotsTxt(): string {
  return `# Isolated Pulitzer Prize for Fiction birth-card scaffold.
# Do not publish this file as the origin robots.txt on cardblueprints.com.

User-agent: *
Allow: /pulitzer/fiction/

# Celebrity person pages and live card-meaning routes stay on their owners.
# Payment and app surfaces stay on the existing Next.js origin.
Disallow: /birth-card/
Disallow: /checkout
Disallow: /checkout/
Disallow: /api/
Disallow: /create-checkout

Sitemap: ${SITE_URL}/sitemap-pulitzer-fiction.xml
`;
}

if (import.meta.main) {
  const result = buildPulitzerPages();
  console.log(
    `Built ${result.files.length} files for ${result.people.length} Pulitzer Fiction people → ${result.outDir}`,
  );
}
