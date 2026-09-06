import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_URL } from "../types";
import { renderUrlset } from "../sitemap";
import { attachPeople, loadBornOnDays, loadBornOnPeople, loadBornOnProvenance, loadCardMeanings } from "./load";
import { renderBornOnHub } from "./render-hub";
import { renderBornOnDay } from "./render-day";
import type { BornOnDayPage } from "./types";
import { BORN_ON_HUB_PATH, BORN_ON_SITEMAP, bornOnDayPath } from "./urls";

const SEO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_ROOT = join(SEO_ROOT, "..");

export type BornOnBuildOptions = {
  peoplePath?: string;
  daysPath?: string;
  provenancePath?: string;
  meaningsPath?: string;
  outDir?: string;
  publicDir?: string;
};

export type BornOnBuildResult = {
  outDir: string;
  days: BornOnDayPage[];
  files: string[];
};

export function buildBornOnPages(options: BornOnBuildOptions = {}): BornOnBuildResult {
  const peoplePath = options.peoplePath ?? join(REPO_ROOT, "pipeline", "data", "born-on", "people.jsonl");
  const daysPath = options.daysPath ?? join(REPO_ROOT, "pipeline", "data", "born-on", "days.jsonl");
  const provenancePath =
    options.provenancePath ?? join(REPO_ROOT, "pipeline", "data", "born-on", "provenance.json");
  const meaningsPath = options.meaningsPath ?? join(REPO_ROOT, "pipeline", "data", "card_meanings.json");
  const outDir = options.outDir ?? join(SEO_ROOT, "dist-born-on");
  const publicDir = options.publicDir ?? join(SEO_ROOT, "public");

  const people = loadBornOnPeople(peoplePath);
  const dayRows = loadBornOnDays(daysPath);
  const days = attachPeople(dayRows, people);
  const provenance = loadBornOnProvenance(provenancePath);
  const meanings = loadCardMeanings(meaningsPath);

  if (days.length !== 366) {
    throw new Error(`Expected 366 born-on days, got ${days.length}`);
  }
  for (const day of days) {
    if (!meanings.has(day.card)) {
      throw new Error(`No harvested meaning for ${day.slug} card ${day.card}`);
    }
    if (day.cardRef.kind === "joker" && (day.month !== 12 || day.day !== 31)) {
      throw new Error(`Joker card on a non-December 31 page: ${day.slug}`);
    }
  }

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  cpSync(publicDir, outDir, { recursive: true });

  const files: string[] = [];
  write(outDir, "born-on/index.html", renderBornOnHub(days, meanings, provenance), files);

  for (const day of days) {
    const meaning = meanings.get(day.card);
    if (!meaning) {
      throw new Error(`Missing meaning for ${day.slug}`);
    }
    write(
      outDir,
      `${bornOnDayPath(day.slug).replace(/^\//, "")}/index.html`,
      renderBornOnDay(day, meaning, days),
      files,
    );
  }

  const paths = [BORN_ON_HUB_PATH, ...days.map((day) => bornOnDayPath(day.slug))];
  write(outDir, BORN_ON_SITEMAP.replace(/^\//, ""), renderUrlset(paths), files);
  write(outDir, "robots.txt", bornOnRobotsTxt(), files);

  return { outDir, days, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const target = join(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(relativePath);
}

function bornOnRobotsTxt(): string {
  return `# Isolated /born-on grounding scaffold.
# Do not publish this file as the origin robots.txt on cardblueprints.com.
# Live /born-on is still the cardology-unlock Worker until Cass path-splits.

User-agent: *
Allow: /born-on/

# Celebrity person pages and live card-meaning routes stay on their owners.
# Payment and app surfaces stay on the existing Next.js origin.
Disallow: /birth-card/
Disallow: /checkout
Disallow: /checkout/
Disallow: /api/
Disallow: /create-checkout

Sitemap: ${SITE_URL}/sitemap-born-on.xml
`;
}

if (import.meta.main) {
  const result = buildBornOnPages();
  const withPeople = result.days.filter((day) => day.people_count > 0).length;
  console.log(
    `Built ${result.files.length} files for ${result.days.length} days (${withPeople} grounded) → ${result.outDir}`,
  );
}
