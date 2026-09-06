import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_URL } from "../types";
import { renderUrlset } from "../sitemap";
import { loadCardMeanings, loadSignerRows, loadSignersProvenance } from "./load";
import { renderSignersHub } from "./render-hub";
import { renderSignerPage } from "./render-person";
import type { SignerRow } from "./types";
import { SIGNERS_HUB_PATH, SIGNERS_SITEMAP, signerPath } from "./urls";

const SEO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_ROOT = join(SEO_ROOT, "..");

export type SignersBuildOptions = {
  peoplePath?: string;
  provenancePath?: string;
  meaningsPath?: string;
  outDir?: string;
  publicDir?: string;
};

export type SignersBuildResult = {
  outDir: string;
  people: SignerRow[];
  files: string[];
};

export function buildSignerPages(options: SignersBuildOptions = {}): SignersBuildResult {
  const peoplePath = options.peoplePath ?? join(REPO_ROOT, "pipeline", "data", "signers", "people.jsonl");
  const provenancePath =
    options.provenancePath ?? join(REPO_ROOT, "pipeline", "data", "signers", "provenance.json");
  const meaningsPath =
    options.meaningsPath ?? join(REPO_ROOT, "pipeline", "data", "card_meanings.json");
  const outDir = options.outDir ?? join(SEO_ROOT, "dist-signers");
  const publicDir = options.publicDir ?? join(SEO_ROOT, "public");

  const people = loadSignerRows(peoplePath);
  const provenance = loadSignersProvenance(provenancePath);
  const meanings = loadCardMeanings(meaningsPath);
  if (people.length === 0) {
    throw new Error("No signer rows loaded");
  }
  if (people.length !== 44) {
    throw new Error(`Expected 44 verified signers, got ${people.length}`);
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
  write(outDir, "signers/index.html", renderSignersHub(people, meanings, provenance), files);

  for (const person of people) {
    const meaning = meanings.get(person.card);
    if (!meaning) {
      throw new Error(`Missing meaning for ${person.slug}`);
    }
    const sameCard = people.filter((other) => other.slug !== person.slug && other.card === person.card);
    write(
      outDir,
      `${signerPath(person.slug).replace(/^\//, "")}/index.html`,
      renderSignerPage(person, meaning, sameCard),
      files,
    );
  }

  const paths = [SIGNERS_HUB_PATH, ...people.map((person) => signerPath(person.slug))];
  write(outDir, SIGNERS_SITEMAP.replace(/^\//, ""), renderUrlset(paths), files);
  write(outDir, "robots.txt", signersRobotsTxt(), files);

  return { outDir, people, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const target = join(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(relativePath);
}

function signersRobotsTxt(): string {
  return `# Isolated Declaration signers birth-card scaffold.
# Do not publish this file as the origin robots.txt on cardblueprints.com.

User-agent: *
Allow: /signers/

# Celebrity person pages and live card-meaning routes stay on their owners.
# Payment and app surfaces stay on the existing Next.js origin.
Disallow: /birth-card/
Disallow: /checkout
Disallow: /checkout/
Disallow: /api/
Disallow: /create-checkout

Sitemap: ${SITE_URL}/sitemap-signers.xml
`;
}

if (import.meta.main) {
  const result = buildSignerPages();
  console.log(`Built ${result.files.length} files for ${result.people.length} signers → ${result.outDir}`);
}
